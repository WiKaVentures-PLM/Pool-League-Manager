'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Sends a user who belongs to more than one league to the picker, once, until
 * they choose. Without this the app would silently fall back to their oldest
 * membership and they would have no idea which league they were looking at.
 *
 * Deliberately only fires when needsLeagueChoice is true — a single-league
 * user, or anyone who has already chosen, never sees the picker.
 */
export function LeagueChoiceGate() {
  const { needsLeagueChoice, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!needsLeagueChoice) return;
    if (pathname === '/select-league') return;
    router.replace('/select-league');
  }, [loading, needsLeagueChoice, pathname, router]);

  return null;
}
