-- 00017_bye_week_nullable_away_team.sql
-- H2: Allow bye weeks by making away_team_id NULLABLE on schedule.
--
-- Migration 00008 converted the column to uuid and added FK constraints,
-- but left it NOT NULL — which means every bye-week row requires a
-- dummy team ID, breaking the FK or forcing a sentinel value.

-- 1. Drop the existing FK constraint (added in 00008)
ALTER TABLE schedule DROP CONSTRAINT IF EXISTS fk_schedule_away_team;

-- 2. Allow NULLs
ALTER TABLE schedule ALTER COLUMN away_team_id DROP NOT NULL;

-- 3. Re-add the FK constraint (now allows NULL naturally)
ALTER TABLE schedule
  ADD CONSTRAINT fk_schedule_away_team
  FOREIGN KEY (away_team_id) REFERENCES teams(id);

-- 4. Update replace_schedule RPC to handle NULL away_team_id for bye weeks.
--    The NULLIF ensures that when is_bye is true and away_team_id is missing
--    from the JSON, we insert NULL instead of failing the uuid cast.
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
    p_org_id,
    p_season_id,
    (r->>'week')::integer,
    (r->>'date')::date,
    COALESCE((r->>'half')::integer, 1),
    (r->>'home_team_id')::uuid,
    -- NULL when bye week or when away_team_id is absent/null in JSON
    CASE
      WHEN COALESCE((r->>'is_bye')::boolean, false) THEN NULL
      ELSE (r->>'away_team_id')::uuid
    END,
    r->>'venue',
    COALESCE((r->>'is_bye')::boolean, false),
    COALESCE((r->>'is_position_night')::boolean, false),
    (r->>'position_home')::integer,
    (r->>'position_away')::integer
  FROM jsonb_array_elements(p_rows) AS r;
END;
$$;
