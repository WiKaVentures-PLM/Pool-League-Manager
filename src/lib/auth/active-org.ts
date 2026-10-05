'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface ActiveOrgContext {
  profileId: string;
  orgId: string;
  role: string;
}

/**
 * Resolves which league the caller is acting in, and their role *in that
 * league*.
 *
 * This must mirror auth_org_id() in migration 00015 exactly: honour
 * profiles.active_org_id when the user is still a member of it, otherwise fall
 * back to their oldest membership. If the two ever disagree, server actions
 * would compute an org_id that RLS then rejects, and writes would fail with a
 * confusing permission error rather than doing the right thing.
 *
 * Returns null when the caller is not authenticated or belongs to no league.
 */
export async function getActiveOrgContext(): Promise<ActiveOrgContext | null> {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, active_org_id')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (!profile) return null;

  // Fetch all memberships rather than one: a user can be in several leagues,
  // and .single() here used to throw for exactly that reason.
  const { data: memberships } = await supabase
    .from('memberships')
    .select('org_id, role')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: true });

  if (!memberships || memberships.length === 0) return null;

  const chosen =
    memberships.find(m => m.org_id === profile.active_org_id) ?? memberships[0];

  return {
    profileId: profile.id as string,
    orgId: chosen.org_id as string,
    role: chosen.role as string,
  };
}

/**
 * Same resolution, but only returns the org when the caller is an admin of it.
 * Being an admin of a different league does not count.
 */
export async function getActiveAdminOrgId(): Promise<string | null> {
  const ctx = await getActiveOrgContext();
  if (!ctx || ctx.role !== 'admin') return null;
  return ctx.orgId;
}
