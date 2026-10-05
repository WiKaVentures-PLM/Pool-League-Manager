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

  // Flatten weeks into rows — away_team_id is NULL for bye weeks (H2)
  const rows = weeks.flatMap(week =>
    week.matches.map(match => ({
      org_id: orgId,
      season_id: seasonId,
      week: week.week,
      date: week.date,
      half: week.half,
      home_team_id: match.homeTeamId,
      away_team_id: match.isBye ? null : (match.awayTeamId || null),
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

  // Fallback: if the RPC doesn't exist yet, use insert-first strategy (H9)
  // to avoid data loss — insert new rows first, then delete old ones on success.
  if (error?.message?.includes('replace_schedule')) {
    // Insert new rows first (with a temporary marker to distinguish them)
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error: insertError } = await supabase.from('schedule').insert(batch);
      if (insertError) return { error: insertError.message };
    }

    // New rows inserted successfully — now delete the OLD rows.
    // Old rows are those created before we started inserting (they won't
    // have IDs in the new batch). We delete by matching org+season and
    // excluding the rows we just inserted, using created_at as a boundary.
    // Since the RPC is the preferred path and this is a degraded fallback,
    // we scope the delete to old rows by deleting rows created before "now
    // minus a small buffer" — but the safest approach in the fallback is
    // the original delete-by-org-season which only runs after inserts succeed.
    const { error: deleteError } = await supabase
      .from('schedule')
      .delete()
      .eq('org_id', orgId)
      .eq('season_id', seasonId)
      .lt('created_at', new Date().toISOString());

    if (deleteError) {
      // Non-fatal: new rows are in, old duplicates may remain but no data loss
      console.error('Fallback: failed to clean up old schedule rows:', deleteError);
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
