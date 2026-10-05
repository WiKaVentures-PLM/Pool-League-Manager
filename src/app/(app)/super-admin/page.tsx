'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Building2, Users, LogIn, AlertTriangle, RefreshCw } from 'lucide-react';

type Overview = {
  orgs_total: number;
  orgs_paying: number;
  orgs_trialing: number;
  orgs_past_due: number;
  trials_ending_7d: number;
  by_tier: Record<string, number>;
  by_status: Record<string, number>;
  users_total: number;
  users_with_phone: number;
  auth_users_total: number;
  signups_30d: number;
  teams_total: number;
  players_total: number;
  seasons_active: number;
  logins_24h: number;
  logins_7d: number;
  logins_30d: number;
  active_users_7d: number;
  active_users_30d: number;
  login_tracking_since: string | null;
  sms_consents_granted: number;
  sms_queued_stuck: number;
};

type OrgRow = {
  id: string;
  name: string;
  slug: string | null;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  has_stripe: boolean;
  member_count: number;
  team_count: number;
  player_count: number;
  last_login: string | null;
};

type UserRow = {
  profile_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  is_super_admin: boolean;
  org_name: string | null;
  org_role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  login_count_30d: number;
  login_count_total: number;
};

function fmtDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtDateTime(value: string | null) {
  if (!value) return 'never';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-amber-100 text-amber-800',
  canceled: 'bg-slate-200 text-slate-600',
  expired: 'bg-slate-200 text-slate-600',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  );
}

function Tile({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: typeof Users;
  tone?: 'default' | 'warn';
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        tone === 'warn'
          ? 'border-amber-300 bg-amber-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <div className="text-3xl font-black text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function SuperAdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [o, g, u] = await Promise.all([
      supabase.rpc('platform_overview'),
      supabase.rpc('platform_organizations'),
      supabase.rpc('platform_users'),
    ]);

    const failure = o.error || g.error || u.error;
    if (failure) {
      setError(failure.message);
      setLoading(false);
      return;
    }

    setOverview(o.data as Overview);
    setOrgs((g.data as OrgRow[]) ?? []);
    setUsers((u.data as UserRow[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authLoading && profile?.is_super_admin) load();
  }, [authLoading, profile?.is_super_admin, load]);

  if (authLoading) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }

  // The RPCs enforce this server-side too; this is just a kinder UI than an error.
  if (!profile?.is_super_admin) {
    return (
      <div className="p-8">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6">
          <Shield className="w-6 h-6 text-slate-400 mb-3" />
          <h1 className="text-lg font-bold text-slate-900 mb-1">Not authorized</h1>
          <p className="text-sm text-slate-500">
            This page is restricted to platform super admins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-black text-slate-900">Platform Admin</h1>
          </div>
          <p className="text-sm text-slate-500">
            Every league, user, and subscription across the platform.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong className="font-semibold">Failed to load:</strong> {error}
        </div>
      )}

      {overview && (
        <>
          {/* Subscriptions */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
              Subscriptions
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="Leagues" value={overview.orgs_total} icon={Building2} />
              <Tile
                label="Paying"
                value={overview.orgs_paying}
                sub="active and not on trial"
              />
              <Tile label="On trial" value={overview.orgs_trialing} />
              <Tile
                label="Past due"
                value={overview.orgs_past_due}
                tone={overview.orgs_past_due > 0 ? 'warn' : 'default'}
              />
            </div>
            {overview.trials_ending_7d > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {overview.trials_ending_7d} trial
                {overview.trials_ending_7d === 1 ? '' : 's'} ending in the next 7 days.
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {Object.entries(overview.by_tier).map(([tier, n]) => (
                <span key={tier} className="px-2 py-1 rounded bg-slate-100">
                  {tier}: <strong className="text-slate-700">{n}</strong>
                </span>
              ))}
            </div>
          </section>

          {/* Users and activity */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
              Users &amp; activity
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile
                label="Users"
                value={overview.users_total}
                sub={`${overview.users_with_phone} with a phone number`}
                icon={Users}
              />
              <Tile label="New sign-ups" value={overview.signups_30d} sub="last 30 days" />
              <Tile
                label="Logins"
                value={overview.logins_7d}
                sub={`${overview.logins_24h} in last 24h · ${overview.logins_30d} in 30d`}
                icon={LogIn}
              />
              <Tile
                label="Active users"
                value={overview.active_users_7d}
                sub={`last 7 days · ${overview.active_users_30d} in 30d`}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {overview.login_tracking_since
                ? `Login tracking began ${fmtDate(overview.login_tracking_since)}. Counts cover app sign-ins only.`
                : 'No logins recorded yet — tracking starts with the next app sign-in.'}
            </p>
          </section>

          {/* League content + SMS health */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
              Content &amp; SMS
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Tile label="Active seasons" value={overview.seasons_active} />
              <Tile label="Teams" value={overview.teams_total} />
              <Tile label="Players" value={overview.players_total} />
              <Tile label="SMS consents" value={overview.sms_consents_granted} />
              <Tile
                label="Stuck SMS"
                value={overview.sms_queued_stuck}
                sub="queued over 1h"
                tone={overview.sms_queued_stuck > 0 ? 'warn' : 'default'}
              />
            </div>
          </section>
        </>
      )}

      {/* Leagues table */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
          Leagues ({orgs.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="text-left font-semibold px-4 py-3">League</th>
                <th className="text-left font-semibold px-4 py-3">Tier</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Members</th>
                <th className="text-right font-semibold px-4 py-3">Teams</th>
                <th className="text-right font-semibold px-4 py-3">Players</th>
                <th className="text-left font-semibold px-4 py-3">Stripe</th>
                <th className="text-left font-semibold px-4 py-3">Trial ends</th>
                <th className="text-left font-semibold px-4 py-3">Last login</th>
                <th className="text-left font-semibold px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgs.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{o.name}</div>
                    {o.slug && <div className="text-xs text-slate-400">{o.slug}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.subscription_tier}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.subscription_status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{o.member_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{o.team_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{o.player_count}</td>
                  <td className="px-4 py-3">
                    {o.has_stripe ? (
                      <span className="text-emerald-600 font-medium">linked</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(o.trial_ends_at)}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtDateTime(o.last_login)}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(o.created_at)}</td>
                </tr>
              ))}
              {orgs.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No leagues yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Users table */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
          Users ({users.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="text-left font-semibold px-4 py-3">User</th>
                <th className="text-left font-semibold px-4 py-3">League</th>
                <th className="text-left font-semibold px-4 py-3">Role</th>
                <th className="text-left font-semibold px-4 py-3">Phone</th>
                <th className="text-right font-semibold px-4 py-3">Logins 30d</th>
                <th className="text-right font-semibold px-4 py-3">Logins total</th>
                <th className="text-left font-semibold px-4 py-3">Last sign-in</th>
                <th className="text-left font-semibold px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={`${u.profile_id}-${u.org_name ?? 'none'}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      {u.name || '—'}
                      {u.is_super_admin && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                          super
                        </span>
                      )}
                      {!u.email_confirmed && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                          unconfirmed
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.org_name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{u.org_role ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{u.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.login_count_30d}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.login_count_total}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtDateTime(u.last_sign_in_at)}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(u.created_at)}</td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
