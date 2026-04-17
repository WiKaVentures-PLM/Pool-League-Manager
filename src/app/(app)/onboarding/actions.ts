'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ScheduleWeek } from '@/lib/schedule/round-robin';

async function getAdminOrg() {
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
  return { orgId: membership.org_id };
}

export interface OnboardingTeam {
  name: string;
  venue: string;
}

export async function completeOnboarding(payload: {
  leagueName: string;
  seasonName: string;
  startDate: string;
  playDay: number;
  teams: OnboardingTeam[];
  playersByTeam: string[][];
  schedule: ScheduleWeek[];
}) {
  const auth = await getAdminOrg();
  if (!auth) return { error: 'Not authorized' };
  const { orgId } = auth;
  const supabase = createServerSupabaseClient();

  // 1. Update org name
  if (payload.leagueName.trim()) {
    await supabase
      .from('organizations')
      .update({ name: payload.leagueName.trim() })
      .eq('id', orgId);
  }

  // 2. Create season
  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .insert({
      org_id: orgId,
      name: payload.seasonName || 'Season 1',
      status: 'active',
      start_date: payload.startDate || null,
    })
    .select()
    .single();

  if (seasonError || !season) {
    return { error: seasonError?.message || 'Failed to create season' };
  }

  // 3. Create teams (filter to non-empty)
  const validTeams = payload.teams.filter(t => t.name.trim());
  if (validTeams.length < 2) {
    return { error: 'At least 2 teams are required' };
  }

  const teamInserts = validTeams.map(t => ({
    org_id: orgId,
    season_id: season.id,
    name: t.name.trim(),
    venue: t.venue.trim() || null,
  }));

  const { data: createdTeams, error: teamsError } = await supabase
    .from('teams')
    .insert(teamInserts)
    .select();

  if (teamsError || !createdTeams) {
    return { error: teamsError?.message || 'Failed to create teams' };
  }

  // Build name→id map for schedule mapping
  const teamNameToId = new Map(createdTeams.map(t => [t.name, t.id]));

  // 4. Create players
  const playerInserts: Array<{ org_id: string; team_id: string; name: string; is_sub: boolean }> = [];
  for (let i = 0; i < validTeams.length; i++) {
    const team = createdTeams[i];
    if (!team) continue;
    for (const playerName of payload.playersByTeam[i] || []) {
      if (playerName.trim()) {
        playerInserts.push({
          org_id: orgId,
          team_id: team.id,
          name: playerName.trim(),
          is_sub: false,
        });
      }
    }
  }

  if (playerInserts.length > 0) {
    await supabase.from('players').insert(playerInserts);
  }

  // 5. Save schedule — map placeholder indices to real team IDs
  if (payload.schedule.length > 0) {
    const mapId = (id: string) => {
      if (id === 'BYE') return 'BYE';
      // Placeholder IDs are "0", "1", "2", etc. → look up by index, then by name
      const idx = parseInt(id, 10);
      if (!isNaN(idx) && validTeams[idx]) {
        return teamNameToId.get(validTeams[idx].name) || id;
      }
      return id;
    };

    const rows = payload.schedule.flatMap(week =>
      week.matches.map(match => ({
        org_id: orgId,
        season_id: season.id,
        week: week.week,
        date: week.date,
        half: week.half,
        home_team_id: mapId(match.homeTeamId),
        away_team_id: mapId(match.awayTeamId),
        venue: match.venue,
        is_bye: match.isBye,
        is_position_night: match.isPositionNight,
        position_home: match.positionHome,
        position_away: match.positionAway,
      }))
    );

    const { error: schedError } = await supabase.from('schedule').insert(rows);
    if (schedError) {
      return { error: schedError.message };
    }
  }

  // 6. Update league settings play day
  await supabase
    .from('league_settings')
    .update({ play_days: [payload.playDay] })
    .eq('org_id', orgId);

  revalidatePath('/dashboard');
  revalidatePath('/schedule');
  revalidatePath('/teams');

  return { error: null };
}
