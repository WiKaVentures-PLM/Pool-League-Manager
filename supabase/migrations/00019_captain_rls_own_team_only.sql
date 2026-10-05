-- 00019_captain_rls_own_team_only.sql
-- M7-M8: Tighten captain RLS on players table so captains can only
-- INSERT/UPDATE players on teams where they are the assigned captain,
-- not any team in the org.

-- Drop existing permissive policies
DROP POLICY IF EXISTS "players_insert" ON players;
DROP POLICY IF EXISTS "players_update" ON players;

-- ═══════════════════════════════════════════════════════════════════
-- M7. players INSERT — captains can only add to their own team
-- ═══════════════════════════════════════════════════════════════════
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (
  org_id = auth_org_id()
  AND (
    -- Admins can add to any team in the org
    auth_org_role() = 'admin'
    OR (
      -- Captains can only add to teams they captain
      auth_org_role() = 'captain'
      AND EXISTS (
        SELECT 1 FROM teams t
        WHERE t.id = team_id
          AND t.org_id = auth_org_id()
          AND t.captain_profile_id = auth_profile_id()
      )
    )
  )
);

-- ═══════════════════════════════════════════════════════════════════
-- M8. players UPDATE — captains can only update on their own team
-- ═══════════════════════════════════════════════════════════════════
CREATE POLICY "players_update" ON players FOR UPDATE USING (
  org_id = auth_org_id()
  AND (
    auth_org_role() = 'admin'
    OR (
      auth_org_role() = 'captain'
      AND EXISTS (
        SELECT 1 FROM teams t
        WHERE t.id = team_id
          AND t.org_id = auth_org_id()
          AND t.captain_profile_id = auth_profile_id()
      )
    )
  )
);

-- Also tighten teams UPDATE — captains should only update their own team
DROP POLICY IF EXISTS "teams_update" ON teams;

CREATE POLICY "teams_update" ON teams FOR UPDATE USING (
  org_id = auth_org_id()
  AND (
    auth_org_role() = 'admin'
    OR (
      auth_org_role() = 'captain'
      AND captain_profile_id = auth_profile_id()
    )
  )
);
