import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Looking for APA League Software? Try Pool League Manager',
  description:
    'Pool League Manager is the flexible, free alternative to APA league software. Run your independent pool league with auto scheduling, digital score tracking, and real-time standings — no franchise fees.',
  alternates: { canonical: '/apa-league-alternative' },
  openGraph: {
    title: 'Looking for APA League Software? Try Pool League Manager',
    description:
      'Run your independent pool league without franchise fees. Free scheduling, score tracking, and standings — the flexible APA alternative.',
    url: 'https://pool-league-manager.com/apa-league-alternative',
    type: 'article',
  },
};

export default function APALeagueAlternative() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎱</span>
            <span className="text-lg font-black text-slate-800">Pool League Manager</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-600 hover:text-slate-800 font-medium">Sign In</Link>
            <Link href="/signup" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors">Start Free</Link>
          </div>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-4 py-16">
        <header className="mb-12">
          <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wide mb-3">Comparison Guide</p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            Looking for APA League Software? Try Pool League Manager
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            The American Poolplayers Association (APA) is the largest organized pool league in the country. But APA is not the only way to run a league. Thousands of independent bar leagues operate outside the APA system — and they need software too. If you are running an independent league, or thinking about leaving APA to do your own thing, here is how Pool League Manager compares.
          </p>
        </header>

        <div className="prose prose-slate prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">What APA Provides</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            APA is a franchise system. When you join APA, you get:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc pl-6">
            <li><strong>The Equalizer handicap system</strong> — APA's proprietary skill-level system that rates players from 2 to 7 (8-ball) or 1 to 9 (9-ball).</li>
            <li><strong>League management software</strong> — APA's own platform for schedules, scores, and standings (available only to APA members).</li>
            <li><strong>National tournament pathway</strong> — teams can qualify for APA nationals in Las Vegas, which is a significant draw for competitive players.</li>
            <li><strong>Brand recognition</strong> — APA is a known brand. Players who move to a new city can find an APA league quickly.</li>
            <li><strong>League operator support</strong> — APA provides training and resources for local operators who run leagues in their area.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">What APA Costs</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            APA membership is not free. Players typically pay weekly dues — usually $5–10 per player per week — which add up over a season. A portion goes to APA national, a portion funds prize pools, and a portion goes to the local operator. For a team of 5 playing 16 weeks, that is $400–800 per team per season in total dues. There are also franchise fees for operators and rules about how leagues must be structured. You play APA's way, on APA's schedule, with APA's rules.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">What Independent Leagues Need</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Not every league needs or wants the APA structure. Independent leagues exist because organizers want:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc pl-6">
            <li><strong>Full control over rules</strong> — choose your own game format, match structure, team size, and season length. No franchise playbook.</li>
            <li><strong>Lower cost for players</strong> — without franchise fees flowing upstream, player costs can be dramatically lower or even zero.</li>
            <li><strong>Flexible scheduling</strong> — play on any night, any frequency. APA typically locks you into a specific weeknight.</li>
            <li><strong>Local focus</strong> — many bar leagues are about community and fun, not qualifying for nationals. The league exists to bring people together on Tuesday nights, not to feed a tournament pipeline.</li>
            <li><strong>Custom scoring</strong> — use your own point system, handicap method, or match format. You are not locked into APA's Equalizer.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Where APA Falls Short for Independents</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            APA's software is only available to APA members. If you leave APA or start an independent league from scratch, you are on your own for league management tools. Most independent organizers fall back to spreadsheets, paper scoresheets, and group text threads. That works for a few weeks — until the organizer gets burned out from the manual work and the league falls apart. The gap is not the competition or the brand — it is the software. Independent leagues need the same scheduling, scoring, and standings tools that APA provides, without the franchise overhead.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">How Pool League Manager Compares</h2>
          <div className="bg-slate-50 rounded-xl overflow-hidden mb-6">
            <div className="grid grid-cols-3 text-sm font-bold text-slate-700 bg-slate-100 px-4 py-3">
              <span>Feature</span>
              <span className="text-center">APA</span>
              <span className="text-center text-emerald-600">Pool League Manager</span>
            </div>
            {[
              ['Schedule generation', '✓', '✓'],
              ['Score tracking', '✓', '✓'],
              ['Live standings', '✓', '✓'],
              ['Player stats', '✓', '✓ (Pro plan)'],
              ['Photo scoresheet OCR', '✗', '✓ (Pro plan)'],
              ['Custom rules & formats', '✗', '✓'],
              ['Free tier', '✗', '✓'],
              ['No franchise fees', '✗', '✓'],
              ['National tournament', '✓', '✗'],
              ['Handicap system', 'Equalizer™', 'Custom / manual'],
              ['Multiple leagues', 'Operator only', '✓ (Premium)'],
            ].map(([feature, apa, plm]) => (
              <div key={feature} className="grid grid-cols-3 text-sm px-4 py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-700 font-medium">{feature}</span>
                <span className="text-center text-slate-500">{apa}</span>
                <span className="text-center text-slate-700">{plm}</span>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">The Flexibility Advantage</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Pool League Manager does not dictate how your league runs. Want 3-player teams instead of 5? Fine. Want to play 9-ball one season and 8-ball the next? Go for it. Want to run two separate leagues at the same bar — a competitive league on Tuesdays and a casual league on Thursdays? The Premium plan handles that. You set the rules, the software handles the logistics.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Pricing: APA vs Pool League Manager</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            APA costs each player $5–10 per week. For a 5-player team over a 16-week season, that is $400–800 per team — or $3,200–6,400 for an 8-team league. Pool League Manager starts at $0 for small leagues (up to 5 teams) and tops out at $20/month for the Premium plan with unlimited teams and multiple leagues. Even the most expensive PLM plan costs less per season than a single team's APA dues. The math is not close.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">When APA Is the Better Choice</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            To be fair, APA is the right choice for some players and leagues. If your players want a path to nationals in Las Vegas, that is uniquely APA. If you want a proven handicap system without having to build your own, the Equalizer is battle-tested. And if you want the APA brand to help with recruiting, that has real value in markets where APA is strong. But if you want independence, flexibility, and dramatically lower cost — and you just need solid tools to run your league — Pool League Manager is built for exactly that.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Switching from APA</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            If you are currently in APA and thinking about going independent, the transition is straightforward. Set up your league in <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">Pool League Manager</Link>, add your existing teams and players, and generate your first independent season schedule. Your players will notice the lower cost immediately and the software handles everything APA's platform used to handle — scheduling, scores, and standings. You lose the tournament pathway but gain complete control over your league.
          </p>
        </div>

        <div className="mt-16 bg-emerald-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Run your league, your way</h2>
          <p className="text-emerald-100 text-lg mb-8">
            No franchise fees. No rigid rules. Just solid tools for independent pool leagues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-yellow-400 text-slate-900 font-black rounded-xl text-lg hover:bg-yellow-300 transition-colors inline-block shadow-lg"
            >
              Start Free Now
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl text-lg hover:bg-white/20 transition-colors border border-white/20 inline-block"
            >
              Compare Plans
            </Link>
          </div>
        </div>
      </article>

      <footer className="bg-slate-900 text-slate-400 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <Link href="/" className="flex items-center gap-2">
            <span>🎱</span>
            <span className="font-bold text-slate-300">Pool League Manager</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/pricing" className="hover:text-slate-200">Pricing</Link>
            <Link href="/how-to-run-a-pool-league" className="hover:text-slate-200">Run a League</Link>
            <Link href="/pool-league-scheduling" className="hover:text-slate-200">Scheduling</Link>
            <Link href="/pool-league-score-tracking" className="hover:text-slate-200">Score Tracking</Link>
            <Link href="/apa-league-alternative" className="hover:text-slate-200">APA Alternative</Link>
            <Link href="/privacy" className="hover:text-slate-200">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-200">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
