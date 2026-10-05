-- ============================================
-- LOGIN EVENTS
-- ============================================
-- We need login counts for the platform admin view. Supabase's own
-- auth.audit_log_entries is empty on this project (verified Oct 5 2026:
-- min(created_at) was null while real logins existed), and Supabase prunes it
-- anyway, so it cannot be the source of truth. auth.users.last_sign_in_at is
-- reliable but is a single timestamp, not a count.
--
-- So record logins ourselves. Written by the login server action using the
-- service role, which is why RLS is enabled with no policies: nothing with a
-- user JWT should read or write this directly. Reporting goes through the
-- security definer platform_* functions.
--
-- Caveat: this only captures logins that pass through the app's login action.
-- A session obtained another way (password-reset link, a direct call to the
-- token endpoint) updates last_sign_in_at but adds no row here.

create table if not exists login_events (
  id bigserial primary key,
  auth_user_id uuid not null,
  profile_id uuid references profiles(id) on delete set null,
  email text,
  created_at timestamptz default now()
);

create index if not exists idx_login_events_created on login_events(created_at desc);
create index if not exists idx_login_events_profile on login_events(profile_id, created_at desc);

alter table login_events enable row level security;

-- ============================================
-- Re-point the platform functions at login_events
-- ============================================
create or replace function public.platform_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  perform public.require_super_admin();

  select jsonb_build_object(
    'orgs_total', (select count(*) from organizations),
    'orgs_paying', (
      select count(*) from organizations
      where subscription_status = 'active'
        and subscription_tier <> 'trial'
    ),
    'orgs_trialing', (
      select count(*) from organizations where subscription_status = 'trialing'
    ),
    'orgs_past_due', (
      select count(*) from organizations where subscription_status = 'past_due'
    ),
    'trials_ending_7d', (
      select count(*) from organizations
      where subscription_status = 'trialing'
        and trial_ends_at between now() and now() + interval '7 days'
    ),
    'by_tier', coalesce((
      select jsonb_object_agg(subscription_tier, n)
      from (select subscription_tier, count(*) n from organizations group by 1) t
    ), '{}'::jsonb),
    'by_status', coalesce((
      select jsonb_object_agg(subscription_status, n)
      from (select subscription_status, count(*) n from organizations group by 1) t
    ), '{}'::jsonb),
    'users_total', (select count(*) from profiles),
    'users_with_phone', (select count(*) from profiles where phone is not null),
    'auth_users_total', (select count(*) from auth.users),
    'signups_30d', (
      select count(*) from auth.users where created_at > now() - interval '30 days'
    ),
    'teams_total', (select count(*) from teams),
    'players_total', (select count(*) from players),
    'seasons_active', (select count(*) from seasons where status = 'active'),
    -- Distinct users seen, which is the more useful activity signal, plus raw
    -- login counts from our own ledger.
    'logins_24h', (
      select count(*) from login_events where created_at > now() - interval '24 hours'
    ),
    'logins_7d', (
      select count(*) from login_events where created_at > now() - interval '7 days'
    ),
    'logins_30d', (
      select count(*) from login_events where created_at > now() - interval '30 days'
    ),
    'active_users_7d', (
      select count(distinct auth_user_id) from login_events
      where created_at > now() - interval '7 days'
    ),
    'active_users_30d', (
      select count(distinct auth_user_id) from login_events
      where created_at > now() - interval '30 days'
    ),
    -- So the UI can say "tracking since X" instead of implying all-time totals.
    'login_tracking_since', (select min(created_at) from login_events),
    'sms_consents_granted', (
      select count(*) from sms_consents where status = 'granted'
    ),
    'sms_queued_stuck', (
      select count(*) from sms_pending_scores
      where status in ('queued', 'processing')
        and created_at < now() - interval '1 hour'
    )
  ) into result;

  return result;
end;
$$;

-- Adding login_count_total changes the return type, and CREATE OR REPLACE
-- cannot do that (SQLSTATE 42P13), so drop first.
drop function if exists public.platform_users();

create function public.platform_users()
returns table (
  profile_id uuid,
  email text,
  name text,
  phone text,
  is_super_admin boolean,
  org_name text,
  org_role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean,
  login_count_30d bigint,
  login_count_total bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.require_super_admin();

  return query
  select
    p.id as profile_id,
    p.email,
    p.name,
    p.phone,
    p.is_super_admin,
    o.name as org_name,
    m.role as org_role,
    p.created_at,
    au.last_sign_in_at,
    (au.email_confirmed_at is not null) as email_confirmed,
    (
      select count(*) from login_events le
      where le.auth_user_id = p.auth_user_id
        and le.created_at > now() - interval '30 days'
    ) as login_count_30d,
    (
      select count(*) from login_events le
      where le.auth_user_id = p.auth_user_id
    ) as login_count_total
  from profiles p
  left join auth.users au on au.id = p.auth_user_id
  left join memberships m on m.profile_id = p.id
  left join organizations o on o.id = m.org_id
  order by au.last_sign_in_at desc nulls last;
end;
$$;

revoke all on function public.platform_overview() from public, anon;
revoke all on function public.platform_users() from public, anon;
grant execute on function public.platform_overview() to authenticated;
grant execute on function public.platform_users() to authenticated;
