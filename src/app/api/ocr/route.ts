import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parseScoresheetImage } from '@/lib/ocr/parse-scoresheet';
import { hasFeature, isOrgReadOnly, effectiveTier } from '@/lib/subscription/features';
import { getActiveOrgContext } from '@/lib/auth/active-org';

export const runtime = 'nodejs';

// ─── H7: In-memory rate limiter — 10 OCR requests per user per hour ───
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Map<userId, timestamp[]>
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) ?? [];

  // Prune timestamps older than the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(userId, recent);
    return true;
  }

  recent.push(now);
  rateLimitMap.set(userId, recent);
  return false;
}

// Periodic cleanup to prevent memory leaks (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of rateLimitMap.entries()) {
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      rateLimitMap.delete(userId);
    } else {
      rateLimitMap.set(userId, recent);
    }
  }
}, 10 * 60 * 1000).unref?.();

export async function POST(request: NextRequest) {
  // Authenticate
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check (H7)
  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 10 OCR requests per hour. Please try again later.' },
      { status: 429 },
    );
  }

  // Verify org membership and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  // Use the league the user has selected, matching auth_org_id() and every
  // server action, rather than whichever membership sorts first.
  const membership = await getActiveOrgContext();
  if (!membership) {
    return NextResponse.json({ error: 'No organization membership' }, { status: 403 });
  }

  // Only captains and admins can use OCR
  if (membership.role !== 'admin' && membership.role !== 'captain') {
    return NextResponse.json({ error: 'Only admins and captains can scan scoresheets' }, { status: 403 });
  }

  // Check subscription tier supports OCR
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier, subscription_status, trial_ends_at')
    .eq('id', membership.orgId)
    .single();

  if (!org || !hasFeature(effectiveTier(org), 'hasOcrScanning')) {
    return NextResponse.json({ error: 'OCR scanning requires a Pro plan or higher. Upgrade in Settings > Billing.' }, { status: 403 });
  }

  // Block if org is read-only (past_due/canceled/expired)
  if (isOrgReadOnly(org.subscription_status)) {
    return NextResponse.json({ error: 'Your account is past due. Please update your payment to continue.' }, { status: 403 });
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('image') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid image type. Use JPEG, PNG, or WebP.' }, { status: 400 });
  }

  // Validate file size (5MB max for Claude Vision)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image too large. Maximum 5MB.' }, { status: 400 });
  }

  const homeTeamName = formData.get('homeTeamName') as string || '';
  const awayTeamName = formData.get('awayTeamName') as string || '';
  let homeRoster: string[] = [];
  let awayRoster: string[] = [];
  try {
    homeRoster = JSON.parse(formData.get('homeRoster') as string || '[]');
    awayRoster = JSON.parse(formData.get('awayRoster') as string || '[]');
  } catch {
    return NextResponse.json({ error: 'Invalid roster data' }, { status: 400 });
  }
  const matchesPerNight = parseInt(formData.get('matchesPerNight') as string || '5', 10);
  const bestOf = parseInt(formData.get('bestOf') as string || '3', 10);

  // Convert to base64
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';

  try {
    const result = await parseScoresheetImage(base64, mediaType, {
      homeTeamName,
      awayTeamName,
      homeRoster,
      awayRoster,
      matchesPerNight,
      bestOf,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('OCR parsing failed:', err);
    return NextResponse.json(
      { error: 'Failed to parse scoresheet. Please try again or enter scores manually.' },
      { status: 500 },
    );
  }
}
