import Link from 'next/link';
import { Check, X } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for small leagues just getting started.',
    cta: 'Get Started',
    ctaHref: '/signup',
    highlight: false,
    features: [
      { label: '1 league', included: true },
      { label: 'Up to 10 teams', included: true },
      { label: 'Web score entry', included: true },
      { label: 'Auto schedule generation', included: true },
      { label: 'Live standings', included: true },
      { label: 'Player stats', included: false },
      { label: 'SMS score submission', included: false },
      { label: 'MMS photo submission', included: false },
      { label: 'Season history', included: false },
      { label: 'Custom branding', included: false },
    ],
  },
  {
    name: 'Starter',
    price: '$19',
    period: '/month',
    description: 'For growing leagues that need SMS and unlimited teams.',
    cta: 'Start Free Trial',
    ctaHref: '/signup',
    highlight: true,
    badge: 'Most Popular',
    features: [
      { label: '1 league', included: true },
      { label: 'Unlimited teams', included: true },
      { label: 'Web score entry', included: true },
      { label: 'Auto schedule generation', included: true },
      { label: 'Live standings', included: true },
      { label: 'Player stats', included: true },
      { label: 'SMS score submission', included: true },
      { label: 'MMS photo submission', included: false },
      { label: '3 years season history', included: true },
      { label: 'Custom branding', included: false },
      { label: 'Priority support', included: true },
    ],
  },
  {
    name: 'Pro',
    price: '$39',
    period: '/month',
    description: 'Run multiple leagues with full photo submission and branding.',
    cta: 'Start Free Trial',
    ctaHref: '/signup',
    highlight: false,
    features: [
      { label: 'Multiple leagues', included: true },
      { label: 'Unlimited teams', included: true },
      { label: 'Web score entry', included: true },
      { label: 'Auto schedule generation', included: true },
      { label: 'Live standings', included: true },
      { label: 'Player stats + Head-to-Head', included: true },
      { label: 'SMS score submission', included: true },
      { label: 'MMS photo submission', included: true },
      { label: 'Unlimited season history', included: true },
      { label: 'Custom branding', included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎱</span>
            <span className="text-lg font-black text-white">Pool League Manager</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-400 hover:text-white font-medium transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-12 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Start free. Upgrade when you need SMS submission or more leagues. No hidden fees.
        </p>
      </section>

      {/* Plans */}
      <section className="pb-24 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border ${
                plan.highlight
                  ? 'border-emerald-500 bg-emerald-950/50 shadow-lg shadow-emerald-900/30'
                  : 'border-slate-700 bg-slate-800/50'
              } p-8`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm">
                    {f.included ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className={f.included ? 'text-slate-200' : 'text-slate-500'}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-3 rounded-xl font-bold transition-colors ${
                  plan.highlight
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-500 mt-8 text-sm">
          All plans include a 14-day free trial with full features. No credit card required.
        </p>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-800 py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I switch plans later?',
                a: 'Yes. You can upgrade or downgrade at any time from your league settings. Changes take effect immediately.',
              },
              {
                q: 'What counts as a "league"?',
                a: 'Each pool league you organize is one league. A single bar or venue usually has one league. The Pro plan is for operators running multiple independent leagues.',
              },
              {
                q: 'How does SMS score submission work?',
                a: 'On Starter and Pro, captains can text a photo of the scoresheet to a dedicated number. We parse the scores automatically using AI and queue them for approval.',
              },
              {
                q: 'What happens after the trial?',
                a: 'After 14 days your league moves to the Free plan automatically. No surprise charges. Upgrade whenever you need more features.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-slate-800 pb-6">
                <h3 className="font-bold text-white mb-2">{q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-black mb-4">Ready to ditch the spreadsheet?</h2>
        <p className="text-slate-400 mb-8">Set up your league in under a minute.</p>
        <Link
          href="/signup"
          className="px-8 py-4 bg-emerald-500 text-white font-black rounded-xl text-lg hover:bg-emerald-400 transition-colors inline-block"
        >
          Start Free Trial
        </Link>
      </section>

      <footer className="border-t border-slate-800 py-8 px-4 text-center text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} Pool League Manager. All rights reserved.{' '}
        <Link href="/" className="hover:text-slate-400 transition-colors">
          Back to home
        </Link>
      </footer>
    </div>
  );
}
