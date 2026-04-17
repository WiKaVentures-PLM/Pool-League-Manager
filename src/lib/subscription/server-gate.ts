'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isOrgReadOnly } from './features';

const READ_ONLY_MSG = 'Your account is past due. Please update your payment to continue making changes.';

/**
 * Check if the org is in read-only mode (past_due / canceled / expired).
 * Returns an error string if read-only, null if writes are allowed.
 */
export async function checkOrgWriteAccess(orgId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_status, past_due_since')
    .eq('id', orgId)
    .single();

  if (org && isOrgReadOnly(org.subscription_status)) {
    return READ_ONLY_MSG;
  }

  return null;
}
