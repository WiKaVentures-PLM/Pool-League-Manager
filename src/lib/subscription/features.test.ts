import { describe, expect, it } from 'vitest';
import {
  canAddTeam,
  effectiveTier,
  getTierLimits,
  hasFeature,
  isTrialExpired,
  type Tier,
} from './features';

const DAY = 86_400_000;
const future = new Date(Date.now() + 7 * DAY).toISOString();
const past = new Date(Date.now() - 7 * DAY).toISOString();

describe('effectiveTier', () => {
  it('keeps a trial that has not run out', () => {
    expect(
      effectiveTier({
        subscription_tier: 'trial',
        subscription_status: 'trialing',
        trial_ends_at: future,
      }),
    ).toBe('trial');
  });

  it('drops an expired trial to free', () => {
    // The whole point: nothing ever expired trials, so every signup kept full
    // features forever and nobody had a reason to subscribe.
    expect(
      effectiveTier({
        subscription_tier: 'trial',
        subscription_status: 'trialing',
        trial_ends_at: past,
      }),
    ).toBe('free');
  });

  it('leaves paid tiers alone even with a stale trial_ends_at', () => {
    for (const tier of ['basic', 'pro', 'premium'] as Tier[]) {
      expect(
        effectiveTier({
          subscription_tier: tier,
          subscription_status: 'active',
          trial_ends_at: past,
        }),
      ).toBe(tier);
    }
  });

  it('does not expire a trial row that has already moved off trialing', () => {
    // e.g. a cancelled subscription reset to tier 'trial' by the Stripe
    // webhook. Read-only handling owns that case, not trial expiry.
    expect(
      effectiveTier({
        subscription_tier: 'trial',
        subscription_status: 'canceled',
        trial_ends_at: past,
      }),
    ).toBe('trial');
  });

  it('defaults to trial when there is nothing to go on', () => {
    expect(effectiveTier(null)).toBe('trial');
    expect(effectiveTier(undefined)).toBe('trial');
    expect(effectiveTier({})).toBe('trial');
    expect(
      effectiveTier({ subscription_tier: 'trial', subscription_status: 'trialing' }),
    ).toBe('trial');
  });
});

describe('isTrialExpired', () => {
  it('is true only for a trial that has lapsed', () => {
    expect(
      isTrialExpired({
        subscription_tier: 'trial',
        subscription_status: 'trialing',
        trial_ends_at: past,
      }),
    ).toBe(true);
    expect(
      isTrialExpired({
        subscription_tier: 'trial',
        subscription_status: 'trialing',
        trial_ends_at: future,
      }),
    ).toBe(false);
    expect(
      isTrialExpired({
        subscription_tier: 'basic',
        subscription_status: 'active',
        trial_ends_at: past,
      }),
    ).toBe(false);
  });
});

describe('tier ladder', () => {
  // Each paid tier must be strictly better than the one below it, or there is
  // no reason to pay for it. Both of these were broken: free and basic were
  // identical, and premium was byte-for-byte identical to pro.
  const ladder: Tier[] = ['free', 'basic', 'pro', 'premium'];

  it('never decreases team allowance as price rises', () => {
    const counts = ladder.map(t => getTierLimits(t).maxTeams);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
  });

  it('never decreases history allowance as price rises', () => {
    // -1 means unlimited, so normalise it to Infinity before comparing.
    const norm = (n: number) => (n === -1 ? Infinity : n);
    const history = ladder.map(t => norm(getTierLimits(t).maxSeasonsHistory));
    for (let i = 1; i < history.length; i++) {
      expect(history[i]).toBeGreaterThanOrEqual(history[i - 1]);
    }
  });

  it('gives every paid tier something the one below it lacks', () => {
    const score = (t: Tier) => {
      const l = getTierLimits(t);
      const flags = [
        l.hasPlayerStats,
        l.hasPhotoUpload,
        l.hasHallOfFame,
        l.hasHeadToHead,
        l.hasOcrScanning,
        l.hasCustomBranding,
      ].filter(Boolean).length;
      const teams = l.maxTeams === Infinity ? 1000 : l.maxTeams;
      const history = l.maxSeasonsHistory === -1 ? 1000 : l.maxSeasonsHistory;
      return flags + teams + history;
    };
    for (let i = 1; i < ladder.length; i++) {
      expect(score(ladder[i])).toBeGreaterThan(score(ladder[i - 1]));
    }
  });

  it('keeps free strictly weaker than basic on team count', () => {
    expect(getTierLimits('free').maxTeams).toBeLessThan(getTierLimits('basic').maxTeams);
  });

  it('only lets premium run multiple leagues', () => {
    expect(getTierLimits('premium').maxLeagues).toBe(-1);
    for (const tier of ['free', 'basic', 'pro'] as Tier[]) {
      expect(getTierLimits(tier).maxLeagues).toBe(1);
    }
  });
});

describe('SMS entitlement', () => {
  it('is off on every tier that can be purchased', () => {
    // SMS is deliberately not sold: outbound needs A2P approval and costs per
    // message. If this starts failing, someone re-enabled it on a paid plan
    // without updating the marketing or SMS_TIERS in process-sms-score.
    for (const tier of ['free', 'basic', 'pro', 'premium'] as Tier[]) {
      expect(hasFeature(tier, 'hasSmsSubmission')).toBe(false);
      expect(hasFeature(tier, 'hasMmsSubmission')).toBe(false);
    }
  });

  it('stays on for trial so it remains testable in-house', () => {
    expect(hasFeature('trial', 'hasSmsSubmission')).toBe(true);
  });
});

describe('canAddTeam', () => {
  it('enforces the limit of the tier', () => {
    expect(canAddTeam('free', 4)).toBe(true);
    expect(canAddTeam('free', 5)).toBe(false);
    expect(canAddTeam('basic', 9)).toBe(true);
    expect(canAddTeam('basic', 10)).toBe(false);
    expect(canAddTeam('premium', 10_000)).toBe(true);
  });

  it('uses the trial allowance for an unknown tier rather than locking users out', () => {
    expect(canAddTeam(undefined, 50)).toBe(true);
    expect(canAddTeam('nonsense-tier', 50)).toBe(true);
  });
});

describe('tier list integrity', () => {
  it('only contains tiers the database can store, plus the derived free tier', () => {
    // organizations.subscription_tier CHECK allows trial/basic/pro/premium.
    // 'free' is derived at read time and never written. A 'starter' tier sat in
    // this union for months while being impossible to store.
    const storable = ['trial', 'basic', 'pro', 'premium'];
    const derived = ['free'];
    for (const tier of [...storable, ...derived] as Tier[]) {
      expect(getTierLimits(tier)).toBeDefined();
    }
    expect(getTierLimits('starter')).toBe(getTierLimits('trial'));
  });
});
