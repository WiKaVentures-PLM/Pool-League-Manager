'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { generateSchedule, type ScheduleTeam, type ScheduleWeek } from '@/lib/schedule/round-robin';
import { completeOnboarding } from '@/app/(app)/onboarding/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, Plus, Trash2, Calendar, Users, CheckCircle2 } from 'lucide-react';

type GameType = '8-ball' | '9-ball' | '10-ball';

const PLAY_DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
];

interface TeamRow { name: string; venue: string }

const STEP_LABELS = ['League Setup', 'Teams', 'Players', 'Schedule', "You're Ready!"];

export function OnboardingWizard() {
  const router = useRouter();
  const { organization, refreshAuth } = useAuth();
  const { refreshOrg } = useOrg();

  const [step, setStep] = useState(1);
  const [leagueName, setLeagueName] = useState(organization?.name ?? '');
  const [gameType, setGameType] = useState<GameType>('8-ball');
  const [playDay, setPlayDay] = useState(3);
  const [teams, setTeams] = useState<TeamRow[]>([
    { name: '', venue: '' },
    { name: '', venue: '' },
    { name: '', venue: '' },
    { name: '', venue: '' },
  ]);
  const [playersByTeam, setPlayersByTeam] = useState<string[][]>([[''], [''], [''], ['']]);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [seasonName, setSeasonName] = useState('Season 1');
  const [startDate, setStartDate] = useState('');
  const [schedule, setSchedule] = useState<ScheduleWeek[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validTeams = teams.filter(t => t.name.trim());
  const step1Valid = leagueName.trim().length > 0;
  const step2Valid = validTeams.length >= 2;

  // ── Team helpers ──────────────────────────────────────────────────────────

  function addTeam() {
    setTeams(t => [...t, { name: '', venue: '' }]);
    setPlayersByTeam(p => [...p, ['']]);
  }

  function removeTeam(i: number) {
    if (teams.length <= 2) return;
    setTeams(t => t.filter((_, idx) => idx !== i));
    setPlayersByTeam(p => p.filter((_, idx) => idx !== i));
    setActiveTeamIdx(prev => Math.min(prev, teams.length - 2));
  }

  function updateTeam(i: number, field: keyof TeamRow, value: string) {
    setTeams(t => t.map((team, idx) => idx === i ? { ...team, [field]: value } : team));
  }

  // ── Player helpers ────────────────────────────────────────────────────────

  function addPlayer(teamIdx: number) {
    setPlayersByTeam(p => p.map((players, i) => i === teamIdx ? [...players, ''] : players));
  }

  function removePlayer(teamIdx: number, playerIdx: number) {
    setPlayersByTeam(p => p.map((players, i) =>
      i === teamIdx ? players.filter((_, j) => j !== playerIdx) : players
    ));
  }

  function updatePlayer(teamIdx: number, playerIdx: number, value: string) {
    setPlayersByTeam(p => p.map((players, i) =>
      i === teamIdx ? players.map((n, j) => j === playerIdx ? value : n) : players
    ));
  }

  // ── Schedule ──────────────────────────────────────────────────────────────

  function handleGenerateSchedule() {
    if (!startDate || validTeams.length < 2) return;

    const schedTeams: ScheduleTeam[] = validTeams.map((t, i) => ({
      id: String(i),
      name: t.name,
      venue: t.venue || null,
    }));

    const weeks = generateSchedule({
      teams: schedTeams,
      startDate,
      playDays: [playDay],
      frequency: 'weekly',
      timesToPlay: 2,
      positionNights: 0,
      positionNightPlacement: 'half',
    });

    setSchedule(weeks);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleComplete() {
    setLoading(true);
    setError('');

    const result = await completeOnboarding({
      leagueName,
      seasonName,
      startDate,
      playDay,
      teams: validTeams,
      playersByTeam: validTeams.map((_, i) => playersByTeam[i] || []),
      schedule,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    await refreshAuth();
    await refreshOrg();
    setStep(5);
    setLoading(false);
  }

  const totalPlayers = validTeams.reduce(
    (sum, _, i) => sum + (playersByTeam[i] || []).filter(n => n.trim()).length,
    0
  );

  const progress = ((step - 1) / (STEP_LABELS.length - 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎱</div>
        <h1 className="text-2xl font-black text-slate-800">Welcome to Pool League Manager!</h1>
        <p className="text-slate-500 mt-1">Let&apos;s get your league set up in a few minutes.</p>
      </div>

      {/* Progress bar */}
      {step < 5 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2">
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={
                  step > i + 1
                    ? 'text-emerald-600 font-semibold'
                    : step === i + 1
                    ? 'text-slate-800 font-semibold'
                    : 'text-slate-400'
                }
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-2 bg-slate-200 rounded-full">
            <div
              className="h-2 bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">

        {/* ── Step 1: League Setup ─────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Name Your League</h2>
            <p className="text-sm text-slate-500 mb-6">Confirm your league name and pick your game format.</p>

            <div className="space-y-5">
              <Input
                label="League Name"
                value={leagueName}
                onChange={e => setLeagueName(e.target.value)}
                placeholder="e.g. Cedar Rapids 8-Ball League"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Game Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['8-ball', '9-ball', '10-ball'] as GameType[]).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGameType(g)}
                      className={`py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
                        gameType === g
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Play Night</label>
                <div className="grid grid-cols-7 gap-1">
                  {PLAY_DAYS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setPlayDay(d.value)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                        playDay === d.value
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!step1Valid}>
                Next: Add Teams <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Teams ────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Add Your Teams</h2>
            <p className="text-sm text-slate-500 mb-6">Enter each team name and the bar or venue they play at.</p>

            <div className="space-y-3">
              {teams.map((team, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    placeholder={`Team ${i + 1} name`}
                    value={team.name}
                    onChange={e => updateTeam(i, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Venue (optional)"
                    value={team.venue}
                    onChange={e => updateTeam(i, 'venue', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeTeam(i)}
                    disabled={teams.length <= 2}
                    className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addTeam}
              className="mt-4 flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Plus className="w-4 h-4" /> Add another team
            </button>

            {!step2Valid && (
              <p className="mt-3 text-sm text-amber-600">Add at least 2 team names to continue.</p>
            )}

            <div className="mt-8 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!step2Valid}>
                Next: Add Players <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Players ──────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Add Players</h2>
            <p className="text-sm text-slate-500 mb-4">Optional — add player names now or skip and do it later.</p>

            {/* Team tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {validTeams.map((team, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTeamIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTeamIdx === i
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {team.name}
                  {(playersByTeam[i] || []).filter(n => n.trim()).length > 0 && (
                    <span className="ml-1.5 text-xs opacity-75">
                      {(playersByTeam[i] || []).filter(n => n.trim()).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">
                {validTeams[activeTeamIdx]?.name}
              </h3>
              <div className="space-y-2">
                {(playersByTeam[activeTeamIdx] || []).map((player, j) => (
                  <div key={j} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Player ${j + 1}`}
                      value={player}
                      onChange={e => updatePlayer(activeTeamIdx, j, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => removePlayer(activeTeamIdx, j)}
                      disabled={(playersByTeam[activeTeamIdx] || []).length <= 1}
                      className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addPlayer(activeTeamIdx)}
                className="mt-3 flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Plus className="w-4 h-4" /> Add player
              </button>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(4)}>Skip for now</Button>
                <Button onClick={() => setStep(4)}>
                  Next: Schedule <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Schedule ─────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Generate Schedule</h2>
            <p className="text-sm text-slate-500 mb-6">
              Pick a start date and we&apos;ll build your round-robin schedule.
            </p>

            <div className="space-y-4">
              <Input
                label="Season Name"
                value={seasonName}
                onChange={e => setSeasonName(e.target.value)}
                placeholder="e.g. Spring 2025"
              />

              <Input
                label="Season Start Date"
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setSchedule([]); }}
              />

              {startDate && schedule.length === 0 && (
                <button
                  type="button"
                  onClick={handleGenerateSchedule}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Generate Preview
                </button>
              )}

              {schedule.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {schedule.length} weeks generated for {validTeams.length} teams
                  </div>
                  <div className="space-y-0.5 max-h-40 overflow-y-auto">
                    {schedule.slice(0, 6).map(week => (
                      <div key={week.week} className="text-xs text-emerald-600">
                        Week {week.week} —{' '}
                        {new Date(week.date + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </div>
                    ))}
                    {schedule.length > 6 && (
                      <div className="text-xs text-emerald-500">+ {schedule.length - 6} more weeks</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSchedule([]); }}
                    className="mt-2 text-xs text-emerald-600 hover:text-emerald-800 underline"
                  >
                    Change date
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
              <div className="flex gap-3">
                {schedule.length === 0 && (
                  <Button variant="secondary" loading={loading} onClick={handleComplete}>
                    Skip &amp; Finish
                  </Button>
                )}
                {schedule.length > 0 && (
                  <Button loading={loading} onClick={handleComplete}>
                    Save &amp; Finish! 🎉
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Done ─────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="text-center py-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">You&apos;re all set!</h2>
            <p className="text-slate-500 mb-8">Your league is ready to go. Here&apos;s what we created:</p>

            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-slate-50 rounded-xl p-4">
                <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-3xl font-black text-slate-800">{validTeams.length}</div>
                <div className="text-sm text-slate-500 mt-0.5">Teams</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-2xl mb-2">🎱</div>
                <div className="text-3xl font-black text-slate-800">{totalPlayers}</div>
                <div className="text-sm text-slate-500 mt-0.5">Players</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <Calendar className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-3xl font-black text-slate-800">{schedule.length}</div>
                <div className="text-sm text-slate-500 mt-0.5">Weeks</div>
              </div>
            </div>

            <Button size="lg" onClick={() => router.refresh()}>
              Go to Dashboard <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
