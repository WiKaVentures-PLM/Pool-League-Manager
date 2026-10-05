-- ============================================
-- MULTI-LEAGUE SUPPORT: a user-chosen active league
-- ============================================
-- Every RLS policy compares `org_id = auth_org_id()`, and auth_org_id() was
--   SELECT org_id FROM memberships WHERE profile_id = … LIMIT 1
-- with no ORDER BY. So the database assumed one league per user and, for anyone
-- in two, picked an arbitrary one.
--
-- Rather than rewrite ~30 policies (high blast radius: a mistake either hides
-- data or leaks it across tenants), this makes auth_org_id() return the league
-- the user has SELECTED. The policies are untouched, and because
-- auth_org_role() resolves the role within auth_org_id()'s org, per-league
-- roles — admin in one league, player in another — start working for free.
--
-- Trade-off accepted: the selection lives on the profile, so it is global to
-- the user rather than per-session. Someone with the app open on a phone and a
-- laptop shares one active league. That is a minor annoyance, not a correctness
-- problem, and it avoids JWT re-issuing on every switch.

alter table profiles
  add column if not exists active_org_id uuid references organizations(id) on delete set null;

comment on column profiles.active_org_id is
  'The league this user is currently acting in. Drives auth_org_id() and therefore every RLS policy. Always validated against memberships before being honoured.';

-- ============================================
-- auth_org_id(): the selected league, safely
-- ============================================
-- The selection is only honoured while the user is still a member, so a stale
-- or tampered value can never grant access to a league they were removed from.
-- Falls back to their oldest membership, which is both deterministic and
-- exactly the previous behaviour for single-league users.
create or replace function auth_org_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.active_org_id
      from profiles p
      where p.auth_user_id = auth.uid()
        and p.active_org_id is not null
        and exists (
          select 1 from memberships m
          where m.profile_id = p.id
            and m.org_id = p.active_org_id
        )
    ),
    (
      select m.org_id
      from memberships m
      join profiles p on p.id = m.profile_id
      where p.auth_user_id = auth.uid()
      order by m.created_at asc
      limit 1
    )
  )
$$;

-- ============================================
-- auth_org_role(): role IN the selected league
-- ============================================
-- Was duplicating the old LIMIT 1 subquery inline. Delegating to auth_org_id()
-- keeps the two in step, so the role can never be read from a different league
-- than the data being checked.
create or replace function auth_org_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select m.role
  from memberships m
  where m.profile_id = auth_profile_id()
    and m.org_id = auth_org_id()
$$;

-- ============================================
-- Switching leagues
-- ============================================
-- Security definer so it can write the column, but it refuses any league the
-- caller is not a member of. Returns the league actually selected.
create or replace function set_active_org(p_org_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  v_profile_id := auth_profile_id();
  if v_profile_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1 from memberships
    where profile_id = v_profile_id and org_id = p_org_id
  ) then
    raise exception 'Not a member of that league' using errcode = '42501';
  end if;

  update profiles set active_org_id = p_org_id where id = v_profile_id;
  return p_org_id;
end;
$$;

revoke all on function set_active_org(uuid) from public, anon;
grant execute on function set_active_org(uuid) to authenticated;

-- ============================================
-- Every league the caller belongs to
-- ============================================
-- The league picker needs this BEFORE a league is selected, at which point
-- memberships/organizations RLS only exposes the active one. Security definer
-- so the picker can list them all; scoped strictly to the caller's own rows.
create or replace function my_leagues()
returns table (
  org_id uuid,
  org_name text,
  org_slug text,
  role text,
  subscription_tier text,
  subscription_status text,
  is_active boolean,
  joined_at timestamptz,
  team_count bigint
)
language sql stable security definer
set search_path = public
as $$
  select
    o.id,
    o.name,
    o.slug,
    m.role,
    o.subscription_tier,
    o.subscription_status,
    (o.id = auth_org_id()) as is_active,
    m.created_at,
    (select count(*) from teams t where t.org_id = o.id) as team_count
  from memberships m
  join organizations o on o.id = m.org_id
  where m.profile_id = auth_profile_id()
  order by m.created_at asc
$$;

revoke all on function my_leagues() from public, anon;
grant execute on function my_leagues() to authenticated;
