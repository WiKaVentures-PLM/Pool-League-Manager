import { describe, expect, it } from 'vitest';
import {
  generateSchedule,
  positionNightOffsets,
  type ScheduleTeam,
  type ScheduleWeek,
} from './round-robin';

function teams(n: number): ScheduleTeam[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
    venue: null,
  }));
}

const BYE_ID = 'BYE';

/**
 * Whole days between two YYYY-MM-DD strings, immune to daylight saving.
 * Comparing raw getTime() differences gives 7.04 days across a DST boundary.
 */
function calendarDaysBetween(a: string, b: string): number {
  const toUtc = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  return (toUtc(b) - toUtc(a)) / 86_400_000;
}

function matchWeeks(weeks: ScheduleWeek[]) {
  return weeks.filter(w => !w.matches.some(m => m.isPositionNight));
}

function positionWeekNumbers(weeks: ScheduleWeek[]) {
  return weeks.filter(w => w.matches.some(m => m.isPositionNight)).map(w => w.week);
}

describe('positionNightOffsets', () => {
  // The spec: position nights are a season TOTAL, spread evenly, with the last
  // one always closing the season. Asking for 2 used to silently produce 4.
  it('1 night lands at the end of the season', () => {
    expect(positionNightOffsets(1, 14)).toEqual([14]);
  });

  it('2 nights land at the middle and the end', () => {
    expect(positionNightOffsets(2, 14)).toEqual([7, 14]);
  });

  it('3 nights land on thirds and the end', () => {
    expect(positionNightOffsets(3, 14)).toEqual([5, 9, 14]);
  });

  it('always closes the season regardless of count', () => {
    for (const n of [1, 2, 3, 4, 5, 7, 14]) {
      const offsets = positionNightOffsets(n, 14);
      expect(offsets).toHaveLength(n);
      expect(offsets.at(-1)).toBe(14);
    }
  });

  it('returns nothing when none are requested or there are no rounds', () => {
    expect(positionNightOffsets(0, 14)).toEqual([]);
    expect(positionNightOffsets(2, 0)).toEqual([]);
    expect(positionNightOffsets(-1, 14)).toEqual([]);
  });

  it('never points before the first round or past the last', () => {
    // More position nights than match rounds is degenerate but must not
    // produce an out-of-range insertion point.
    for (const offset of positionNightOffsets(9, 7)) {
      expect(offset).toBeGreaterThanOrEqual(1);
      expect(offset).toBeLessThanOrEqual(7);
    }
  });
});

