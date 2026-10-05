import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pool League Scheduling Made Easy: Round-Robin, Position Nights & More',
  description:
    'Learn how pool league scheduling works — round-robin formats, position nights, bye weeks, and venue management. See why spreadsheets fail and how software automates it all.',
  alternates: { canonical: '/pool-league-scheduling' },
  openGraph: {
    title: 'Pool League Scheduling Made Easy: Round-Robin, Position Nights & More',
    description:
      'Everything you need to know about pool league scheduling — from round-robin formats to bye weeks and position nights.',
    url: 'https://pool-league-manager.com/pool-league-scheduling',
    type: 'article',
  },
};

export default function PoolLeagueScheduling() {
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
          <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wide mb-3">Scheduling Guide</p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            Pool League Scheduling Made Easy: Round-Robin, Position Nights & More
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            The schedule is the backbone of any pool league. Get it wrong and you will spend the whole season dealing with complaints about unfair matchups, double-booked tables, and missed bye weeks. This guide covers the most common scheduling formats, the headaches that come with each, and how to automate the whole thing.
          </p>
        </header>

        <div className="prose prose-slate prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">What Is Round-Robin Scheduling?</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            A round-robin schedule is the gold standard for pool leagues. Every team plays every other team at least once during the season. With 8 teams, that means 7 rounds where each team plays once per round — 28 total matchups. Round-robin ensures fairness: no team gets an easier path to the top of the standings just because of who they drew. It also guarantees that every team gets the same number of matches, which makes final standings meaningful.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">How Round-Robin Math Works</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            The formula is straightforward. For N teams, you need N-1 rounds (if each team plays once per week). The total number of matches across the season is N × (N-1) / 2.
          </p>
          <div className="bg-slate-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-sm text-slate-500 mb-1">Teams</p><p className="text-2xl font-bold text-slate-800">6</p></div>
              <div><p className="text-sm text-slate-500 mb-1">Weeks</p><p className="text-2xl font-bold text-slate-800">5</p></div>
              <div><p className="text-sm text-slate-500 mb-1">Total Matches</p><p className="text-2xl font-bold text-emerald-600">15</p></div>
            </div>
            <hr className="my-4 border-slate-200" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-sm text-slate-500 mb-1">Teams</p><p className="text-2xl font-bold text-slate-800">8</p></div>
              <div><p className="text-sm text-slate-500 mb-1">Weeks</p><p className="text-2xl font-bold text-slate-800">7</p></div>
              <div><p className="text-sm text-slate-500 mb-1">Total Matches</p><p className="text-2xl font-bold text-emerald-600">28</p></div>
            </div>
            <hr className="my-4 border-slate-200" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-sm text-slate-500 mb-1">Teams</p><p className="text-2xl font-bold text-slate-800">10</p></div>
              <div><p className="text-sm text-slate-500 mb-1">Weeks</p><p className="text-2xl font-bold text-slate-800">9</p></div>
              <div><p className="text-sm text-slate-500 mb-1">Total Matches</p><p className="text-2xl font-bold text-emerald-600">45</p></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Handling Bye Weeks</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            If you have an odd number of teams (5, 7, 9, etc.), one team sits out each week — that is a bye week. In a spreadsheet, tracking byes correctly is one of the most common sources of errors. You have to make sure every team gets the same number of byes, no team gets back-to-back byes, and the bye schedule does not create unfair advantages. Dedicated scheduling software handles bye distribution automatically, rotating them evenly across all teams.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Position Nights Explained</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            A position night is a special round where teams are matched by their current standings rather than the pre-set schedule. First place plays second place, third plays fourth, and so on. Position nights are typically scheduled at the midpoint of the season (end of the first half) and sometimes again before playoffs. They serve two purposes: they create high-stakes matches between evenly ranked teams, and they give mid-table teams a more competitive opponent. Calculating position night matchups manually means checking current standings, ranking teams, and creating a new mini-schedule — or you can let your league software do it in one click.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Venue Management and Rotation</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Many pool leagues play at multiple bars, with each team having a "home" venue. The schedule should balance home and away matches so no team plays too many weeks in a row at one location. Some leagues rotate through a circuit of bars — Monday at The Corner Pocket, next Monday at Rack City, and so on. Managing venue assignments in a spreadsheet is painful: you are essentially solving a constraint satisfaction problem by hand. Pool League Manager lets you assign home venues to teams and automatically balances home/away distribution across the season.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Why Spreadsheets Fail at League Scheduling</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Organizers start with spreadsheets because they are free and familiar. But league scheduling breaks spreadsheets in predictable ways:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc pl-6">
            <li><strong>Manual round-robin generation</strong> — creating a fair round-robin by hand takes hours and one mistake cascades through the whole season.</li>
            <li><strong>Bye week errors</strong> — the most common mistake is giving one team two byes while another team gets none.</li>
            <li><strong>No conflict detection</strong> — spreadsheets cannot tell you that you scheduled two matches at the same venue on the same night.</li>
            <li><strong>Holiday gaps</strong> — inserting a break for Thanksgiving or Christmas means manually shifting every remaining week.</li>
            <li><strong>Mid-season changes</strong> — if a team drops out or a new team joins, you have to rebuild the entire schedule from scratch.</li>
            <li><strong>Version control</strong> — someone emails "updated schedule v3 FINAL (2).xlsx" and nobody knows which version is current.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Double Round-Robin and Split Seasons</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            A double round-robin has every team play every other team twice — once at home and once away. This is ideal for smaller leagues (4–6 teams) where a single round-robin would be too short. Split seasons divide the schedule into two halves, each with its own standings and a position night in between. The two halves give teams a fresh start at the midpoint, which keeps interest high even if one team ran away with the first half.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Automate Your Schedule with Pool League Manager</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">Pool League Manager</Link> generates complete round-robin schedules with one click. Add your teams, set the start date, flag any holidays, and the system builds the entire season — complete with balanced bye weeks, venue rotation, and position night placement. If a team drops or joins mid-season, the schedule rebuilds automatically. No spreadsheet headaches, no version confusion.
          </p>
        </div>

        <div className="mt-16 bg-emerald-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Generate your schedule in one click</h2>
          <p className="text-emerald-100 text-lg mb-8">
            Stop fighting with spreadsheets. Pool League Manager builds your entire season automatically.
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
