import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pool League Score Tracking: From Paper Scoresheets to Digital',
  description:
    'Discover modern pool league score tracking methods — from paper scoresheets to phone-based digital submission with OCR scanning. Learn how to eliminate data entry and get real-time standings.',
  alternates: { canonical: '/pool-league-score-tracking' },
  openGraph: {
    title: 'Pool League Score Tracking: From Paper Scoresheets to Digital',
    description:
      'Move your pool league from paper scoresheets to real-time digital score tracking. Phone submissions, OCR scanning, and automatic standings.',
    url: 'https://pool-league-manager.com/pool-league-score-tracking',
    type: 'article',
  },
};

export default function PoolLeagueScoreTracking() {
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
          <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wide mb-3">Score Tracking Guide</p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            Pool League Score Tracking: From Paper Scoresheets to Digital
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Every pool league lives and dies by its score tracking. Get scores recorded accurately and standings will take care of themselves. But for most independent leagues, score tracking means paper scoresheets and a league organizer spending hours every week doing data entry. It does not have to be that way.
          </p>
        </header>

        <div className="prose prose-slate prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">The Paper Scoresheet Era</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Walk into any bar pool league on a Tuesday night and you will see it: a printed or photocopied scoresheet on each table. Team captains fill in player names, mark wins and losses for each game, total up the scores, and sign the sheet. At the end of the night, the sheets get handed to the league organizer — or left on the bar and forgotten. The organizer collects whatever arrives, manually enters every number into a spreadsheet, calculates standings, and emails or posts the results. This process has not changed in decades and it has the same problems it has always had.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Problems with Paper-Based Tracking</h2>
          <ul className="space-y-3 text-slate-600 mb-6 list-disc pl-6">
            <li><strong>Lost scoresheets</strong> — papers get left at the bar, thrown away by cleaning staff, or shoved in a pocket and forgotten. Missing sheets mean missing results and inaccurate standings.</li>
            <li><strong>Illegible handwriting</strong> — after a few beers, penmanship suffers. The organizer is left guessing whether that is a 3 or an 8.</li>
            <li><strong>Math errors</strong> — addition mistakes on paper are shockingly common. If the totals do not add up, the organizer has to track down both captains to figure out what actually happened.</li>
            <li><strong>Delayed results</strong> — standings do not update until the organizer finishes data entry, which might be days after match night. Players want to know where they stand now, not next Thursday.</li>
            <li><strong>Organizer burnout</strong> — the weekly grind of collecting, entering, and verifying scores is the single biggest reason league organizers quit. And when the organizer quits, the league often dies with them.</li>
            <li><strong>No player-level stats</strong> — paper tracking almost never includes individual player win/loss records because the data entry burden would be enormous.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Web-Based Score Submission</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            The modern approach is a web form that team captains fill out on their phones right after the match. The captain selects the matchup, enters each game result, and submits. The system validates the data in real time (total games must add up, player names must match the roster) and standings update the instant the score is confirmed. This is how <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">Pool League Manager</Link> works on the free tier — captains pull up the score entry page on their phone, tap in the results, and they are done. No app to install, no account to create for players, no paper.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Dual-Submission Verification</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            One of the most powerful features of digital score tracking is dual submission. Both team captains submit the score independently. If the two submissions match, the score is automatically approved. If they do not match, the system flags the discrepancy and the league organizer can review and resolve it. This catches honest mistakes ("I thought Mike won that last game") and prevents intentional score manipulation. It is the digital equivalent of having both captains sign the scoresheet — but it actually works because the system enforces it.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Photo Scoresheet Scanning with OCR</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Some leagues are attached to their paper scoresheets — the physical act of marking wins and losses at the table is part of the tradition. That is fine. With photo scoresheet scanning, captains can keep their paper sheets and simply take a photo when the match is done. The photo is uploaded to the system, which uses OCR (optical character recognition) powered by AI to read the handwriting, extract the scores, and populate the digital record. The captain confirms the extracted data is correct and submits. It bridges the gap between paper tradition and digital convenience.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Real-Time Standings</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            The biggest benefit of digital score tracking is instant standings. The moment a score is submitted and verified, team rankings update. Win percentages recalculate. Player stats refresh. Everyone in the league can check standings on their phone at any time. This keeps engagement high throughout the season — players check standings the way sports fans check box scores. It also eliminates the "when are standings coming out?" texts to the organizer.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Player-Level Statistics</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            When scores are submitted digitally at the game level (not just team totals), individual player statistics become possible for the first time. Win/loss records, win percentages, streaks, head-to-head records — all calculated automatically. Players love this data. It drives friendly competition, helps with handicap calculations, and gives players something to talk about between matches. With paper scoresheets and spreadsheets, tracking player stats is prohibitively time-consuming. With digital submission, it is free.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Making the Switch</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Moving from paper to digital does not have to be all-or-nothing. Start by having captains submit scores through <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">Pool League Manager</Link> after match night while still keeping paper as a backup. Most teams adopt the digital workflow within two or three weeks once they see how much faster and more accurate it is. The organizer stops getting late-night texts asking for standings updates, and players start checking their stats on their own.
          </p>
        </div>

        <div className="mt-16 bg-emerald-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Ditch the paper scoresheets</h2>
          <p className="text-emerald-100 text-lg mb-8">
            Let captains submit scores from their phones. Standings update in real time. Zero data entry for you.
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
