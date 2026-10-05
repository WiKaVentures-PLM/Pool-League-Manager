import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How to Run a Pool League: Complete Guide for Bar Owners & Organizers',
  description:
    'Learn how to start and run a successful bar pool league. Covers finding teams, creating schedules, tracking scores, managing standings, and common pitfalls to avoid.',
  alternates: { canonical: '/how-to-run-a-pool-league' },
  openGraph: {
    title: 'How to Run a Pool League: Complete Guide for Bar Owners & Organizers',
    description:
      'Everything you need to start and manage a successful bar pool league — from recruiting teams to automating standings.',
    url: 'https://pool-league-manager.com/how-to-run-a-pool-league',
    type: 'article',
  },
};

export default function HowToRunAPoolLeague() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎱</span>
            <span className="text-lg font-black text-slate-800">Pool League Manager</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-600 hover:text-slate-800 font-medium">
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

      <article className="max-w-4xl mx-auto px-4 py-16">
        <header className="mb-12">
          <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wide mb-3">League Organizer Guide</p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            How to Run a Pool League: Complete Guide for Bar Owners & Organizers
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Running a pool league is one of the best ways to bring consistent weeknight traffic to your bar, build a loyal community, and keep your tables busy. But between recruiting teams, building schedules, tracking scores, and resolving disputes, it can feel like a second job. This guide walks you through every step — and shows you how software can handle the tedious parts.
          </p>
        </header>

        <div className="prose prose-slate prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Why Start a Pool League?</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Bar pool leagues create a steady stream of customers on what would otherwise be slow weeknights. League players typically bring friends, order food and drinks, and become regulars. For players, a league offers structure, competition, and camaraderie that casual games cannot match. Whether you run a neighborhood tavern in Iowa or a sports bar in Dallas, a well-organized league pays for itself many times over through increased foot traffic and bar revenue.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Step 1: Decide on Your Format</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Before you recruit a single team, nail down the basics. The most common format for bar pool leagues is <strong>8-ball</strong>, played in a round-robin format over 12–16 weeks. Here are the key decisions:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc pl-6">
            <li><strong>Game type:</strong> 8-ball is the most popular for bar leagues. 9-ball and 10-ball work well for more experienced players.</li>
            <li><strong>Team size:</strong> Most bar leagues run with 4–5 players per team. Smaller rosters mean fewer scheduling conflicts.</li>
            <li><strong>Match format:</strong> A typical match night has each player from one team playing against each player from the other — usually 15–20 individual games per match.</li>
            <li><strong>Season length:</strong> 12–16 weeks is the sweet spot. Shorter seasons lose momentum; longer ones see dropout.</li>
            <li><strong>Halves or single season:</strong> Some leagues split the season into two halves with a position night in between. This keeps things competitive even if one team dominates early.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Step 2: Recruit Teams</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            You need a minimum of 4 teams to make a league viable, but 6–10 is ideal. Here is how to recruit:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc pl-6">
            <li><strong>Post flyers at the bar</strong> with a QR code that links to your signup page.</li>
            <li><strong>Talk to regulars</strong> who already play pool at your venue — they are your easiest converts.</li>
            <li><strong>Reach out to other bars</strong> in the area. A league that rotates venues brings new customers to each bar.</li>
            <li><strong>Use social media</strong> — local Facebook groups for pool or billiards are goldmines for recruiting.</li>
            <li><strong>Offer the first season free or discounted</strong> to lower the barrier. Once teams experience organized play, they will come back.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Step 3: Build the Schedule</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Schedule generation is where most organizers hit their first wall. A round-robin schedule for 8 teams means 28 unique matchups — and you need to account for bye weeks if you have an odd number of teams, avoid back-to-back home matches, and work around holidays. Many organizers spend hours in Excel trying to get this right. With <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">Pool League Manager</Link>, you add your teams, set your start date, and the schedule generates automatically — including bye weeks, venue rotation, and position nights.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Step 4: Track Scores and Standings</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            On match night, someone needs to record who won each game and report the results. Traditionally this means paper scoresheets that get handed to the league organizer, who manually enters them into a spreadsheet. This process is slow, error-prone, and miserable for the organizer. Modern league management software lets captains submit scores directly from their phones. With dual-submission verification (both teams submit, and mismatches are flagged), accuracy goes way up and organizer workload drops to near zero.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Step 5: Manage Standings and Playoffs</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            As scores come in, standings should update automatically. Teams want to see where they rank, what their win percentage is, and who they play next. If you are doing this manually, every Tuesday night turns into a data entry session. With automated standings, every score submission instantly updates rankings. Position nights — where teams are matched by rank for a final round — can be generated from the standings automatically. Playoffs become a simple bracket seeded by final standings.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Common Problems and How to Solve Them</h2>
          <ul className="space-y-3 text-slate-600 mb-6 list-disc pl-6">
            <li><strong>Teams not showing up:</strong> Set clear forfeit rules and enforce them consistently. Most leagues use a three-strike rule.</li>
            <li><strong>Score disputes:</strong> Dual-submission systems catch discrepancies before they become arguments. Both captains submit independently.</li>
            <li><strong>Unbalanced competition:</strong> Consider a handicap system or split your league into A and B divisions.</li>
            <li><strong>Organizer burnout:</strong> This is the number-one killer of pool leagues. The organizer gets tired of the spreadsheet work and quits. Automating schedules, scores, and standings removes 90% of the grunt work.</li>
            <li><strong>Communication breakdowns:</strong> Use a centralized platform where schedules, standings, and announcements live in one place instead of scattered text threads.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">How Pool League Manager Makes It Easy</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">Pool League Manager</Link> was built specifically for bar and tavern pool leagues. It handles schedule generation, score submission, standings calculation, and team management — so you can focus on growing your league instead of fighting with spreadsheets. The free tier supports a full league with up to 5 teams, and paid plans start at just $5/month for larger leagues. There is no contract, no setup fee, and you can be up and running in under two minutes.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-emerald-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Ready to start your pool league?</h2>
          <p className="text-emerald-100 text-lg mb-8">
            Set up your league in under 2 minutes. Free to start — no credit card required.
          </p>
          <Link
            href="/signup"
            className="px-8 py-4 bg-yellow-400 text-slate-900 font-black rounded-xl text-lg hover:bg-yellow-300 transition-colors inline-block shadow-lg"
          >
            Start Free Now
          </Link>
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
            <Link href="/privacy" className="hover:text-slate-200">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-200">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
