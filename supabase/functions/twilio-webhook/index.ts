import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import {
  brandMessage,
  CONSENT_GRANTED_BODY,
  CONSENT_GRANTED_WITH_HELD_BODY,
  CONSENT_PROMPT_BODY,
  decideInboundAction,
  HELP_REPLY,
  normalizePhone,
  OPT_OUT_CONFIRMATION,
} from '../_shared/sms.ts';

function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function twiml(body: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${xmlEscape(body)}</Message></Response>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

/** Branded reply: adds the registered brand prefix and opt-out suffix. */
function twimlResponse(message: string): Response {
  return twiml(brandMessage(message));
}

/** 200 with no message. Used when we must not reply at all. */
function twimlSilent(): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}

/**
 * Verbatim reply. Used for the opt-out confirmation (which must not tell the
 * user to reply STOP again) and the help reply (which carries its own text).
 */
function twimlRawResponse(message: string): Response {
  return twiml(message);
}

// Chunked base64 — spread crashes on large arrays.
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

async function verifyTwilioSignature(
  req: Request,
  params: URLSearchParams,
  authToken: string,
): Promise<boolean> {
  const signature = req.headers.get('x-twilio-signature');
  if (!signature) return false;

  const url = Deno.env.get('TWILIO_WEBHOOK_URL') || req.url;
  const sortedKeys = Array.from(params.keys()).sort();
  let dataString = url;
  for (const key of sortedKeys) {
    dataString += key + params.get(key);
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(dataString));
  const expected = uint8ToBase64(new Uint8Array(sig));

  return signature === expected;
}

type SupabaseClient = ReturnType<typeof createServiceClient>;

type ConsentStatus = 'pending' | 'granted' | 'revoked';

async function getConsentStatus(
  supabase: SupabaseClient,
  phone: string,
): Promise<ConsentStatus | null> {
  const { data, error } = await supabase
    .from('sms_consents')
    .select('status')
    .eq('phone', phone)
    .maybeSingle();
  if (error) {
    console.error('Consent lookup failed:', error);
    return null;
  }
  return (data?.status as ConsentStatus | undefined) ?? null;
}

async function grantConsent(
  supabase: SupabaseClient,
  phone: string,
  messageSid: string,
  body: string,
): Promise<void> {
  const { error } = await supabase
    .from('sms_consents')
    .upsert({
      phone,
      status: 'granted',
      granted_at: new Date().toISOString(),
      revoked_at: null,
      granting_message_sid: messageSid,
      granting_message_body: body,
    }, { onConflict: 'phone' });
  if (error) console.error('Failed to record consent grant:', error);
}

async function revokeConsent(supabase: SupabaseClient, phone: string): Promise<void> {
  const { error } = await supabase
    .from('sms_consents')
    .upsert({
      phone,
      status: 'revoked',
      revoked_at: new Date().toISOString(),
    }, { onConflict: 'phone' });
  if (error) console.error('Failed to record consent revocation:', error);
}

/** Records that we sent the consent prompt. Never downgrades an existing row. */
async function recordConsentPrompt(supabase: SupabaseClient, phone: string): Promise<void> {
  const { error } = await supabase
    .from('sms_consents')
    .upsert({
      phone,
      status: 'pending',
      prompt_sent_at: new Date().toISOString(),
    }, { onConflict: 'phone' });
  if (error) console.error('Failed to record consent prompt:', error);
}

/**
 * Kick the async processor via pg_net. Fire-and-forget: pg_net queues the HTTP
 * call in Postgres and delivers it in the background, so this returns in
 * milliseconds and does not block the Twilio response.
 */
async function enqueueProcessing(supabase: SupabaseClient, smsId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { error } = await supabase.rpc('enqueue_sms_processing', {
    p_sms_id: smsId,
    p_function_url: `${supabaseUrl}/functions/v1/process-sms-score`,
    p_service_role_key: serviceRoleKey,
  });
  if (error) console.error('Failed to enqueue processor:', error);
  return !error;
}

/**
 * Releases scoresheets that arrived before the captain consented. They were
 * parked rather than dropped, so a captain never has to resend the photo.
 */
