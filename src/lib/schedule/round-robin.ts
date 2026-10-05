/**
 * Pure round-robin schedule generator — no React or Supabase deps.
 *
 * Uses the "circle method" (polygon scheduling) to generate a fair
 * round-robin tournament. Supports:
 *   - Odd number of teams (BYE inserted)
 *   - Multiple halves (home/away flip)
 *   - times_to_play > 2 (additional halves)
 *   - Position nights (re-seeded matchups)
 *   - Venue conflict resolution (swap home/away)
 *   - Play days + frequency settings
 */

export interface ScheduleTeam {
  id: string;
  name: string;
  venue: string | null;
}

export interface ScheduleWeek {
  week: number;
  date: string; // ISO date string
  half: number;
  matches: ScheduleMatch[];
}

export interface ScheduleMatch {
  homeTeamId: string;
  awayTeamId: string;
  venue: string | null;
  isBye: boolean;
  isPositionNight: boolean;
  positionHome: number | null;
  positionAway: number | null;
}

export interface ScheduleConfig {
  teams: ScheduleTeam[];
  startDate: string; // ISO date string (should be the first play day)
  playDays: number[]; // 1=Mon .. 7=Sun
  frequency: 'weekly' | 'biweekly';
  timesToPlay: number; // 1 = single round-robin, 2 = home & away, etc.
  positionNights: number; // 0, 1, 2, 3
  /**
   * Total number of position nights for the whole season. They are spread
   * evenly, with the last one always falling at the end of the season:
   * 1 -> end; 2 -> middle and end; 3 -> thirds and end; and so on.
   */
}

const BYE_ID = 'BYE';

/**
 * Circle method round-robin.
 * Fix team[0] in place, rotate the rest.
 * Returns array of rounds, each round is an array of [home, away] index pairs.
 */
function generateCircleRounds(n: number): [number, number][][] {
  // If odd, add a BYE slot
  const count = n % 2 === 0 ? n : n + 1;
  const rounds: [number, number][][] = [];
  const numRounds = count - 1;

  // Create initial array [0, 1, 2, ..., count-1]
  const teams = Array.from({ length: count }, (_, i) => i);

  for (let r = 0; r < numRounds; r++) {
    const round: [number, number][] = [];

    for (let i = 0; i < count / 2; i++) {
      const home = teams[i];
      const away = teams[count - 1 - i];

      // Alternate home/away by round to balance
      if (r % 2 === 0) {
        round.push([home, away]);
      } else {
        round.push([away, home]);
      }
    }

    rounds.push(round);

    // Rotate: fix teams[0], rotate the rest clockwise
    const last = teams.pop()!;
    teams.splice(1, 0, last);
  }

  return rounds;
}

/**
 * Resolve venue conflicts within a week.
 * If two matches share the same venue in one week, swap home/away on one of them.
 */
function resolveVenueConflicts(matches: ScheduleMatch[], teams: ScheduleTeam[]): ScheduleMatch[] {
  const teamMap = new Map(teams.map(t => [t.id, t]));
  const usedVenues = new Set<string>();

  return matches.map(match => {
    if (match.isBye || !match.venue) return match;

    if (usedVenues.has(match.venue)) {
      // Swap home/away to use the away team's venue instead
      const awayTeam = teamMap.get(match.awayTeamId);
      const swappedVenue = awayTeam?.venue || null;

      // Only swap if the away venue is different and not already used
      if (swappedVenue && swappedVenue !== match.venue && !usedVenues.has(swappedVenue)) {
        usedVenues.add(swappedVenue);
        return {
          ...match,
          homeTeamId: match.awayTeamId,
          awayTeamId: match.homeTeamId,
          venue: swappedVenue,
        };
      }
    }

    usedVenues.add(match.venue);
    return match;
  });
}

/**
 * Get the next play date from a given date.
 */
