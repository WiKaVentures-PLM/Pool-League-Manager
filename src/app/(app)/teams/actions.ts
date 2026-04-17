'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkOrgWriteAccess, checkTeamLimit } from '@/lib/subscription/server-gate';

async function getAuthWithRole() {
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

  if (!membership) return null;

  return { orgId: membership.org_id, role: membership.role, profileId: profile.id };
}

function requireAdmin(auth: { role: string } | null): string | null {
  if (!auth) return 'Not authenticated';
  if (auth.role !== 'admin') return 'Admin role required';
  return null;
}

// ─── Teams ───

export async function createTeam(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const auth = await getAuthWithRole();
  const err = requireAdmin(auth);
  if (err || !auth) return { error: err || 'Not authenticated' };
  const writeErr = await checkOrgWriteAccess(auth.orgId);
  if (writeErr) return { error: writeErr };

  const name = formData.get('name') as string;
  const seasonId = formData.get('season_id') as string;

  const limitErr = await checkTeamLimit(auth.orgId, seasonId);
  if (limitErr) return { error: limitErr };
  const venue = formData.get('venue') as string || null;

  if (!name) return { error: 'Team name is required' };
  if (!seasonId) return { error: 'Season is required' };

  const { error } = await supabase
    .from('teams')
    .insert({ org_id: auth.orgId, season_id: seasonId, name, venue });

  if (error) return { error: error.message };

  revalidatePath('/teams');
  return { error: null };
}

export async function updateTeam(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const auth = await getAuthWithRole();
  const err = requireAdmin(auth);
  if (err || !auth) return { error: err || 'Not authenticated' };
  const writeErr = await checkOrgWriteAccess(auth.orgId);
  if (writeErr) return { error: writeErr };

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const venue = formData.get('venue') as string || null;
  const captainProfileId = formData.get('captain_profile_id') as string || null;

  if (!id || !name) return { error: 'Team name is required' };

  const { error } = await supabase
    .from('teams')
    .update({ name, venue, captain_profile_id: captainProfileId || null })
    .eq('id', id)
    .eq('org_id', auth.orgId);

  if (error) return { error: error.message };

  revalidatePath('/teams');
  revalidatePath(`/teams/${id}`);
  return { error: null };
}

export async function deleteTeam(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const auth = await getAuthWithRole();
  const err = requireAdmin(auth);
  if (err || !auth) return { error: err || 'Not authenticated' };
  const writeErr = await checkOrgWriteAccess(auth.orgId);
  if (writeErr) return { error: writeErr };

  const id = formData.get('id') as string;
  if (!id) return { error: 'Team ID is required' };

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id)
    .eq('org_id', auth.orgId);

  if (error) return { error: error.message };

  revalidatePath('/teams');
  return { error: null };
}

// ─── Players ───

export async function addPlayer(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const auth = await getAuthWithRole();
  if (!auth) return { error: 'Not authenticated' };
  if (auth.role !== 'admin' && auth.role !== 'captain') {
    return { error: 'Only admins and captains can add players' };
  }
  const writeErr = await checkOrgWriteAccess(auth.orgId);
  if (writeErr) return { error: writeErr };

  const teamId = formData.get('team_id') as string;
  const name = formData.get('name') as string;
  const isSub = formData.get('is_sub') === 'true';

  if (!teamId || !name) return { error: 'Player name is required' };

  // Captains can only add players to their own team
  if (auth.role === 'captain') {
    const { data: team } = await supabase
      .from('teams')
      .select('captain_profile_id')
      .eq('id', teamId)
      .eq('org_id', auth.orgId)
      .single();
    if (!team || team.captain_profile_id !== auth.profileId) {
      return { error: 'You can only manage players on your own team' };
    }
  }

  const { error } = await supabase
    .from('players')
    .insert({ org_id: auth.orgId, team_id: teamId, name, is_sub: isSub });

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { error: null };
}

export async function updatePlayer(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const auth = await getAuthWithRole();
  if (!auth) return { error: 'Not authenticated' };
  if (auth.role !== 'admin' && auth.role !== 'captain') {
    return { error: 'Only admins and captains can update players' };
  }
  const writeErr = await checkOrgWriteAccess(auth.orgId);
  if (writeErr) return { error: writeErr };

  const id = formData.get('id') as string;
  const teamId = formData.get('team_id') as string;
  const name = formData.get('name') as string;
  const isSub = formData.get('is_sub') === 'true';

  if (!id || !name) return { error: 'Player name is required' };

  // Captains can only update players on their own team
  if (auth.role === 'captain') {
    const { data: team } = await supabase
      .from('teams')
      .select('captain_profile_id')
      .eq('id', teamId)
      .eq('org_id', auth.orgId)
      .single();
    if (!team || team.captain_profile_id !== auth.profileId) {
      return { error: 'You can only manage players on your own team' };
    }
  }

  const { error } = await supabase
    .from('players')
    .update({ name, is_sub: isSub })
    .eq('id', id)
    .eq('org_id', auth.orgId);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { error: null };
}

export async function removePlayer(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const auth = await getAuthWithRole();
  const err = requireAdmin(auth);
  if (err || !auth) return { error: err || 'Not authenticated' };
  const writeErr = await checkOrgWriteAccess(auth.orgId);
  if (writeErr) return { error: writeErr };

  const id = formData.get('id') as string;
  const teamId = formData.get('team_id') as string;

  if (!id) return { error: 'Player ID is required' };

  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', id)
    .eq('org_id', auth.orgId);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { error: null };
}
