'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ScheduleWeek } from '@/lib/schedule/round-robin';
import { checkOrgWriteAccess } from '@/lib/subscription/server-gate';
import { getActiveAdminOrgId } from '@/lib/auth/active-org';

// Resolves the league the user has SELECTED (see getActiveOrgContext),
// not whichever membership happens to come first. Keeps this in step with
// auth_org_id() so RLS and the action agree on the league.
async function getAdminOrgId() {
  return await getActiveAdminOrgId();
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

  // Keep the season's span in step with the schedule it actually has. Before
  // this, seasons could sit with null start_date/end_date even once a full
  // schedule existed, leaving /history and standings with no date range to
  // show. Derived from the saved weeks so the two can never disagree.
  const dates = weeks.map(w => w.date).sort();
  if (dates.length > 0) {
    const { error: seasonError } = await supabase
      .from('seasons')
      .update({ start_date: dates[0], end_date: dates[dates.length - 1] })
      .eq('id', seasonId)
      .eq('org_id', orgId);
    // Non-fatal: the schedule saved fine, the span is cosmetic.
    if (seasonError) console.error('Failed to update season span:', seasonError);
  }

  revalidatePath('/schedule');
  revalidatePath('/history');
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
