type Tier = 'trial' | 'basic' | 'pro' | 'premium';

interface TierLimits {
  maxTeams: number;
  maxSeasonsHistory: number; // 0 = current only, -1 = unlimited
  hasPlayerStats: boolean;
  hasPhotoUpload: boolean;
  hasHallOfFame: boolean;
  hasHeadToHead: boolean;
  hasSmsSubmission: boolean;
  hasOcrScanning: boolean;
}

const TIER_LIMITS: Record<Tier, TierLimits> = {
  trial: {
    maxTeams: 20,
    maxSeasonsHistory: -1,
    hasPlayerStats: true,
    hasPhotoUpload: true,
    hasHallOfFame: true,
    hasHeadToHead: true,
    hasSmsSubmission: true,
    hasOcrScanning: true,
  },
  basic: {
    maxTeams: 10,
    maxSeasonsHistory: 0,
    hasPlayerStats: false,
    hasPhotoUpload: false,
    hasHallOfFame: false,
    hasHeadToHead: false,
    hasSmsSubmission: false,
    hasOcrScanning: true,
  },
  pro: {
    maxTeams: 20,
    maxSeasonsHistory: 3,
    hasPlayerStats: true,
    hasPhotoUpload: true,
    hasHallOfFame: false,
    hasHeadToHead: false,
    hasSmsSubmission: true,
    hasOcrScanning: true,
  },
  premium: {
    maxTeams: Infinity,
    maxSeasonsHistory: -1,
    hasPlayerStats: true,
    hasPhotoUpload: true,
    hasHallOfFame: true,
    hasHeadToHead: true,
    hasSmsSubmission: true,
    hasOcrScanning: true,
  },
};

export function getTierLimits(tier: string | undefined | null): TierLimits {
  return TIER_LIMITS[(tier as Tier) || 'trial'] || TIER_LIMITS.trial;
}

export function canAddTeam(tier: string | undefined | null, currentTeamCount: number): boolean {
  const limits = getTierLimits(tier);
  return currentTeamCount < limits.maxTeams;
}

export function hasFeature(tier: string | undefined | null, feature: keyof Omit<TierLimits, 'maxTeams' | 'maxSeasonsHistory'>): boolean {
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
export function isOrgReadOnly(
  subscriptionStatus: string | undefined | null,
): boolean {
  if (!subscriptionStatus) return false;
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') return false;
  // past_due, canceled, expired → read-only
  return true;
}
