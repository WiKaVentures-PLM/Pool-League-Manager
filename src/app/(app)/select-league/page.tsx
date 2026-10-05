'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Check, ChevronRight, Shield, Users } from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  admin: 'League admin',
  captain: 'Team captain',
  player: 'Player',
};

export default function SelectLeaguePage() {
  const router = useRouter();
  const { leagues, loading, switchLeague, profile } = useAuth();
  const [picking, setPicking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(orgId: string) {
    setPicking(orgId);
    setError(null);
    try {
      // switchLeague does a full document navigation to /dashboard, so there is
      // deliberately no router.push here.
      await switchLeague(orgId);
    } catch {
      setError('Could not switch to that league. Please try again.');
      setPicking(null);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Loading your leagues…</div>;
  }

  if (leagues.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6">
          <Building2 className="w-6 h-6 text-slate-400 mb-3" />
          <h1 className="text-lg font-bold text-slate-900 mb-1">No leagues yet</h1>
          <p className="text-sm text-slate-500">
            Your account isn&rsquo;t linked to a league. Ask your league administrator for an
            invite, or create your own league.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-slate-900 mb-1">Choose a league</h1>
        <p className="text-sm text-slate-500 mb-8">
          You belong to {leagues.length} leagues
          {profile?.name ? `, ${profile.name}` : ''}. Pick the one you want to work in — you can
          switch any time from the header.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {leagues.map(league => {
            const isPicking = picking === league.org_id;
            return (
              <button
                key={league.org_id}
                onClick={() => choose(league.org_id)}
                disabled={picking !== null}
                className="w-full text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors disabled:opacity-60 group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 truncate">{league.org_name}</span>
                      {league.is_active && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                          <Check className="w-3 h-3" />
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        {league.role === 'admin' ? (
                          <Shield className="w-3.5 h-3.5" />
                        ) : (
                          <Users className="w-3.5 h-3.5" />
                        )}
                        {ROLE_LABEL[league.role] ?? league.role}
                      </span>
                      <span>
                        {league.team_count} team{league.team_count === 1 ? '' : 's'}
                      </span>
                      {league.subscription_status !== 'active' && (
                        <span className="text-slate-400">{league.subscription_status}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 shrink-0 ${
                      isPicking ? 'animate-pulse text-emerald-500' : 'text-slate-300 group-hover:text-emerald-500'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Skip and use my current league
        </button>
      </div>
    </div>
  );
}
