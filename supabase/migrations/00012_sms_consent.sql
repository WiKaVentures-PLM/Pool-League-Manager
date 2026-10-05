-- ============================================
-- SMS CONSENT (A2P 10DLC double opt-in)
-- ============================================
-- Mobile carriers require documented, explicit consent before we send SMS to a
-- number. Twilio's campaign vetting rejected an "inbound message is consent"
-- argument outright and asked for an explicit confirmation prompt, so this table
-- is the audit trail: who was prompted, who replied YES, with the exact message
-- that granted it.
--
-- Only the service role (edge functions) touches this table. RLS is enabled with
-- no policies so that any accidental anon/authenticated access is denied.

create table if not exists sms_consents (
  id uuid primary key default gen_random_uuid(),
  -- Normalized to last 10 digits, matching normalizePhone() in the edge functions.
  phone text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'granted', 'revoked')),
  prompt_sent_at timestamptz,
  granted_at timestamptz,
  revoked_at timestamptz,
  -- Audit: the inbound message that granted consent.
  granting_message_sid text,
  granting_message_body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sms_consents_status on sms_consents(status);

drop trigger if exists sms_consents_updated_at on sms_consents;
create trigger sms_consents_updated_at
  before update on sms_consents
  for each row execute function update_updated_at();

alter table sms_consents enable row level security;

-- ============================================
-- HOLD INBOUND MESSAGES PENDING CONSENT
-- ============================================
-- A captain who texts a scoresheet before consenting should not lose it. We park
-- the row as 'awaiting_consent' and release it to 'queued' once they reply YES,
-- so they never have to resend the photo.

alter table sms_pending_scores
  drop constraint if exists sms_pending_scores_status_check;

alter table sms_pending_scores
  add constraint sms_pending_scores_status_check
  check (status in (
    'queued', 'processing', 'pending', 'processed', 'failed', 'awaiting_consent'
  ));

create index if not exists idx_sms_pending_awaiting_consent
  on sms_pending_scores(from_phone, created_at)
  where status = 'awaiting_consent';
