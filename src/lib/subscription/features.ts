// Tiers that can be STORED in organizations.subscription_tier (see the CHECK
// constraint in migration 00002): trial, basic, pro, premium.
// 'free' is never stored — it is what an expired trial resolves to at read
// time via effectiveTier(). There is deliberately no 'starter': it was in this
// list for months while being impossible to store, because the CHECK rejects it.
export type Tier = 'trial' | 'free' | 'basic' | 'pro' | 'premium';

interface TierLimits {
  maxTeams: number;
  maxLeagues: number; // -1 = unlimited
  maxSeasonsHistory: number; // 0 = current only, -1 = unlimited
  hasPlayerStats: boolean;
  hasPhotoUpload: boolean;
  hasHallOfFame: boolean;
  hasHeadToHead: boolean;
  hasSmsSubmission: boolean;
  hasMmsSubmission: boolean;
  hasOcrScanning: boolean;
  hasCustomBranding: boolean;
}

const TIER_LIMITS: Record<Tier, TierLimits> = {
  // 14-day full-featured trial. Expiry is enforced by effectiveTier(), which
  // resolves a trialing org past trial_ends_at down to 'free'.
  trial: {
    maxTeams: Infinity,
    maxLeagues: 1,
    maxSeasonsHistory: -1,
    hasPlayerStats: true,
    hasPhotoUpload: true,
    hasHallOfFame: true,
    hasHeadToHead: true,
    // SMS is not sold on any paid plan — see the SMS decision in project
    // notes. It stays on for trial so it remains testable in-house.
    hasSmsSubmission: true,
    hasMmsSubmission: true,
    hasOcrScanning: true,
    hasCustomBranding: true,
  },
  // What an expired trial falls back to. Never stored in the DB.
  // Must stay strictly weaker than Basic, or there is no reason to pay $5.
  free: {
    maxTeams: 5,
    maxLeagues: 1,
    maxSeasonsHistory: 0,
    hasPlayerStats: false,
    hasPhotoUpload: false,
    hasHallOfFame: false,
    hasHeadToHead: false,
    hasSmsSubmission: false,
    hasMmsSubmission: false,
    hasOcrScanning: false,
    hasCustomBranding: false,
  },
  // Basic — $5/mo, $54/yr (Stripe price_1Suf0H…)
  basic: {
    maxTeams: 10,
    maxLeagues: 1,
    maxSeasonsHistory: 0,
    hasPlayerStats: false,
    hasPhotoUpload: false,
    hasHallOfFame: false,
    hasHeadToHead: false,
    hasSmsSubmission: false,
    hasMmsSubmission: false,
    hasOcrScanning: false,
    hasCustomBranding: false,
  },
  // Pro — $10/mo, $108/yr (Stripe price_1SufOZ…)
  pro: {
    maxTeams: 20,
    maxLeagues: 1,
    maxSeasonsHistory: 3,
    hasPlayerStats: true,
    hasPhotoUpload: true,
    hasHallOfFame: false,
    hasHeadToHead: false,
    hasSmsSubmission: false,
    hasMmsSubmission: false,
    hasOcrScanning: true,
    hasCustomBranding: false,
  },
  // Premium — $20/mo, $216/yr (Stripe price_1SufPk…)
  // Previously identical to Pro, so $20 bought exactly what $10 bought.
  premium: {
    maxTeams: Infinity,
    maxLeagues: -1,
    maxSeasonsHistory: -1,
    hasPlayerStats: true,
    hasPhotoUpload: true,
    hasHallOfFame: true,
    hasHeadToHead: true,
    hasSmsSubmission: false,
    hasMmsSubmission: false,
    hasOcrScanning: true,
    hasCustomBranding: true,
  },
};

/**
 * The tier that should actually be enforced right now.
 *
 * Nothing in the product ever expired a trial: no cron job, no status flip,
 * and trial_ends_at was read nowhere outside of display. Every signup kept
 * full trial features indefinitely, so nobody ever had a reason to subscribe.
 * Deriving expiry here instead of relying on a background job means the state
 * cannot drift and there is no job to monitor.
 */
export function effectiveTier(org: {
  subscription_tier?: string | null;
  subscription_status?: string | null;
  trial_ends_at?: string | null;
} | null | undefined): Tier {
  const tier = (org?.subscription_tier as Tier) || 'trial';
  if (tier !== 'trial') return tier;
  if (org?.subscription_status && org.subscription_status !== 'trialing') return tier;
  const endsAt = org?.trial_ends_at;
  if (endsAt && new Date(endsAt).getTime() < Date.now()) return 'free';
  return 'trial';
}

/** True when a trial has run out and the org is on free as a result. */
export function isTrialExpired(org: {
  subscription_tier?: string | null;
  subscription_status?: string | null;
  trial_ends_at?: string | null;
} | null | undefined): boolean {
  return (org?.subscription_tier ?? 'trial') === 'trial' && effectiveTier(org) === 'free';
}

export function getTierLimits(tier: string | undefined | null): TierLimits {
  return TIER_LIMITS[(tier as Tier) || 'trial'] || TIER_LIMITS.trial;
}

export function canAddTeam(tier: string | undefined | null, currentTeamCount: number): boolean {
  const limits = getTierLimits(tier);
  return limits.maxTeams === Infinity || currentTeamCount < limits.maxTeams;
}

export function canCreateLeague(tier: string | undefined | null, currentLeagueCount: number): boolean {
  const limits = getTierLimits(tier);
  return limits.maxLeagues === -1 || currentLeagueCount < limits.maxLeagues;
}

export function hasFeature(
  tier: string | undefined | null,
  feature: keyof Omit<TierLimits, 'maxTeams' | 'maxLeagues' | 'maxSeasonsHistory'>
): boolean {
  const limits = getTierLimits(tier);
  return limits[feature] as boolean;
}

export function getUpgradeMessage(feature: string, requiredTier: string): string {
  return `${feature} requires the ${requiredTier} plan or higher. Upgrade in Settings > Billing.`;
}

const GRACE_PERIOD_DAYS = 30;

/**
 * Calculate how many grace days remain for a past-due org.
 * Returns null if not past-due, 0 if grace period expired.
 */
export function getGraceDaysRemaining(pastDueSince: string | null | undefined): number | null {
  if (!pastDueSince) return null;
  const start = new Date(pastDueSince).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, GRACE_PERIOD_DAYS - elapsed);
}

/**
 * An org is read-only when subscription is past_due/canceled/expired.
 * During the 30-day grace period they can still read everything but can't write.
 */
export function isOrgReadOnly(subscriptionStatus: string | undefined | null): boolean {
  if (!subscriptionStatus) return false;
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') return false;
  return true;
}