async function releaseHeldMessages(
  supabase: SupabaseClient,
  fromPhone: string,
): Promise<number> {
  const { data, error } = await supabase
    .from('sms_pending_scores')
    .update({ status: 'queued' })
    .eq('from_phone', fromPhone)
    .eq('status', 'awaiting_consent')
    .select('id');
  if (error) {
    console.error('Failed to release held messages:', error);
    return 0;
  }
  const rows = data ?? [];
  for (const row of rows) {
    await enqueueProcessing(supabase, row.id as string);
  }
  return rows.length;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not configured');
    return new Response('Server misconfigured', { status: 500 });
  }

  const formData = await req.formData();
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    params.set(key, value as string);
  }

  const valid = await verifyTwilioSignature(req, params, authToken);
  if (!valid) {
    console.error('Twilio signature verification failed');
    return new Response('Invalid signature', { status: 403 });
  }

  const messageSid = formData.get('MessageSid') as string || '';
  const fromPhone = formData.get('From') as string || '';
  const body = formData.get('Body') as string || '';
  const mediaUrl0 = formData.get('MediaUrl0') as string | null;

  if (!messageSid) {
    console.error('Missing MessageSid on Twilio request');
    return twimlResponse('Sorry, we could not process your message.');
  }

  const supabase = createServiceClient();
  const phone = normalizePhone(fromPhone);

  // What to do with this message. The decision (and critically its ordering)
  // lives in _shared/sms.ts as a pure function so it is unit-tested; this
  // handler only carries it out. Twilio's Advanced Opt-Out intercepts STOP for
  // US long codes before it reaches us, so the opt-out branch is a backstop
  // that also keeps our own ledger accurate when it does arrive.
  const consent = await getConsentStatus(supabase, phone);
  const action = decideInboundAction(body, consent);

  if (action === 'revoke-and-confirm') {
    await revokeConsent(supabase, phone);
    return twimlRawResponse(OPT_OUT_CONFIRMATION);
  }

  if (action === 'help-reply') {
    return twimlRawResponse(HELP_REPLY);
  }

  if (action === 'grant-and-release') {
    await grantConsent(supabase, phone, messageSid, body);
    const released = await releaseHeldMessages(supabase, fromPhone);
    return twimlResponse(
      released > 0 ? CONSENT_GRANTED_WITH_HELD_BODY : CONSENT_GRANTED_BODY,
    );
  }

  if (action === 'ignore-silently') {
    console.warn(`Inbound from opted-out number ${phone}; ignoring without reply.`);
    return twimlSilent();
  }

  // --- Consent gate --------------------------------------------------------
  // Carriers require explicit documented consent before we send to a number.
  // Anything not already granted gets parked and prompted instead of
  // processed, so the scoresheet survives but no un-consented reply goes out.
  const hasConsent = action === 'process';

  // Idempotency: insert row keyed on MessageSid. If Twilio retries (or
  // delivers the same MMS twice), the unique index makes the second insert
  // fail and we short-circuit without re-triggering processing.
  const { data: inserted, error: insertError } = await supabase
    .from('sms_pending_scores')
    .insert({
      twilio_message_sid: messageSid,
      from_phone: fromPhone,
      body,
      media_url: mediaUrl0,
      status: hasConsent ? 'queued' : 'awaiting_consent',
    })
    .select('id')
    .single();

  if (insertError) {
    // 23505 = unique_violation — this is a Twilio retry, already queued.
    // Any other error is real; still respond 200 so Twilio doesn't retry.
    if (insertError.code === '23505') {
      return hasConsent
        ? twimlResponse('Got it - your scoresheet is already being processed.')
        : twimlResponse(CONSENT_PROMPT_BODY);
    }
    console.error('Failed to enqueue SMS:', insertError);
    return twimlResponse('Sorry, we hit a technical issue. Please try again in a minute.');
  }

  if (!hasConsent) {
    await recordConsentPrompt(supabase, phone);
    return twimlResponse(CONSENT_PROMPT_BODY);
  }

  if (!await enqueueProcessing(supabase, inserted.id as string)) {
    // Row is queued; a drainer can pick it up later. Still tell the
    // captain something reasonable.
    return twimlResponse('Got your scoresheet - an admin will review it shortly.');
  }

  return twimlResponse('Got it! Reading your scoresheet - we\'ll text back with the result in a minute.');
});
