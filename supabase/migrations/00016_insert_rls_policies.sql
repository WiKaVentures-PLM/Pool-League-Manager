-- 00016_insert_rls_policies.sql
-- C4-C6: Add missing INSERT RLS policies for profiles, organizations,
-- and league_settings.

-- ═══════════════════════════════════════════════════════════════════
-- C4. profiles INSERT — a user can only create their own profile row
-- ═══════════════════════════════════════════════════════════════════
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (
  auth_user_id = auth.uid()
);

-- ═══════════════════════════════════════════════════════════════════
-- C5. organizations INSERT — any authenticated user can create an org
-- (the create_org_with_admin RPC handles the full flow, but direct
-- inserts should still be gated to authenticated users)
-- ═══════════════════════════════════════════════════════════════════
CREATE POLICY "orgs_insert" ON organizations FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════
-- C6. league_settings INSERT — only org admins can create settings
-- (normally created by create_org_with_admin, but the policy ensures
-- direct inserts are also protected)
-- ═══════════════════════════════════════════════════════════════════
CREATE POLICY "league_settings_insert" ON league_settings FOR INSERT WITH CHECK (
  org_id = auth_org_id() AND auth_org_role() = 'admin'
);
