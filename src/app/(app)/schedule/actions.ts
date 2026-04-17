'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ScheduleWeek } from '@/lib/schedule/round-robin';
import { checkOrgWriteAccess } from '@/lib/subscription/server-gate';

async function getAdminOrgId() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  if (!profile) return null;

  const { data: membership } = await supabase
    .from('memberships')
    .select('org_id, role')
    .eq('profile_id', profile.id)
    .single();

  if (!membership || membership.role !== 'admin') return null;

  return membership.org_id;
}

export async function saveSchedule(seasonId: string, weeks: ScheduleWeek[]) {
  const supabase = createServerSupabaseClient();
  const orgId = await getAdminOrgId();
  if (!orgId) return { error: 'Not authorized. Admin role required.' };
  const writeErr = await checkOrgWriteAccess(orgId);
  if (writeErr) return { error: writeErr };

  // Flatten weeks into rows
  const rows = weeks.flatMap(week =>
    week.matches.map(match => ({
      org_id: orgId,
      season_id: seasonId,
      week: week.week,
      date: week.date,
      half: week.half,
      home_team_id: match.homeTeamId,
      away_team_id: match.awayTeamId,
      venue: match.venue,
      is_bye: match.isBye,
      is_position_night: match.isPositionNight,
      position_home: match.positionHome,
      position_away: match.positionAway,
    }))
  );

  // Use an RPC for atomic delete+insert to prevent partial schedules
  const { error } = await supabase.rpc('replace_schedule', {
    p_org_id: orgId,
    p_season_id: seasonId,
    p_rows: rows,
  });

  // Fallback: if the RPC doesn't exist yet, do it the old way
  if (error?.message?.includes('replace_schedule')) {
    const { error: deleteError } = await supabase
      .from('schedule')
      .delete()
      .eq('org_id', orgId)
      .eq('season_id', seasonId);

    if (deleteError) return { error: deleteError.message };

    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error: insertError } = await supabase.from('schedule').insert(batch);
      if (insertError) return { error: insertError.message };
    }
  } else if (error) {
    return { error: error.message };
  }

  revalidatePath('/schedule');
  return { error: null };
}

export async function deleteSchedule(seasonId: string) {
  const supabase = createServerSupabaseClient();
  const orgId = await getAdminOrgId();
  if (!orgId) return { error: 'Not authorized. Admin role required.' };
  const writeErr = await checkOrgWriteAccess(orgId);
  if (writeErr) return { error: writeErr };

  const { error } = await supabase
    .from('schedule')
    .delete()
    .eq('org_id', orgId)
    .eq('season_id', seasonId);

  if (error) return { error: error.message };

  revalidatePath('/schedule');
  return { error: null };
}
