'use client';

import { Clock } from 'lucide-react';
import Link from 'next/link';
import { useFeatures } from '@/lib/subscription/use-features';

/**
 * Trials now actually expire (effectiveTier downgrades them to free), which
 * means features can disappear from under a league admin. Without this they
 * would get silently fewer teams and no history with nothing explaining why.
 *
 * Distinct from PastDueBanner: nothing is wrong with their payment, they are
 * simply on the free plan now, and the account is NOT read-only.
 */
export function TrialExpiredBanner() {
  const { trialExpired, limits } = useFeatures();

  if (!trialExpired) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="flex items-center gap-3 max-w-5xl mx-auto">
        <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-900 flex-1">
          Your free trial has ended, so your league is on the <strong>Free</strong> plan — up to{' '}
          {limits.maxTeams} teams and the current season only. Nothing has been deleted.
        </p>
        <Link
          href="/settings"
          className="text-sm font-medium text-amber-800 hover:text-amber-950 whitespace-nowrap underline"
        >
          See plans
        </Link>
      </div>
    </div>
  );
}
