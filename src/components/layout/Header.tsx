'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { LogOut, ChevronDown, Building2, Check } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { profile, organization, signOut, leagues, switchLeague } = useAuth();
  const { currentSeason, allSeasons, switchSeason } = useOrg();
  const [showSeasons, setShowSeasons] = useState(false);
  const [showLeagues, setShowLeagues] = useState(false);

  // Only offer the switcher when there is something to switch between.
  const canSwitchLeagues = leagues.length > 1;

  async function handleSignOut() {
    await signOut();
    // Full document navigation rather than router.push: it guarantees the
    // middleware re-reads cookies on a fresh request and drops all client
    // state. A soft push here would 307 straight back to /dashboard if any
    // stale session survived.
    window.location.assign('/login');
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          {canSwitchLeagues ? (
            <div className="relative">
              <button
                onClick={() => setShowLeagues(!showLeagues)}
                className="font-bold text-slate-800 flex items-center gap-1.5 hover:text-emerald-700 transition-colors"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                {organization?.name || 'Pool League'}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {showLeagues && (
                <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                    Your leagues
                  </div>
                  {leagues.map(l => (
                    <button
                      key={l.org_id}
                      onClick={() => { setShowLeagues(false); void switchLeague(l.org_id); }}
                      disabled={l.is_active}
                      className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 disabled:bg-emerald-50 disabled:cursor-default"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800 truncate">{l.org_name}</span>
                        {l.is_active && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                      <span className="text-xs text-slate-400 capitalize">{l.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <h2 className="font-bold text-slate-800">{organization?.name || 'Pool League'}</h2>
          )}
          {currentSeason && (
            <div className="relative">
              <button
                onClick={() => setShowSeasons(!showSeasons)}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                {currentSeason.name}
                {allSeasons.length > 1 && <ChevronDown className="w-3 h-3" />}
              </button>
              {showSeasons && allSeasons.length > 1 && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                  {allSeasons.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { switchSeason(s.id); setShowSeasons(false); }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                    >
                      {s.name}
                      {s.status !== 'active' && (
                        <span className="ml-2 text-xs text-slate-400">({s.status})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600">{profile?.name}</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
