// Brand, opt-out language, and consent handling registered on our A2P 10DLC
// campaign with the mobile carriers. Every outbound SMS must carry the brand and
// opt-out language, in both the TwiML replies from twilio-webhook and the Twilio
// REST replies from process-sms-score, so that real traffic matches the sample
// messages filed in the campaign registration.
//
// If you change any wording here, update the campaign registration in the Twilio
// console to match — mismatched samples are a documented rejection reason.

const BRAND_PREFIX = 'Pool League Manager: ';
const COMPLIANCE_SUFFIX = ' Reply STOP to opt out, HELP for help.';

/** Wraps a message body in the registered brand prefix and opt-out suffix. */
export function brandMessage(body: string): string {
  return `${BRAND_PREFIX}${body}${COMPLIANCE_SUFFIX}`;
}

/** Last 10 digits. Keep identical across every function that matches phones. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

// Keyword lists as filed on the campaign registration.
const OPT_IN_KEYWORDS = ['YES', 'START', 'UNSTOP'];
const OPT_OUT_KEYWORDS = [
  'OPTOUT', 'CANCEL', 'END', 'QUIT', 'UNSUBSCRIBE', 'REVOKE', 'STOP', 'STOPALL',
];
const HELP_KEYWORDS = ['HELP', 'INFO'];

/** Normalizes an inbound body to a bare keyword for matching. Internal. */
function asKeyword(body: string | null | undefined): string {
  return (body ?? '').trim().replace(/[.!?]+$/, '').toUpperCase();
}

export function isOptIn(body: string | null | undefined): boolean {
  return OPT_IN_KEYWORDS.includes(asKeyword(body));
}

export function isOptOut(body: string | null | undefined): boolean {
  return OPT_OUT_KEYWORDS.includes(asKeyword(body));
}

export function isHelp(body: string | null | undefined): boolean {
  return HELP_KEYWORDS.includes(asKeyword(body));
}

// --- Message bodies ---------------------------------------------------------
// These get wrapped by brandMessage().

/** Explicit consent request. Sent once, on first contact from a new number. */
export const CONSENT_PROMPT_BODY =
  'Reply YES to confirm you agree to receive score confirmation texts for your pool league. ' +
  'Msg frequency varies, msg & data rates may apply.';

/** Confirmation after a captain replies YES. This is the filed opt-in message. */
export const CONSENT_GRANTED_BODY =
  "You're subscribed to score confirmation texts for your pool league. " +
  'Text a photo of your scoresheet any time to submit scores.';

/** Sent when a held scoresheet is released for processing after consent. */
export const CONSENT_GRANTED_WITH_HELD_BODY =
  "You're subscribed to score confirmation texts for your pool league. " +
  "We're reading the scoresheet you already sent and will text back shortly.";

// --- Raw messages -----------------------------------------------------------
// Sent verbatim, NOT through brandMessage: an opt-out confirmation must not tell
// the user to reply STOP again, and the help reply carries its own instructions.
// Both match the auto-replies filed on the campaign registration.

export const OPT_OUT_CONFIRMATION =
  'Pool League Manager: You have successfully been unsubscribed. ' +
  'You will not receive any more messages from this number. Reply START to resubscribe.';

export const HELP_REPLY =
  'Pool League Manager: Text a photo of your match scoresheet to this number to submit ' +
  'your scores. For help, visit pool-league-manager.com or contact your league administrator. ' +
  'Msg & data rates may apply. Reply STOP to opt out.';
