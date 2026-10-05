'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logout } from '@/app/(auth)/login/actions';
import type { Profile, Membership, Organization } from '@/types';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  membership: Membership | null;
  organization: Organization | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    membership: null,
    organization: null,
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

    // Load membership with org. Ordered by created_at so that when a profile
    // belongs to more than one league, the client and the server actions pick
    // the SAME one — an unordered limit(1) could disagree and silently act on
    // a different league than the UI is showing.
    const { data: membership } = await supabase
      .from('memberships')
      .select('*, organization:organizations(*)')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const org = membership
      ? (membership as Membership & { organization: Organization }).organization
      : null;

    setState({
      user,
      profile,
      membership: membership || null,
      organization: org || null,
      loading: false,
    });
  }

  async function refreshAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await loadUserData(user);
    } else {
      setState({ user: null, profile: null, membership: null, organization: null, loading: false });
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

    setState({ user: null, profile: null, membership: null, organization: null, loading: false });
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
        setState({ user: null, profile: null, membership: null, organization: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
