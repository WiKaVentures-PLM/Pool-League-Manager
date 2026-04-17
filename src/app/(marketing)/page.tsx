import Link from 'next/link';

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
            Free to start — no credit card required
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Manage Your Pool League{' '}
            <span className="text-yellow-300">Like a Pro</span>
          </h1>
          <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
            Stop juggling spreadsheets. Auto-generate schedules, track standings in real time,
            and let captains submit scores from their phones — all for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-yellow-400 text-slate-900 font-black rounded-xl text-lg hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/30"
            >
              Start Free — Takes 2 Minutes
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              See Pricing
            </Link>
          </div>
          <p className="mt-5 text-emerald-300 text-sm">
            Used by leagues across the Midwest
          </p>
        </div>
      </section>

      {/* App mockup / screenshot */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Fake browser chrome */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 ml-4 bg-white rounded px-3 py-1 text-xs text-slate-400 max-w-xs">
                pool-league-manager.com/standings
              </div>
            </div>
            {/* Fake dashboard content */}
            <div className="flex min-h-80">
              {/* Sidebar mock */}
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

              {/* Main content mock */}
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
            Up and running in minutes
          </h2>
          <p className="text-center text-slate-500 mb-14">Three simple steps — no training required.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: '⚙️',
                title: 'Set Up Your League',
                desc: 'Add your teams, enter venues, and let our schedule generator build your entire season in one click.',
              },
              {
                step: '2',
                icon: '📱',
                title: 'Captains Submit Scores',
                desc: 'After each match night, captains submit their score from their phone. Both sides submit — scores are auto-verified.',
              },
              {
                step: '3',
                icon: '📊',
                title: 'Standings Update Automatically',
                desc: 'No spreadsheet math. Standings, win percentages, and player stats update the moment a match is approved.',
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
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-800 text-center mb-12">
            Everything your league needs
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📅', title: 'Auto Schedule Generation', desc: 'Round-robin schedules with one click. Handles byes, venues, position nights, and halves automatically.' },
              { icon: '📊', title: 'Live Standings', desc: 'Real-time team and player stats. Win percentages and automatic rankings every week.' },
              { icon: '📱', title: 'Easy Score Entry', desc: 'Captains submit from their phone. Dual-submission verifies accuracy — mismatches get flagged for you.' },
              { icon: '👥', title: 'Team & Player Management', desc: 'Manage rosters, assign captains, and track individual player stats per season.' },
              { icon: '🏆', title: 'Position Nights', desc: 'Automatic playoff matchups based on standings — calculated and scheduled for you.' },
              { icon: '📜', title: 'Season History', desc: 'Full records of every past season. Switch between them easily from the header.' },
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

      {/* Social proof */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-8 px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 font-semibold">
            Join leagues already using Pool League Manager
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            {[
              {
                quote: "We went from emailing spreadsheets every week to just pointing everyone at the website. Game changer.",
                author: 'Mark T.',
                role: 'League Director, Iowa City',
              },
              {
                quote: "The schedule generator alone saved me hours. It used to take me half a day to build the bracket for 12 teams.",
                author: 'Sandra K.',
                role: 'Bar League Organizer',
              },
            ].map(({ quote, author, role }) => (
              <div key={author} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-slate-600 italic mb-4">&ldquo;{quote}&rdquo;</p>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{author}</div>
                  <div className="text-slate-400 text-xs">{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black text-slate-800 mb-3">Pricing that makes sense</h2>
          <p className="text-slate-500 mb-8">
            Start completely free. Small league? Stay free forever. Need SMS submission or multiple leagues? Affordable upgrades are ready when you are.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800">$0</span>
              <span className="text-slate-500">to start</span>
            </div>
            <span className="text-slate-300 hidden sm:block">|</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800">$19</span>
              <span className="text-slate-500">/mo for SMS</span>
            </div>
            <span className="text-slate-300 hidden sm:block">|</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800">$39</span>
              <span className="text-slate-500">/mo for Pro</span>
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

      {/* Final CTA */}
      <section className="py-20 px-4 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-black mb-4">Ready to ditch the spreadsheet?</h2>
          <p className="text-emerald-100 text-lg mb-8">
            Set up your league in under 2 minutes. Free forever.
          </p>
          <Link
            href="/signup"
            className="px-10 py-4 bg-yellow-400 text-slate-900 font-black rounded-xl text-xl hover:bg-yellow-300 transition-colors inline-block shadow-lg"
          >
            Start Free Now
          </Link>
          <p className="mt-5 text-emerald-200 text-sm">No credit card required &nbsp;·&nbsp; Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>🎱</span>
            <span className="font-bold text-slate-300">Pool League Manager</span>
          </div>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-slate-200 transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-slate-200 transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-slate-200 transition-colors">Sign Up</Link>
          </div>
          <span>&copy; {new Date().getFullYear()} Pool League Manager</span>
        </div>
      </footer>
    </div>
  );
}
