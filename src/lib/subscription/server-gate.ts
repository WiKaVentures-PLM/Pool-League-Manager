'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isOrgReadOnly, getTierLimits, canAddTeam, effectiveTier } from './features';

const READ_ONLY_MSG =
  'Your account is past due. Please update your payment to continue making changes.';

/**
 * Check if the org is in read-only mode (past_due / canceled / expired).
 * Returns an error string if read-only, null if writes are allowed.
 */
export async function checkOrgWriteAccess(orgId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_status, past_due_since')
    .eq('id', orgId)
    .single();

  if (org && isOrgReadOnly(org.subscription_status)) {
    return READ_ONLY_MSG;
  }

  return null;
}

/**
 * Check if the org can add another team in the given season.
 * Returns an error string if at limit, null if allowed.
 */
export async function checkTeamLimit(orgId: string, seasonId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient();

  const [orgRes, countRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('subscription_tier, subscription_status, trial_ends_at')
      .eq('id', orgId)
      .single(),
    supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('season_id', seasonId),
  ]);

  if (!orgRes.data) return null; // can't determine, allow

  const currentCount = countRes.count ?? 0;
  const tier = effectiveTier(orgRes.data);

  if (!canAddTeam(tier, currentCount)) {
    const limits = getTierLimits(tier);
    return `Your plan allows up to ${limits.maxTeams} teams per season. Upgrade in Settings > Billing to add more.`;
  }

  return null;
}

/**
 * Check if an auth user can create a new league/org.
 * Free tier accounts are limited to 1 league.
 * Returns an error string if at limit, null if allowed.
 */
export async function checkLeagueLimit(authUserId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient();

  // Find the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single();

  if (!profile) return null;

  // Count orgs where they are admin
  const { data: memberships } = await supabase
    .from('memberships')
    .select('org_id, organizations(subscription_tier, subscription_status, trial_ends_at)')
    .eq('profile_id', profile.id)
    .eq('role', 'admin');

  if (!memberships || memberships.length === 0) return null;

  // Check if any existing org is on a tier that limits leagues
  // Use the highest tier across their orgs
  const existingCount = memberships.length;
  const orgs = memberships.map(
    (m) =>
      m.organizations as unknown as {
        subscription_tier: string;
        subscription_status: string | null;
        trial_ends_at: string | null;
      } | null,
  );
  const tiers = orgs.map((o) => (o ? effectiveTier(o) : 'free'));

  // If all orgs are free/basic/trial, apply the free limit (1 league)
  const hasMultiLeagueTier = tiers.some((t) =>
    ['pro', 'premium'].includes(t)
  );

  if (!hasMultiLeagueTier && existingCount >= 1) {
    return 'Free and Starter plans are limited to 1 league. Upgrade to Pro to manage multiple leagues.';
  }

  return null;
}

/**
 * Check if the org has SMS score submission enabled.
 * Returns an error string if not on a qualifying tier, null if allowed.
 */
export async function checkSmsAccess(orgId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier, subscription_status, trial_ends_at')
    .eq('id', orgId)
    .single();

  if (!org) return null;

  const limits = getTierLimits(effectiveTier(org));
  if (!limits.hasSmsSubmission) {
    // SMS is not sold on any plan right now, so this is deliberately not an
    // upgrade prompt.
    return 'SMS score submission is not available on your plan.';
  }

  return null;
}
