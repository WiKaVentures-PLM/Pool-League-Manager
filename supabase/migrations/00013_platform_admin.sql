-- ============================================
-- PLATFORM ADMIN (super admin) REPORTING
-- ============================================
-- The super admin flag, the is_super_admin() helper, and "OR is_super_admin()"
-- on every RLS policy already existed; what was missing was any way to read
-- cross-tenant aggregates, plus anything at all from the auth schema.
--
-- PostgREST only exposes the public schema, so auth.users and
-- auth.audit_log_entries are unreachable from the client. These functions are
-- security definer to cross that boundary, and every one of them re-checks
-- is_super_admin() first — security definer without that guard would hand every
-- authenticated user the whole platform.
--
-- NOTE on login counts: auth.users stores only last_sign_in_at (a timestamp).
-- Actual counts come from auth.audit_log_entries, which Supabase prunes, so
-- these are "logins within a window", never all-time. Treat them as activity
-- signals, not accounting.

-- Raises unless the caller is a super admin. Factored out so every reporting
-- function guards identically.
create or replace function public.require_super_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized: super admin only'
      using errcode = '42501';
  end if;
end;
$$;

-- ============================================
-- OVERVIEW TILES
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
    'logins_24h', (
      select count(*) from auth.audit_log_entries
      where created_at > now() - interval '24 hours'
        and payload->>'action' = 'login'
    ),
    'logins_7d', (
      select count(*) from auth.audit_log_entries
      where created_at > now() - interval '7 days'
        and payload->>'action' = 'login'
    ),
    'logins_30d', (
      select count(*) from auth.audit_log_entries
      where created_at > now() - interval '30 days'
        and payload->>'action' = 'login'
    ),
    'audit_log_oldest', (
      select min(created_at) from auth.audit_log_entries
    ),
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

-- ============================================
-- PER-ORGANIZATION ROWS
-- ============================================
create or replace function public.platform_organizations()
returns table (
  id uuid,
  name text,
  slug text,
  subscription_tier text,
  subscription_status text,
  trial_ends_at timestamptz,
  created_at timestamptz,
  has_stripe boolean,
  member_count bigint,
  team_count bigint,
  player_count bigint,
  last_login timestamptz
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
    o.id,
    o.name,
    o.slug,
    o.subscription_tier,
    o.subscription_status,
    o.trial_ends_at,
    o.created_at,
    (o.stripe_subscription_id is not null) as has_stripe,
    (select count(*) from memberships m where m.org_id = o.id) as member_count,
    (select count(*) from teams t where t.org_id = o.id) as team_count,
    (select count(*) from players p where p.org_id = o.id) as player_count,
    (
      select max(au.last_sign_in_at)
      from memberships m
      join profiles pr on pr.id = m.profile_id
      join auth.users au on au.id = pr.auth_user_id
      where m.org_id = o.id
    ) as last_login
  from organizations o
  order by o.created_at desc;
end;
$$;

-- ============================================
-- PER-USER ROWS
-- ============================================
create or replace function public.platform_users()
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
  login_count_30d bigint
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
      select count(*)
      from auth.audit_log_entries ale
      where ale.payload->>'action' = 'login'
        and ale.payload->>'actor_id' = au.id::text
        and ale.created_at > now() - interval '30 days'
    ) as login_count_30d
  from profiles p
  left join auth.users au on au.id = p.auth_user_id
  left join memberships m on m.profile_id = p.id
  left join organizations o on o.id = m.org_id
  order by au.last_sign_in_at desc nulls last;
end;
$$;

-- Authenticated callers only; each function still gates on is_super_admin().
revoke all on function public.require_super_admin() from public, anon;
revoke all on function public.platform_overview() from public, anon;
revoke all on function public.platform_organizations() from public, anon;
revoke all on function public.platform_users() from public, anon;

grant execute on function public.platform_overview() to authenticated;
grant execute on function public.platform_organizations() to authenticated;
grant execute on function public.platform_users() to authenticated;
