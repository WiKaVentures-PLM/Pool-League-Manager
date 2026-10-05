import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Record<string, unknown>)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // /privacy, /terms and /sms must stay reachable without a session: mobile
  // carriers review them as part of our A2P 10DLC campaign registration (/sms is
  // the public opt-in call-to-action they vet), and they are linked from the
  // public marketing pages.
  const publicPaths = ['/', '/login', '/signup', '/pricing', '/privacy', '/terms', '/sms', '/auth/confirm', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  );

  // A bare NextResponse.redirect() starts with no cookies, so any tokens
  // Supabase refreshed during this request would be silently discarded —
  // logging the user out at random. Carry them onto the redirect.
  function redirectTo(path: string) {
    const response = NextResponse.redirect(new URL(path, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  }

  if (!user && !isPublicPath) {
    return redirectTo('/login');
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    return redirectTo('/dashboard');
  }

  return supabaseResponse;
}
