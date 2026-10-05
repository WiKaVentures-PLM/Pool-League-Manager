import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getTierLimits, type Tier } from '../src/lib/subscription/features';

/**
 * Plan identity is duplicated across six places that cannot import each other:
 * two React pages, two Deno edge functions, a SQL CHECK constraint and the
 * TypeScript tier table. Nothing enforced agreement, and the result was the
 * marketing site advertising $19/$39 while checkout charged $5/$10/$20, and
 * selling SMS on a tier where it was switched off in code.
 *
 * So these tests read the real sources and assert they still line up. Parsing
 * source text is unusual, but the alternative is no guard at all on the one
 * thing that directly affects what customers are charged and given.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const marketingPricing = read('src/app/(marketing)/pricing/page.tsx');
const marketingHome = read('src/app/(marketing)/page.tsx');
const billingSection = read('src/app/(app)/settings/billing-section.tsx');
const checkoutFn = read('supabase/functions/create-checkout-session/index.ts');
const webhookFn = read('supabase/functions/stripe-webhook/index.ts');
const smsProcessor = read('supabase/functions/process-sms-score/index.ts');
const baseMigration = read('supabase/migrations/00002_create_tables.sql');

function matchAll(source: string, re: RegExp): string[] {
  return [...source.matchAll(re)].map(m => m[1]);
}

// --- what each surface claims -------------------------------------------------

/** Marketing plan names and headline monthly prices, e.g. Basic -> 5. */
const marketingPlans = (() => {
  const blocks = marketingPricing.split(/\n  \{\n/).slice(1);
  const out: Record<string, number> = {};
  for (const b of blocks) {
    const name = b.match(/name: '([^']+)'/)?.[1];
    const price = b.match(/price: '\$(\d+)'/)?.[1];
    if (name && price) out[name.toLowerCase()] = Number(price);
  }
  return out;
})();

/** In-app plans: the ones that actually create a Stripe checkout. */
const billingPlans = (() => {
  const blocks = billingSection.split(/\n  \{\n/).slice(1);
  const out: Record<string, { monthly: number; annual: number }> = {};
  for (const b of blocks) {
    const id = b.match(/id: '([^']+)'/)?.[1];
    const monthly = b.match(/monthlyPrice: (\d+)/)?.[1];
    const annual = b.match(/annualPrice: (\d+)/)?.[1];
    if (id && monthly && annual) {
      out[id] = { monthly: Number(monthly), annual: Number(annual) };
    }
  }
  return out;
})();

const checkoutPlanIds = matchAll(checkoutFn, /^\s{2}(\w+): \{$/gm);
const webhookTiers = [...new Set(matchAll(webhookFn, /'price_\w+': '(\w+)'/g))];
const webhookFallbackTier = webhookFn.match(/TIER_FROM_PRICE\[priceId\] \|\| '(\w+)'/)?.[1];
const dbAllowedTiers = (
  baseMigration.match(/CHECK \(subscription_tier IN \(([^)]+)\)\)/)?.[1] ?? ''
)
  .split(',')
  .map(s => s.trim().replace(/'/g, ''));
const smsTiers = (smsProcessor.match(/SMS_TIERS = \[([^\]]*)\]/)?.[1] ?? '')
  .split(',')
  .map(s => s.trim().replace(/'/g, ''))
  .filter(Boolean);

// --- the assertions -----------------------------------------------------------

describe('plan identity', () => {
  it('parsed every surface (guards against a silently broken regex)', () => {
    expect(Object.keys(marketingPlans).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(billingPlans).length).toBeGreaterThanOrEqual(3);
    expect(checkoutPlanIds.length).toBeGreaterThanOrEqual(3);
    expect(webhookTiers.length).toBeGreaterThanOrEqual(3);
    expect(dbAllowedTiers.length).toBeGreaterThanOrEqual(3);
    expect(smsTiers.length).toBeGreaterThanOrEqual(1);
  });

  it('the in-app plans are exactly the ones checkout can create', () => {
    expect(Object.keys(billingPlans).sort()).toEqual([...checkoutPlanIds].sort());
  });

  it('every tier the Stripe webhook writes is storable in the database', () => {
    for (const tier of webhookTiers) {
      expect(dbAllowedTiers).toContain(tier);
    }
    expect(dbAllowedTiers).toContain(webhookFallbackTier);
  });

  it('every tier the webhook writes has entitlements defined', () => {
    for (const tier of webhookTiers) {
      expect(getTierLimits(tier)).not.toBe(getTierLimits('nonexistent-tier-sentinel'));
    }
  });
});

describe('prices agree across marketing and checkout', () => {
  it('each paid plan costs the same on the marketing page as in the app', () => {
    // This is the exact failure that shipped: /pricing said $19 and $39 while
    // checkout charged $5, $10 and $20.
    for (const [id, { monthly }] of Object.entries(billingPlans)) {
      expect(
        marketingPlans[id],
        `marketing page is missing a "${id}" plan, or prices it differently`,
      ).toBe(monthly);
    }
  });

  it('the homepage teaser only quotes prices that really exist', () => {
    const teased = matchAll(marketingHome, /text-slate-800">\$(\d+)</g).map(Number);
    const real = [0, ...Object.values(billingPlans).map(p => p.monthly)];
    for (const price of teased) {
      expect(real, `homepage teases $${price}, which no plan charges`).toContain(price);
    }
  });

  it('annual billing is a discount, not a surcharge', () => {
    for (const [id, { monthly, annual }] of Object.entries(billingPlans)) {
      expect(annual, `${id} annual is not cheaper than 12x monthly`).toBeLessThan(monthly * 12);
    }
  });
});

describe('SMS entitlement is consistent end to end', () => {
  it('the processor allows exactly the tiers whose limits enable SMS', () => {
    // process-sms-score cannot import features.ts (different runtime), so the
    // two lists have to be kept in step by hand. This catches the drift.
    const entitled = (['trial', 'free', 'basic', 'pro', 'premium'] as Tier[]).filter(
      t => getTierLimits(t).hasSmsSubmission,
    );
    expect([...smsTiers].sort()).toEqual([...entitled].sort());
  });

  it('no paid plan advertises SMS on the marketing site', () => {
    expect(marketingPricing).not.toMatch(/\bSMS\b/);
    expect(marketingPricing).not.toMatch(/\bMMS\b/);
  });
});

describe('marketing honesty', () => {
  it('makes no unearned social-proof claims', () => {
    // Fabricated testimonials and a "Used by leagues across the Midwest" line
    // shipped once. Keep them out.
    const banned = [
      /used by leagues/i,
      /already using/i,
      /most popular/i,
      /\btrusted by\b/i,
      /\bthousands\b/i,
      /League Director/i,
      /Bar League Organizer/i,
    ];
    for (const pattern of banned) {
      expect(marketingHome, `homepage matches ${pattern}`).not.toMatch(pattern);
      expect(marketingPricing, `pricing page matches ${pattern}`).not.toMatch(pattern);
    }
  });
});
