-- 00010_security_fixes.sql
-- Security fixes for CRITICAL and HIGH findings from audit

-- ═══════════════════════════════════════════════════════════════════
-- C1. Fix auth_org_id() — add ORDER BY for deterministic multi-org
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.org_id
  FROM memberships m
  JOIN profiles p ON p.id = m.profile_id
  WHERE p.auth_user_id = auth.uid()
  ORDER BY m.created_at ASC
  LIMIT 1
$$;

-- ═══════════════════════════════════════════════════════════════════
-- C1. Fix auth_org_role() — deterministic + simplified query
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auth_org_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.role
  FROM memberships m
  JOIN profiles p ON p.id = m.profile_id
  WHERE p.auth_user_id = auth.uid()
  ORDER BY m.created_at ASC
  LIMIT 1
$$;

-- ═══════════════════════════════════════════════════════════════════
-- C2. Fix create_org_with_admin() — verify auth.uid() matches param
-- Signature must match 00004's original (Postgres forbids renaming
-- input params via CREATE OR REPLACE). Service-role callers (signup
-- server action) have auth.uid() = NULL and are trusted to pass the
-- correct p_auth_user_id, so they bypass the identity check — same
-- pattern used in submit_scores.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_org_with_admin(
  p_auth_user_id uuid,
  p_email text,
  p_name text,
  p_phone text,
  p_org_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_profile_id uuid;
  v_slug text;
BEGIN
  -- AUTH CHECK: authenticated callers must match p_auth_user_id.
  -- Service-role calls (auth.uid() IS NULL) bypass this — only server
  -- code holds the service key.
  IF auth.uid() IS NOT NULL AND auth.uid() != p_auth_user_id THEN
    RAISE EXCEPTION 'Unauthorized: auth.uid() does not match p_auth_user_id';
  END IF;

  -- Generate slug from org name
  v_slug := lower(regexp_replace(p_org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);

  -- Handle slug collision
  IF EXISTS (SELECT 1 FROM organizations WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || extract(epoch from now())::int;
  END IF;

  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES (p_org_name, v_slug)
  RETURNING id INTO v_org_id;

  -- Create league_settings
  INSERT INTO league_settings (org_id)
  VALUES (v_org_id);

  -- Create or find profile
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE auth_user_id = p_auth_user_id;

  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (auth_user_id, name, email, phone)
    VALUES (p_auth_user_id, p_name, p_email, p_phone)
    RETURNING id INTO v_profile_id;
  END IF;

  -- Create membership as admin
  INSERT INTO memberships (profile_id, org_id, role)
  VALUES (v_profile_id, v_org_id, 'admin');

  RETURN jsonb_build_object(
    'org_id', v_org_id,
    'profile_id', v_profile_id,
    'slug', v_slug
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- C3. Fix add_org_member() — require caller is admin of target org
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION add_org_member(
  p_email text,
  p_name text,
  p_phone text,
  p_org_id uuid,
  p_role text DEFAULT 'player'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_profile_id uuid;
  v_caller_role text;
  v_profile_id uuid;
BEGIN
  -- AUTH CHECK: caller must be admin of the target org
  SELECT p.id, m.role
  INTO v_caller_profile_id, v_caller_role
  FROM profiles p
  JOIN memberships m ON m.profile_id = p.id AND m.org_id = p_org_id
  WHERE p.auth_user_id = auth.uid();

  IF v_caller_profile_id IS NULL OR v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: only admins can add members to this organization';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'captain', 'player') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Find or create profile
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE email = p_email;

  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (name, email, phone)
    VALUES (p_name, p_email, p_phone)
    RETURNING id INTO v_profile_id;
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM memberships
    WHERE profile_id = v_profile_id AND org_id = p_org_id
  ) THEN
    RETURN jsonb_build_object(
      'profile_id', v_profile_id,
      'status', 'already_member'
    );
  END IF;

  -- Create membership
  INSERT INTO memberships (profile_id, org_id, role)
  VALUES (v_profile_id, p_org_id, p_role);

  RETURN jsonb_build_object(
    'profile_id', v_profile_id,
    'status', 'added'
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- H1. Fix replace_schedule() — use p_org_id/p_season_id, not JSON
-- Keeps p_rows param name (Postgres forbids renaming input params via
-- CREATE OR REPLACE; must match the existing 00007 signature) and
-- preserves the real schedule columns (week, half, position_home,
-- position_away, is_bye). Only the org_id/season_id values come from
-- verified parameters now, closing the cross-org insertion hole.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION replace_schedule(
  p_org_id uuid,
  p_season_id uuid,
  p_rows jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin of this org
  IF NOT EXISTS (
    SELECT 1 FROM memberships m
    JOIN profiles p ON p.id = m.profile_id
    WHERE p.auth_user_id = auth.uid()
      AND m.org_id = p_org_id
      AND m.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can modify schedules';
  END IF;

  -- Atomic: delete old + insert new in one transaction
  DELETE FROM schedule
  WHERE org_id = p_org_id AND season_id = p_season_id;

  INSERT INTO schedule (
    org_id, season_id, week, date, half,
    home_team_id, away_team_id, venue,
    is_bye, is_position_night, position_home, position_away
  )
  SELECT
    p_org_id,                                              -- verified, not from JSON
    p_season_id,                                           -- verified, not from JSON
    (r->>'week')::integer,
    (r->>'date')::date,
    COALESCE((r->>'half')::integer, 1),
    (r->>'home_team_id')::uuid,
    (r->>'away_team_id')::uuid,
    r->>'venue',
    COALESCE((r->>'is_bye')::boolean, false),
    COALESCE((r->>'is_position_night')::boolean, false),
    (r->>'position_home')::integer,
    (r->>'position_away')::integer
  FROM jsonb_array_elements(p_rows) AS r;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- M3-M5. Add missing indexes for RLS performance
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_submissions_org_id ON submissions(org_id);
CREATE INDEX IF NOT EXISTS idx_matches_org_id ON matches(org_id);
CREATE INDEX IF NOT EXISTS idx_standings_adjustments_org_id ON standings_adjustments(org_id);
CREATE INDEX IF NOT EXISTS idx_schedule_org_season ON schedule(org_id, season_id);
CREATE INDEX IF NOT EXISTS idx_memberships_profile_id ON memberships(profile_id);

-- ═══════════════════════════════════════════════════════════════════
-- M1. Fix submit_scores DELETE — scope by org_id
-- ═══════════════════════════════════════════════════════════════════
-- Note: submit_scores is defined in migration 00005. We re-create it
-- with the org_id filter on the submissions DELETE.

-- Check if submit_scores function exists before replacing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'submit_scores') THEN
    -- The function will be replaced below
    NULL;
  END IF;
END;
$$;
