'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logout } from '@/app/(auth)/login/actions';
import type { Profile, Membership, Organization } from '@/types';
import type { User } from '@supabase/supabase-js';

/** One row of my_leagues() — every league this user belongs to. */
export interface LeagueOption {
  org_id: string;
  org_name: string;
  org_slug: string | null;
  role: string;
  subscription_tier: string;
  subscription_status: string;
  is_active: boolean;
  joined_at: string;
  team_count: number;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  membership: Membership | null;
  organization: Organization | null;
  /** Every league the user belongs to, for the picker and the switcher. */
  leagues: LeagueOption[];
  /**
   * True when the user is in more than one league and has not chosen which to
   * act in yet. The app routes them to /select-league instead of guessing.
   */
  needsLeagueChoice: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  switchLeague: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    membership: null,
    organization: null,
    leagues: [],
    needsLeagueChoice: false,
    loading: true,
  });

  const supabase = useMemo(() => createClient(), []);

  async function loadUserData(user: User) {
    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    // Every league this user belongs to. Comes from the my_leagues() RPC
    // rather than a direct query because before a league is selected,
    // memberships/organizations RLS only exposes the active one — the picker
    // needs to see them all.
    const { data: leagueRows, error: leaguesError } = await supabase.rpc('my_leagues');
    if (leaguesError) console.error('Failed to load leagues:', leaguesError);
    const leagues = (leagueRows as LeagueOption[]) ?? [];

    // The active league is whichever one the database resolved via
    // auth_org_id(), so the UI can never disagree with what RLS enforces.
    const activeLeague = leagues.find(l => l.is_active) ?? null;

    // Load the membership row for the active league, so role checks are
    // scoped to the league being viewed.
    const { data: membership } = activeLeague
      ? await supabase
          .from('memberships')
          .select('*, organization:organizations(*)')
          .eq('profile_id', profile.id)
          .eq('org_id', activeLeague.org_id)
          .maybeSingle()
      : { data: null };

    const org = membership
      ? (membership as Membership & { organization: Organization }).organization
      : null;

    setState({
      user,
      profile,
      membership: membership || null,
      organization: org || null,
      leagues,
      // Only ask when there is a genuine choice to make and they have not
      // made it. One league, or an existing choice, goes straight through.
      needsLeagueChoice: leagues.length > 1 && !profile.active_org_id,
      loading: false,
    });
  }

  async function switchLeague(orgId: string) {
    const { error } = await supabase.rpc('set_active_org', { p_org_id: orgId });
    if (error) {
      console.error('Failed to switch league:', error);
      throw error;
    }
    // Full reload: every server component, action and RLS-scoped query has to
    // be re-evaluated against the new league, and a soft refresh can leave
    // stale league data on screen.
    window.location.assign('/dashboard');
  }

  async function refreshAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await loadUserData(user);
    } else {
      setState({ user: null, profile: null, membership: null, organization: null, leagues: [], needsLeagueChoice: false, loading: false });
    }
  }

  async function signOut() {
    // Sign out on the server. The auth cookie is what middleware trusts, and
    // deleting it server-side needs no browser Web Lock, so this cannot be
    // aborted by lock contention the way the client-side signOut() could.
    try {
      await logout();
    } catch (err) {
      console.error('Server sign-out failed:', err);
    }

    // Best effort local cleanup so in-memory state and any cached session go
    // away too. Scoped 'local' to skip the network call the server just made.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('Local sign-out cleanup failed:', err);
    }

    setState({ user: null, profile: null, membership: null, organization: null, leagues: [], needsLeagueChoice: false, loading: false });
  }

  useEffect(() => {
    refreshAuth();

    // NOTE: this callback must NOT be async, and must not await anything.
    // onAuthStateChange runs the callback inside gotrue's exclusive auth lock
    // (auth-js marks the async overload @deprecated for this reason). Awaiting
    // loadUserData() here held that lock across three DB round trips, which
    // starved every other auth call — signOut() in particular would time out,
    // get its lock stolen, and abort before it ever cleared the session. So
    // defer the work to a fresh task, after the lock has been released.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        setTimeout(() => { void loadUserData(user); }, 0);
      } else if (event === 'SIGNED_OUT') {
        setState({ user: null, profile: null, membership: null, organization: null, leagues: [], needsLeagueChoice: false, loading: false });
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshAuth, switchLeague }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