function getNextPlayDate(
  fromDate: Date,
  playDays: number[],
  frequency: 'weekly' | 'biweekly',
  isFirst: boolean
): Date {
  if (isFirst) {
    // Return the fromDate itself if it falls on a play day
    const dayOfWeek = fromDate.getDay() || 7; // Convert Sunday=0 to 7
    if (playDays.includes(dayOfWeek)) return fromDate;
  }

  const result = new Date(fromDate);
  const step = frequency === 'biweekly' && !isFirst ? 14 : 7;
  result.setDate(result.getDate() + step);

  // Find the nearest play day
  const dayOfWeek = result.getDay() || 7;
  if (!playDays.includes(dayOfWeek)) {
    // Find next valid play day
    for (let d = 1; d <= 7; d++) {
      const candidate = new Date(result);
      candidate.setDate(candidate.getDate() + d);
      const candDay = candidate.getDay() || 7;
      if (playDays.includes(candDay)) return candidate;
    }
  }

  return result;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Generate position night matches.
 * 1st plays 2nd, 3rd plays 4th, etc.
 * Teams are ordered by their standing position (just sequential for pre-season).
 */
function generatePositionNightMatches(
  teamIds: string[],
  teams: ScheduleTeam[]
): ScheduleMatch[] {
  const matches: ScheduleMatch[] = [];
  const teamMap = new Map(teams.map(t => [t.id, t]));

  for (let i = 0; i < teamIds.length - 1; i += 2) {
    const homeId = teamIds[i];
    const awayId = teamIds[i + 1];

    // Skip if either is BYE
    if (homeId === BYE_ID || awayId === BYE_ID) {
      const realId = homeId === BYE_ID ? awayId : homeId;
      matches.push({
        homeTeamId: realId,
        awayTeamId: BYE_ID,
        venue: teamMap.get(realId)?.venue || null,
        isBye: true,
        isPositionNight: true,
        positionHome: i + 1,
        positionAway: i + 2,
      });
      continue;
    }

    matches.push({
      homeTeamId: homeId,
      awayTeamId: awayId,
      venue: teamMap.get(homeId)?.venue || null,
      isBye: false,
      isPositionNight: true,
      positionHome: i + 1,
      positionAway: i + 2,
    });
  }

  // If odd number of teams, last team gets a bye
  if (teamIds.length % 2 !== 0) {
    const lastId = teamIds[teamIds.length - 1];
    if (lastId !== BYE_ID) {
      matches.push({
        homeTeamId: lastId,
        awayTeamId: BYE_ID,
        venue: teamMap.get(lastId)?.venue || null,
        isBye: true,
        isPositionNight: true,
        positionHome: teamIds.length,
        positionAway: null,
      });
    }
  }

  return matches;
}

/**
 * Main schedule generation function.
 */
/**
 * Evenly spaced insertion points for N position nights across M match rounds,
 * expressed as "insert after this many match rounds". The last entry is always
 * M, so a position night always closes the season.
 *
 *   N=1, M=14 -> [14]            end
 *   N=2, M=14 -> [7, 14]         middle, end
 *   N=3, M=14 -> [5, 9, 14]      thirds, end
 *   N=4, M=14 -> [4, 7, 11, 14]  quarters, end
 *
 * Exported so the behaviour can be unit-checked without generating a schedule.
 */
export function positionNightOffsets(positionNights: number, matchRounds: number): number[] {
  if (positionNights <= 0 || matchRounds <= 0) return [];
  const offsets: number[] = [];
  for (let k = 1; k <= positionNights; k++) {
    const raw = Math.round((k * matchRounds) / positionNights);
    offsets.push(Math.min(Math.max(raw, 1), matchRounds));
  }
  return offsets;
}

export function generateSchedule(config: ScheduleConfig): ScheduleWeek[] {
  const { teams, startDate, playDays, frequency, timesToPlay, positionNights } = config;

  if (teams.length < 2) return [];
  if (playDays.length === 0) return [];

  const teamIds = teams.map(t => t.id);
  const hasBye = teams.length % 2 !== 0;
  const teamCount = hasBye ? teams.length + 1 : teams.length;
  const allIds = hasBye ? [...teamIds, BYE_ID] : [...teamIds];

  // Generate base rounds using circle method
  const baseRounds = generateCircleRounds(teamCount);
  const roundsPerHalf = baseRounds.length; // n-1 rounds per half

  type PlannedWeek = { half: number; matches: ScheduleMatch[] };

  // 1. Build every match round first. Position nights are placed afterwards, so
  //    they can be spread across the whole season instead of being bolted onto
  //    each half — which is what made "2 position nights" produce 4.
  const planned: PlannedWeek[] = [];

  for (let half = 1; half <= timesToPlay; half++) {
    for (let r = 0; r < roundsPerHalf; r++) {
      const roundPairs = baseRounds[r];
      const matches: ScheduleMatch[] = roundPairs.map(([homeIdx, awayIdx]) => {
        let homeId = allIds[homeIdx];
        let awayId = allIds[awayIdx];

        // In even halves, flip home/away
        if (half % 2 === 0) {
          [homeId, awayId] = [awayId, homeId];
        }

        const isBye = homeId === BYE_ID || awayId === BYE_ID;
        const realHomeId = homeId === BYE_ID ? awayId : homeId;
        const teamMap = new Map(teams.map(t => [t.id, t]));
        const venue = isBye
          ? teamMap.get(realHomeId)?.venue || null
          : teamMap.get(homeId)?.venue || null;

        return {
          homeTeamId: isBye ? realHomeId : homeId,
          awayTeamId: isBye ? BYE_ID : awayId,
          venue,
          isBye,
          isPositionNight: false,
          positionHome: null,
          positionAway: null,
        };
      });

      planned.push({ half, matches: resolveVenueConflicts(matches, teams) });
    }
  }

  // 2. Insert the position nights, back to front so earlier offsets stay valid
  //    against the original match-round numbering.
  const offsets = positionNightOffsets(positionNights, planned.length);
  for (let i = offsets.length - 1; i >= 0; i--) {
    const offset = offsets[i];
    planned.splice(offset, 0, {
      // Attribute it to the half whose play it follows.
      half: planned[offset - 1].half,
      matches: generatePositionNightMatches(teamIds, teams),
    });
  }

  // 3. Lay the weeks onto play dates in order.
  const weeks: ScheduleWeek[] = [];
  let currentDate = new Date(startDate + 'T12:00:00');
  planned.forEach((plan, index) => {
    if (index > 0) {
      currentDate = getNextPlayDate(currentDate, playDays, frequency, false);
    }
    weeks.push({
      week: index + 1,
      date: formatDate(currentDate),
      half: plan.half,
      matches: plan.matches,
    });
  });

  return weeks;
}
