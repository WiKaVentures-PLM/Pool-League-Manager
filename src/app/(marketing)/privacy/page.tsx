import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Pool League Manager',
  description:
    'How Pool League Manager collects, uses, and protects your information.',
};

const LAST_UPDATED = 'October 4, 2026';

export default function PrivacyPage() {
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
            <Link
              href="/terms"
              className="text-slate-400 hover:text-white font-medium transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/login"
              className="text-slate-400 hover:text-white font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black mb-3">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">
          <section>
            <p>
              Pool League Manager (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) provides
              software that amateur pool and billiards leagues use to manage teams, schedules,
              scores, and standings. This policy explains what information we collect, why we
              collect it, and what choices you have. It applies to{' '}
              <span className="text-white">pool-league-manager.com</span>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Information we collect</h2>
            <ul className="space-y-3 list-disc pl-5">
              <li>
                <span className="text-white font-semibold">Account information.</span> Your name,
                email address, and password when you create an account. Passwords are stored as
                salted hashes by our authentication provider; we never see them in plain text.
              </li>
              <li>
                <span className="text-white font-semibold">Mobile phone numbers.</span> League
                administrators and team captains may provide a mobile number as part of their
                account profile.
              </li>
              <li>
                <span className="text-white font-semibold">League data.</span> Team names, player
                names, schedules, match results, and standings that you or your league
                administrator enter.
              </li>
              <li>
                <span className="text-white font-semibold">Scoresheet images.</span> If you submit
                scores by photo uploaded in the app, we process that image to read the scores from
                it.
              </li>
              <li>
                <span className="text-white font-semibold">Billing information.</span> If your
                league subscribes to a paid plan, payment details are collected and stored by
                Stripe. We do not receive or store your full card number.
              </li>
              <li>
                <span className="text-white font-semibold">Technical data.</span> Standard server
                logs such as IP address, browser type, and timestamps, used to operate and secure
                the service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">How we use information</h2>
            <p className="mb-3">We use the information above to:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>operate your league — record scores, generate schedules, and compute standings;</li>
              <li>authenticate you and keep your league&rsquo;s data separated from other leagues;</li>
              <li>
                send transactional emails, such as billing receipts and account notifications;
              </li>
              <li>process subscription payments and send billing receipts;</li>
              <li>diagnose problems, prevent abuse, and improve the service.</li>
            </ul>
            <p className="mt-4">
              We do not use your information for advertising, and we do not sell it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Who we share data with</h2>
            <p className="mb-3">
              We share information only with service providers that help us run the product, and
              only to the extent they need it:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <span className="text-white font-semibold">Supabase</span> — database, file storage,
                and authentication.
              </li>
              <li>
                <span className="text-white font-semibold">Vercel</span> — application hosting.
              </li>
              <li>
                <span className="text-white font-semibold">Anthropic</span> — reading the scores off
                a scoresheet image you submit.
              </li>
              <li>
                <span className="text-white font-semibold">Stripe</span> — subscription billing and
                payment processing.
              </li>
            </ul>
            <p className="mt-4">
              Other members of your league will see league data you would expect them to see, such
              as schedules, match results, and standings. We may also disclose information if
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data retention</h2>
            <p>
              League data is kept for as long as your league keeps its account open, since the value
              of the product is in historical standings and player statistics. Scoresheet images are
              retained with the match record they document. You may ask us to delete your account
              and its data at any time using the contact address below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Your choices</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>Update your name, email, or phone number in your account settings.</li>
              <li>Request a copy of your data, or its deletion, by emailing us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Children</h2>
            <p>
              The service is not directed to children under 13, and we do not knowingly collect
              their information. Leagues that include minors should have a parent or guardian manage
              the account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Security</h2>
            <p>
              Data is transmitted over encrypted connections and stored with access controls that
              keep each league&rsquo;s records separate. No system is perfectly secure, but we take
              reasonable measures to protect your information and will notify you of a breach
              affecting your data where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Changes to this policy</h2>
            <p>
              If we make a material change, we will update the date at the top of this page and, for
              significant changes, notify account holders by email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
            <p>
              Questions about this policy or your data? Email{' '}
              <a
                href="mailto:support@pool-league-manager.com"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                support@pool-league-manager.com
              </a>
              . Pool League Manager is operated from Iowa, United States.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-8 px-4 text-center text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} Pool League Manager. All rights reserved.{' '}
        <Link href="/terms" className="hover:text-slate-400 transition-colors">
          Terms of Service
        </Link>
        {' · '}
        <Link href="/" className="hover:text-slate-400 transition-colors">
          Back to home
        </Link>
      </footer>
    </div>
  );
}
