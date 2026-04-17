'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getTierLimits, hasFeature, canAddTeam, isOrgReadOnly, getGraceDaysRemaining } from './features';

export function useFeatures() {
  const { organization } = useAuth();
  const tier = organization?.subscription_tier;
  const limits = getTierLimits(tier);
  const readOnly = isOrgReadOnly(organization?.subscription_status);
  const graceDaysRemaining = getGraceDaysRemaining(organization?.past_due_since);

  return {
    tier: tier || 'trial',
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
