import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pool League Manager — Free League Scheduling & Score Tracking Software',
  description:
    'Free pool league management software for bar and tavern leagues. Auto-generate round-robin schedules, track scores from your phone, and manage standings in real time. Replace your spreadsheets today.',
  alternates: { canonical: '/' },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎱</span>
            <span className="text-xl font-black text-slate-800">Pool League Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-slate-600 hover:text-slate-800 font-medium hidden sm:block">
              Pricing
            </Link>
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 pt-32 pb-24 px-4">
        <div className="max-w-5xl mx-auto text-center text-white">
          <div className="inline-block mb-4 px-4 py-1.5 bg-yellow-400/20 border border-yellow-400/40 rounded-full text-yellow-300 text-sm font-semibold">
            Free forever for small leagues — no credit card required
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Stop Managing Your Pool League{' '}
            <span className="text-yellow-300">With Spreadsheets</span>
          </h1>
          <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
            Auto-generate round-robin schedules, let captains submit scores from their phones,
            and watch standings update in real time. Built for bar and tavern pool leagues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-yellow-400 text-slate-900 font-black rounded-xl text-lg hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/30"
            >
              Create Your League — Free
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              See Pricing
            </Link>
          </div>
          <p className="mt-5 text-emerald-300 text-sm">
            Set up in under 2 minutes · Built in Iowa for bar pool leagues
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-8 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-500 text-sm font-medium">
            Trusted by league organizers managing teams across the Midwest and beyond
          </p>
        </div>
      </section>

      {/* App mockup / screenshot */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 ml-4 bg-white rounded px-3 py-1 text-xs text-slate-400 max-w-xs">
                pool-league-manager.com/standings
              </div>
            </div>
            <div className="flex min-h-80">
              <div className="hidden md:flex w-52 bg-slate-900 flex-col p-4 gap-1">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <span className="text-xl">🎱</span>
                  <span className="text-white font-bold text-sm">My League</span>
                </div>
                {['Dashboard', 'Schedule', 'Standings', 'Teams', 'Players', 'Score Entry'].map((item, i) => (
                  <div
                    key={item}
                    className={`px-3 py-2 rounded-lg text-xs font-medium ${
                      i === 2 ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 p-6 bg-slate-50">
                <div className="text-base font-black text-slate-800 mb-4">
                  Standings — Spring 2025
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-5 text-xs font-bold text-slate-500 px-4 py-2 border-b border-slate-100 bg-slate-50">
                    <span>#</span><span className="col-span-2">Team</span><span className="text-right">W</span><span className="text-right">Win%</span>
                  </div>
                  {[
                    ['1', "Rack 'Em Up", '12', '80.0%', true],
                    ['2', 'Eight Is Enough', '10', '66.7%', false],
                    ['3', 'Scratch That', '9', '60.0%', false],
                    ['4', 'Break & Run', '7', '46.7%', false],
                    ['5', 'The Chalk Dusters', '5', '33.3%', false],
                  ].map(([rank, name, wins, pct, highlight]) => (
                    <div
                      key={name as string}
                      className={`grid grid-cols-5 px-4 py-2.5 text-sm border-b border-slate-50 last:border-0 ${
                        highlight ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <span className="font-bold text-slate-500">{rank}</span>
                      <span className="col-span-2 font-medium text-slate-700">{name}</span>
                      <span className="text-right text-slate-600">{wins}</span>
                      <span className={`text-right font-semibold ${highlight ? 'text-emerald-600' : 'text-slate-600'}`}>{pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">Live standings update automatically as scores are submitted</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-800 text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-slate-500 mb-14">Three steps — up and running in minutes, no training required.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: '⚙️',
                title: 'Set Up Your League',
                desc: 'Add your teams, enter venues, and let our schedule generator build your entire round-robin season in one click. Handles byes, halves, and position nights automatically.',
              },
              {
                step: '2',
                icon: '📱',
                title: 'Captains Submit Scores',
                desc: 'After each match night, both captains submit scores from their phones. Dual-submission catches errors automatically — no more chasing down paper scoresheets.',
              },
              {
                step: '3',
                icon: '📊',
                title: 'Standings Update Instantly',
                desc: 'No spreadsheet math. Team rankings, win percentages, and player stats update the moment a match is approved. Everyone can check standings anytime.',
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white text-xl font-black flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors inline-block"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-800 text-center mb-4">
            Everything Your League Needs
          </h2>
          <p className="text-center text-slate-500 mb-12">
            Built specifically for bar and tavern pool leagues — not a generic sports platform.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📅', title: 'Auto Schedule Generation', desc: 'Round-robin schedules with one click. Handles byes, venues, position nights, and halves automatically.' },
              { icon: '📊', title: 'Live Standings & Rankings', desc: 'Real-time team and player stats. Win percentages and automatic rankings update every time a score is submitted.' },
              { icon: '📱', title: 'Phone-Based Score Entry', desc: 'Captains submit scores from their phone in under a minute. Dual-submission verifies accuracy — mismatches get flagged.' },
              { icon: '👥', title: 'Team & Player Management', desc: 'Manage rosters, assign captains, and track individual player stats across the entire season.' },
              { icon: '🏆', title: 'Position Nights & Playoffs', desc: 'Automatic playoff matchups calculated from standings. Position night brackets generated in one click.' },
              { icon: '📷', title: 'Photo Scoresheet Scanning', desc: 'Snap a photo of your paper scoresheet and AI-powered OCR reads the scores for you. Keep your tradition, lose the data entry.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why organizers switch */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-800 text-center mb-12">
            Why Organizers Switch to Pool League Manager
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                before: 'Hours in Excel building schedules',
                after: 'One-click round-robin generation',
              },
              {
                before: 'Chasing captains for paper scoresheets',
                after: 'Scores submitted from their phones',
              },
              {
                before: 'Tuesday nights doing data entry',
                after: 'Standings update automatically',
              },
              {
                before: '"When are standings coming out?" texts',
                after: 'Players check standings themselves',
              },
            ].map(({ before, after }) => (
              <div key={before} className="flex gap-4 items-start">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm font-bold">✗</div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">✓</div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm line-through mb-1">{before}</p>
                  <p className="text-slate-800 font-semibold">{after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black text-slate-800 mb-3">Simple, Transparent Pricing</h2>
          <p className="text-slate-500 mb-8">
            Start completely free. Small league? Stay free forever. Need more teams,
            player stats, or multiple leagues? Affordable plans start at $5/month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800">$0</span>
              <span className="text-slate-500">free forever</span>
            </div>
            <span className="text-slate-300 hidden sm:block">|</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800">$5</span>
              <span className="text-slate-500">/mo Basic</span>
            </div>
            <span className="text-slate-300 hidden sm:block">|</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800">$10</span>
              <span className="text-slate-500">/mo Pro</span>
            </div>
            <span className="text-slate-300 hidden sm:block">|</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800">$20</span>
              <span className="text-slate-500">/mo Premium</span>
            </div>
          </div>
          <Link
            href="/pricing"
            className="mt-8 inline-block px-6 py-3 border-2 border-emerald-600 text-emerald-600 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-colors"
          >
            View Full Pricing →
          </Link>
        </div>
      </section>

      {/* Learn more / SEO links */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
            Resources for League Organizers
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { href: '/how-to-run-a-pool-league', title: 'How to Run a Pool League', desc: 'Complete guide for bar owners and organizers — from recruiting teams to managing playoffs.' },
              { href: '/pool-league-scheduling', title: 'Pool League Scheduling Guide', desc: 'Round-robin formats, position nights, bye weeks, and why spreadsheets fail at scheduling.' },
              { href: '/pool-league-score-tracking', title: 'Score Tracking: Paper to Digital', desc: 'How to move from paper scoresheets to phone-based digital submission with real-time standings.' },
              { href: '/apa-league-alternative', title: 'APA Alternative for Independent Leagues', desc: 'How Pool League Manager compares to APA software — and why independent leagues choose PLM.' },
            ].map(({ href, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="block p-5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 mb-1">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-black mb-4">Ready to ditch the spreadsheet?</h2>
          <p className="text-emerald-100 text-lg mb-8">
            Set up your league in under 2 minutes. Free forever for small leagues.
          </p>
          <Link
            href="/signup"
            className="px-10 py-4 bg-yellow-400 text-slate-900 font-black rounded-xl text-xl hover:bg-yellow-300 transition-colors inline-block shadow-lg"
          >
            Start Free Now
          </Link>
          <p className="mt-5 text-emerald-200 text-sm">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span>🎱</span>
                <span className="font-bold text-slate-300">Pool League Manager</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs">
                Free pool league management software. Auto schedules, phone score entry, live standings.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
              <Link href="/pricing" className="hover:text-slate-200 transition-colors">Pricing</Link>
              <Link href="/how-to-run-a-pool-league" className="hover:text-slate-200 transition-colors">How to Run a League</Link>
              <Link href="/login" className="hover:text-slate-200 transition-colors">Sign In</Link>
              <Link href="/pool-league-scheduling" className="hover:text-slate-200 transition-colors">Scheduling Guide</Link>
              <Link href="/signup" className="hover:text-slate-200 transition-colors">Sign Up</Link>
              <Link href="/pool-league-score-tracking" className="hover:text-slate-200 transition-colors">Score Tracking</Link>
              <Link href="/privacy" className="hover:text-slate-200 transition-colors">Privacy</Link>
              <Link href="/apa-league-alternative" className="hover:text-slate-200 transition-colors">APA Alternative</Link>
              <Link href="/terms" className="hover:text-slate-200 transition-colors">Terms</Link>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-sm text-slate-600 text-center">
            © {new Date().getFullYear()} Pool League Manager. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
