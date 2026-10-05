-- 00018_scope_submit_scores_delete.sql
-- M1: The DELETE FROM submissions in submit_scores was missing an org_id
-- filter, meaning a cross-org collision on schedule_id could delete
-- another org's submissions. Migration 00010 noted this but never
-- completed the fix.

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
    AND (v_schedule.away_team_id IS NULL OR v_schedule.away_team_id != p_team_id) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Team is not part of this match');
  END IF;

  -- 3. Check no existing match for this schedule entry
  IF EXISTS (SELECT 1 FROM matches WHERE schedule_id = p_schedule_id AND org_id = p_org_id) THEN
    RETURN jsonb_build_object('status', 'already_completed');
  END IF;

  -- 4. Check no duplicate submission from this team
  IF EXISTS (
    SELECT 1 FROM submissions
    WHERE schedule_id = p_schedule_id AND team_id = p_team_id AND org_id = p_org_id
  ) THEN
    RETURN jsonb_build_object('status', 'already_submitted');
  END IF;

  -- 5. Insert the submission
  INSERT INTO submissions (org_id, season_id, schedule_id, team_id, submitted_by, home_score, away_score, matchups)
  VALUES (p_org_id, p_season_id, p_schedule_id, p_team_id, p_submitted_by, p_home_score, p_away_score, p_matchups)
  RETURNING id INTO v_new_sub_id;

  -- 6. Check for the other team's submission (scoped to org)
  SELECT * INTO v_other_sub
  FROM submissions
  WHERE schedule_id = p_schedule_id
    AND team_id != p_team_id
    AND org_id = p_org_id;

  -- 7. No other submission yet
  IF v_other_sub.id IS NULL THEN
    RETURN jsonb_build_object('status', 'pending', 'submission_id', v_new_sub_id);
  END IF;

  -- 8. Other submission exists — compare match-level scores AND individual matchups
  IF v_other_sub.home_score = p_home_score AND v_other_sub.away_score = p_away_score THEN
    -- Normalize both arrays: sort each game by (home_player, away_player)
    IF (
      SELECT jsonb_agg(elem ORDER BY elem->>'home_player', elem->>'away_player')
      FROM jsonb_array_elements(p_matchups) AS elem
    ) IS DISTINCT FROM (
      SELECT jsonb_agg(elem ORDER BY elem->>'home_player', elem->>'away_player')
      FROM jsonb_array_elements(v_other_sub.matchups) AS elem
    ) THEN
      RETURN jsonb_build_object('status', 'conflict', 'submission_id', v_new_sub_id);
    END IF;

    -- Both match: auto-approve
    INSERT INTO matches (org_id, season_id, schedule_id, home_score, away_score, matchups, approved, marked_played)
    VALUES (p_org_id, p_season_id, p_schedule_id, p_home_score, p_away_score, p_matchups, true, true)
    RETURNING id INTO v_match_id;

    -- M1 FIX: Delete submissions scoped by BOTH schedule_id AND org_id
    DELETE FROM submissions WHERE schedule_id = p_schedule_id AND org_id = p_org_id;

    RETURN jsonb_build_object('status', 'auto_approved', 'match_id', v_match_id);
  ELSE
    -- Scores conflict
    RETURN jsonb_build_object('status', 'conflict', 'submission_id', v_new_sub_id);
  END IF;
END;
$$;
