-- ============================================
-- Migration: Convert schedule team ID columns from text to uuid
-- Adds proper FK constraints to teams(id)
-- ============================================

-- 1. Drop old text-based indexes (will recreate on uuid columns)
DROP INDEX IF EXISTS idx_schedule_home_team;
DROP INDEX IF EXISTS idx_schedule_away_team;

-- 2. Convert columns from text to uuid
ALTER TABLE schedule
  ALTER COLUMN home_team_id TYPE uuid USING home_team_id::uuid,
  ALTER COLUMN away_team_id TYPE uuid USING away_team_id::uuid;

-- 3. Add FK constraints
ALTER TABLE schedule
  ADD CONSTRAINT fk_schedule_home_team FOREIGN KEY (home_team_id) REFERENCES teams(id),
  ADD CONSTRAINT fk_schedule_away_team FOREIGN KEY (away_team_id) REFERENCES teams(id);

-- 4. Recreate indexes on uuid columns
CREATE INDEX idx_schedule_home_team ON schedule(home_team_id);
CREATE INDEX idx_schedule_away_team ON schedule(away_team_id);

-- 5. Update submit_scores RPC: remove ::text casts (both sides are uuid now)
CREATE OR REPLACE FUNCTION submit_scores(
  p_org_id uuid,
  p_season_id uuid,
  p_schedule_id uuid,
  p_team_id uuid,
  p_submitted_by uuid,
  p_home_score integer,
  p_away_score integer,
  p_matchups jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule schedule%ROWTYPE;
  v_other_sub submissions%ROWTYPE;
  v_new_sub_id uuid;
  v_match_id uuid;
  v_caller_profile_id uuid;
BEGIN
  -- For authenticated callers, verify identity matches p_submitted_by.
  -- Service-role calls (auth.uid() IS NULL) skip this check since
  -- only trusted server code (Twilio webhook) uses service role.
  IF auth.uid() IS NOT NULL THEN
    SELECT id INTO v_caller_profile_id
    FROM profiles
    WHERE auth_user_id = auth.uid();

    IF v_caller_profile_id IS NULL OR v_caller_profile_id != p_submitted_by THEN
      RETURN jsonb_build_object('status', 'error', 'message', 'Caller identity mismatch');
    END IF;
  END IF;

  -- Always verify p_submitted_by references a valid profile
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_submitted_by) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Invalid submitter profile');
  END IF;

  -- 1. Verify the schedule entry exists and belongs to this org/season
  SELECT * INTO v_schedule
  FROM schedule
  WHERE id = p_schedule_id
    AND org_id = p_org_id
    AND season_id = p_season_id;

  IF v_schedule.id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Schedule entry not found');
  END IF;

  -- 2. Verify team is part of this match (home or away)
  IF v_schedule.home_team_id != p_team_id
    AND v_schedule.away_team_id != p_team_id THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Team is not part of this match');
  END IF;

  -- 3. Check no existing match for this schedule entry
  IF EXISTS (SELECT 1 FROM matches WHERE schedule_id = p_schedule_id) THEN
    RETURN jsonb_build_object('status', 'already_completed');
  END IF;

  -- 4. Check no duplicate submission from this team
  IF EXISTS (
    SELECT 1 FROM submissions
    WHERE schedule_id = p_schedule_id AND team_id = p_team_id
  ) THEN
    RETURN jsonb_build_object('status', 'already_submitted');
  END IF;

  -- 5. Insert the submission
  INSERT INTO submissions (org_id, season_id, schedule_id, team_id, submitted_by, home_score, away_score, matchups)
  VALUES (p_org_id, p_season_id, p_schedule_id, p_team_id, p_submitted_by, p_home_score, p_away_score, p_matchups)
  RETURNING id INTO v_new_sub_id;

  -- 6. Check for the other team's submission
  SELECT * INTO v_other_sub
  FROM submissions
  WHERE schedule_id = p_schedule_id
    AND team_id != p_team_id;

  -- 7. No other submission yet
  IF v_other_sub.id IS NULL THEN
    RETURN jsonb_build_object('status', 'pending', 'submission_id', v_new_sub_id);
  END IF;

  -- 8. Other submission exists — compare match-level scores AND individual matchups
  IF v_other_sub.home_score = p_home_score AND v_other_sub.away_score = p_away_score THEN
    -- Scores match at the aggregate level — now compare individual matchups.
    -- Normalize both arrays: sort each game by (home_player, away_player) and compare
    -- the key fields (players + wins). This catches cases where aggregate scores
    -- match but individual games differ.
    IF (
      SELECT jsonb_agg(elem ORDER BY elem->>'home_player', elem->>'away_player')
      FROM jsonb_array_elements(p_matchups) AS elem
    ) IS DISTINCT FROM (
      SELECT jsonb_agg(elem ORDER BY elem->>'home_player', elem->>'away_player')
      FROM jsonb_array_elements(v_other_sub.matchups) AS elem
    ) THEN
      -- Individual matchups differ even though totals match — flag as conflict
      RETURN jsonb_build_object('status', 'conflict', 'submission_id', v_new_sub_id);
    END IF;

    -- Both match-level and game-level scores match: auto-approve
    INSERT INTO matches (org_id, season_id, schedule_id, home_score, away_score, matchups, approved, marked_played)
    VALUES (p_org_id, p_season_id, p_schedule_id, p_home_score, p_away_score, p_matchups, true, true)
    RETURNING id INTO v_match_id;

    -- Delete both submissions
    DELETE FROM submissions WHERE schedule_id = p_schedule_id;

    RETURN jsonb_build_object('status', 'auto_approved', 'match_id', v_match_id);
  ELSE
    -- Scores conflict
    RETURN jsonb_build_object('status', 'conflict', 'submission_id', v_new_sub_id);
  END IF;
END;
$$;

-- 6. Update replace_schedule RPC: cast team IDs to uuid
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
  -- Verify caller is admin
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

  INSERT INTO schedule (org_id, season_id, week, date, half, home_team_id, away_team_id, venue, is_bye, is_position_night, position_home, position_away)
  SELECT
    (r->>'org_id')::uuid,
    (r->>'season_id')::uuid,
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
