'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getTierLimits, hasFeature, canAddTeam, isOrgReadOnly, getGraceDaysRemaining, effectiveTier, isTrialExpired } from './features';

export function useFeatures() {
  const { organization } = useAuth();
  // Resolve expiry here rather than trusting the stored tier: an expired
  // trial must behave as free even though the DB still says 'trial'.
  const tier = effectiveTier(organization);
  const limits = getTierLimits(tier);
  const readOnly = isOrgReadOnly(organization?.subscription_status);
  const graceDaysRemaining = getGraceDaysRemaining(organization?.past_due_since);

  return {
    tier,
    trialExpired: isTrialExpired(organization),
    limits,
    isReadOnly: readOnly,
    graceDaysRemaining,
    canAddTeam: (currentCount: number) => !readOnly && canAddTeam(tier, currentCount),
    hasPlayerStats: hasFeature(tier, 'hasPlayerStats'),
    hasPhotoUpload: hasFeature(tier, 'hasPhotoUpload'),
    hasHallOfFame: hasFeature(tier, 'hasHallOfFame'),
    hasHeadToHead: hasFeature(tier, 'hasHeadToHead'),
    hasSmsSubmission: hasFeature(tier, 'hasSmsSubmission'),
    hasOcrScanning: hasFeature(tier, 'hasOcrScanning'),
  };
}
