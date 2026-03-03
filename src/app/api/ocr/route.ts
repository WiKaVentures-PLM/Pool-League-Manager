import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parseScoresheetImage } from '@/lib/ocr/parse-scoresheet';
import { hasFeature, isOrgReadOnly } from '@/lib/subscription/features';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Authenticate
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const { data: membership } = await supabase
    .from('memberships')
    .select('org_id, role')
    .eq('profile_id', profile.id)
    .single();
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
    .select('subscription_tier, subscription_status')
    .eq('id', membership.org_id)
    .single();

  if (!org || !hasFeature(org.subscription_tier, 'hasOcrScanning')) {
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
