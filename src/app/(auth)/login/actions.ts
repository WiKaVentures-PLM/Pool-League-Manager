'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = createServerSupabaseClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Invalid email or password' };
  }

  // Record the login for the platform admin view. Supabase only keeps
  // last_sign_in_at (a timestamp, not a count) and its own audit log is empty
  // on this project, so this ledger is our source of truth. Never let a
  // bookkeeping failure block a successful sign-in.
  if (data.user) {
    try {
      const serviceClient = createServiceRoleClient();
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .maybeSingle();

      await serviceClient.from('login_events').insert({
        auth_user_id: data.user.id,
        profile_id: profile?.id ?? null,
        email: data.user.email ?? email,
      });
    } catch (err) {
      console.error('Failed to record login event:', err);
    }
  }

  return { error: null };
}

export async function logout() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const email = formData.get('email') as string;

  if (!email) return { error: 'Email is required' };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pool-league-manager.com'}/auth/confirm?type=recovery`,
  });

  if (error) {
    return { error: 'Failed to send reset email. Please try again.' };
  }

  return { error: null, message: 'Check your email for a password reset link.' };
}

export async function updatePassword(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const password = formData.get('password') as string;

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: 'Failed to update password. Please try again.' };
  }

  return { error: null };
}
