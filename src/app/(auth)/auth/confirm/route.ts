import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (error) {
      const errorUrl = new URL('/login', request.url);
      errorUrl.searchParams.set('error', 'Verification failed. The link may have expired.');
      return NextResponse.redirect(errorUrl);
    }

    // After successful recovery OTP verification, redirect to reset password page
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/reset-password', request.url));
    }
  } else {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
