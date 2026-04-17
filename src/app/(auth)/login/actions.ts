'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = createServerSupabaseClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Invalid email or password' };
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