describe('generateSchedule', () => {
  const config = {
    startDate: '2026-10-06', // a Tuesday
    playDays: [2], // Tuesday
    frequency: 'weekly' as const,
    timesToPlay: 2,
    positionNights: 2,
  };

  it('returns nothing without at least two teams or a play day', () => {
    expect(generateSchedule({ ...config, teams: teams(1) })).toEqual([]);
    expect(generateSchedule({ ...config, teams: teams(8), playDays: [] })).toEqual([]);
  });

  describe('8 teams, double round robin, 2 position nights', () => {
    const weeks = generateSchedule({ ...config, teams: teams(8) });

    it('produces 14 match weeks plus the 2 position nights', () => {
      expect(weeks).toHaveLength(16);
      expect(matchWeeks(weeks)).toHaveLength(14);
      expect(positionWeekNumbers(weeks)).toEqual([8, 16]);
    });

    it('numbers weeks consecutively from 1', () => {
      expect(weeks.map(w => w.week)).toEqual(
        Array.from({ length: 16 }, (_, i) => i + 1),
      );
    });

    it('plays every pairing exactly twice', () => {
      const pairs = new Map<string, number>();
      for (const week of matchWeeks(weeks)) {
        for (const m of week.matches) {
          const key = [m.homeTeamId, m.awayTeamId].sort().join('|');
          pairs.set(key, (pairs.get(key) ?? 0) + 1);
        }
      }
      expect(pairs.size).toBe(28); // 8 choose 2
      expect([...pairs.values()].every(c => c === 2)).toBe(true);
    });

    it('gives every team an equal split of home and away', () => {
      const home = new Map<string, number>();
      const away = new Map<string, number>();
      for (const week of matchWeeks(weeks)) {
        for (const m of week.matches) {
          home.set(m.homeTeamId, (home.get(m.homeTeamId) ?? 0) + 1);
          away.set(m.awayTeamId, (away.get(m.awayTeamId) ?? 0) + 1);
        }
      }
      for (const t of teams(8)) {
        expect(home.get(t.id)).toBe(7);
        expect(away.get(t.id)).toBe(7);
      }
    });

    it('never schedules a team twice in the same week, or against itself', () => {
      for (const week of matchWeeks(weeks)) {
        const seen = new Set<string>();
        for (const m of week.matches) {
          expect(m.homeTeamId).not.toBe(m.awayTeamId);
          expect(seen.has(m.homeTeamId)).toBe(false);
          expect(seen.has(m.awayTeamId)).toBe(false);
          seen.add(m.homeTeamId);
          seen.add(m.awayTeamId);
        }
      }
    });

    it('puts every week on the configured play day', () => {
      for (const week of weeks) {
        // Parse at midday to dodge timezone rollover.
        expect(new Date(`${week.date}T12:00:00`).getDay()).toBe(2);
      }
    });

    it('advances one week at a time and never repeats a date', () => {
      const dates = weeks.map(w => w.date);
      expect(new Set(dates).size).toBe(dates.length);
      for (let i = 1; i < dates.length; i++) {
        expect(calendarDaysBetween(dates[i - 1], dates[i])).toBe(7);
      }
    });

    it('stays on the play day across a DST transition', () => {
      // This season runs Oct 2026 -> Jan 2027, crossing the end of US daylight
      // saving on Nov 1. generateSchedule anchors dates at midday so the week
      // does not drift an hour and slip onto a Monday or Wednesday.
      const novemberWeeks = weeks.filter(w => w.date.startsWith('2026-11'));
      expect(novemberWeeks.length).toBeGreaterThan(0);
      for (const week of novemberWeeks) {
        expect(new Date(`${week.date}T12:00:00`).getDay()).toBe(2);
      }
    });

    it('starts on the requested date', () => {
      expect(weeks[0].date).toBe('2026-10-06');
    });

    it('produces no byes for an even team count', () => {
      expect(weeks.flatMap(w => w.matches).some(m => m.isBye)).toBe(false);
    });
  });

  describe('odd team count', () => {
    const weeks = generateSchedule({ ...config, teams: teams(7) });

    it('gives each team exactly one bye per half', () => {
      const byes = new Map<string, number>();
      for (const week of matchWeeks(weeks)) {
        for (const m of week.matches.filter(x => x.isBye)) {
          byes.set(m.homeTeamId, (byes.get(m.homeTeamId) ?? 0) + 1);
        }
      }
      expect(byes.size).toBe(7);
      expect([...byes.values()].every(c => c === 2)).toBe(true);
    });

    it('never leaves the BYE placeholder as a real home team', () => {
      for (const week of weeks) {
        for (const m of week.matches) {
          expect(m.homeTeamId).not.toBe(BYE_ID);
        }
      }
    });
  });

  describe('position night counts follow the setting', () => {
    it.each([0, 1, 2, 3, 4])('positionNights=%i yields that many', n => {
      const weeks = generateSchedule({ ...config, teams: teams(8), positionNights: n });
      expect(positionWeekNumbers(weeks)).toHaveLength(n);
      expect(weeks).toHaveLength(14 + n);
      if (n > 0) {
        // The last week of the season is always a position night.
        expect(positionWeekNumbers(weeks).at(-1)).toBe(weeks.length);
      }
    });
  });

  it('single round robin halves the match weeks', () => {
    const weeks = generateSchedule({
      ...config,
      teams: teams(8),
      timesToPlay: 1,
      positionNights: 1,
    });
    expect(matchWeeks(weeks)).toHaveLength(7);
    expect(positionWeekNumbers(weeks)).toEqual([8]);
  });

  it('biweekly frequency spaces weeks 14 days apart', () => {
    const weeks = generateSchedule({
      ...config,
      teams: teams(4),
      frequency: 'biweekly',
      positionNights: 0,
    });
    expect(calendarDaysBetween(weeks[0].date, weeks[1].date)).toBe(14);
  });
});
