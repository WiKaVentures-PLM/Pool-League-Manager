'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useFeatures } from '@/lib/subscription/use-features';

export function PastDueBanner() {
  const { isReadOnly, graceDaysRemaining } = useFeatures();

  if (!isReadOnly) return null;

  const isExpired = graceDaysRemaining === 0 || graceDaysRemaining === null;

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="flex items-center gap-3 max-w-5xl mx-auto">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-800 flex-1">
          {isExpired ? (
            <>Your account has been suspended due to an unpaid balance. All data is preserved but changes are disabled.</>
          ) : (
            <>Your payment is past due. You have <strong>{graceDaysRemaining} day{graceDaysRemaining !== 1 ? 's' : ''}</strong> to update your payment before your account is suspended.</>
          )}
        </p>
        <Link
          href="/settings"
          className="text-sm font-medium text-red-700 hover:text-red-900 whitespace-nowrap underline"
        >
          Update payment
        </Link>
      </div>
    </div>
  );
}
