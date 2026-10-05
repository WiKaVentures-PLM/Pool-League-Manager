import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Pool League Manager',
  description:
    'The terms that govern your use of Pool League Manager, including subscriptions and our SMS messaging program.',
};

const LAST_UPDATED = 'October 4, 2026';

export default function TermsPage() {
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
              href="/privacy"
              className="text-slate-400 hover:text-white font-medium transition-colors"
            >
              Privacy
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
        <h1 className="text-4xl font-black mb-3">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">
          <section>
            <p>
              These terms govern your use of Pool League Manager, software for managing amateur pool
              and billiards leagues, available at{' '}
              <span className="text-white">pool-league-manager.com</span>. By creating an account or
              using the service, you agree to these terms. If you do not agree, do not use the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. The service</h2>
            <p>
              Pool League Manager lets a league administrator create a league, add teams and
              players, generate schedules, collect match scores, and publish standings. Scores can
              be entered on the web, submitted as a photo in the app, or &mdash; on plans that include it
              &mdash; texted to a league phone number. Features available to you depend on your plan.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Accounts</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>You must be at least 13 years old to hold an account.</li>
              <li>
                You are responsible for keeping your login credentials confidential and for activity
                under your account.
              </li>
              <li>
                League administrators are responsible for the accuracy of the team, player, and
                contact information they enter, and for having permission to enter another
                person&rsquo;s name or phone number.
              </li>
              <li>Tell us promptly if you believe your account has been compromised.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Acceptable use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>use the service to send unsolicited, unlawful, or harassing messages;</li>
              <li>
                enter a phone number for text messaging without that person&rsquo;s permission;
              </li>
              <li>
                attempt to access another league&rsquo;s data, or probe, scan, or interfere with the
                service;
              </li>
              <li>upload content that is unlawful or infringes someone else&rsquo;s rights;</li>
              <li>resell or redistribute the service without our written agreement.</li>
            </ul>
            <p className="mt-4">
              We may suspend or terminate an account that violates these terms.
            </p>
          </section>

          {/* SMS terms — reviewed by mobile carriers alongside the privacy policy. */}
          <section className="rounded-2xl border border-emerald-800 bg-emerald-950/40 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">4. Text messaging terms</h2>
            <p className="mb-4">
              If your league uses text message score submission, these terms apply to those
              messages:
            </p>
            <ul className="space-y-3 list-disc pl-5">
              <li>
                <span className="text-white font-semibold">You start the conversation.</span> You
                opt in by texting your league&rsquo;s number, normally with a photo of your
                completed scoresheet. We reply only to numbers that have texted us.
              </li>
              <li>
                <span className="text-white font-semibold">What we send.</span> Transactional
                confirmations about the scores you submitted. No marketing or promotional messages
                are sent through this program.
              </li>
              <li>
                <span className="text-white font-semibold">Frequency.</span> Varies with your score
                submissions, typically one or two messages per match night.
              </li>
              <li>
                <span className="text-white font-semibold">Rates.</span> Message and data rates may
                apply. Your carrier&rsquo;s standard charges are your responsibility.
              </li>
              <li>
                <span className="text-white font-semibold">Opt out.</span> Reply{' '}
                <span className="text-white font-mono">STOP</span> at any time to stop messages,{' '}
                <span className="text-white font-mono">START</span> to resume, or{' '}
                <span className="text-white font-mono">HELP</span> for help. Opting out of texts
                does not close your account; you can still enter scores on the web.
              </li>
              <li>
                <span className="text-white font-semibold">Delivery.</span> Mobile carriers are not
                liable for delayed or undelivered messages. We cannot guarantee delivery.
              </li>
              <li>
                <span className="text-white font-semibold">Automated reading of photos.</span>{' '}
                Scoresheet photos are read automatically and may be misread. Submitted scores are
                subject to confirmation by the opposing captain or review by your league
                administrator.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Plans, trials, and billing</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                Paid plans are billed monthly in advance through Stripe. By subscribing you
                authorize recurring charges until you cancel.
              </li>
              <li>
                Free trials run for the period stated at signup. If you do not subscribe, the league
                moves to the Free plan automatically rather than being charged.
              </li>
              <li>
                You can cancel at any time from your league settings. Cancellation stops future
                charges and takes effect at the end of the current billing period.
              </li>
              <li>
                Fees already paid are non-refundable except where required by law. We may change
                prices with at least 30 days&rsquo; notice to active subscribers.
              </li>
              <li>
                If a payment fails, we may limit paid features after a grace period while you update
                your payment method.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Your data</h2>
            <p>
              Your league&rsquo;s data is yours. We claim no ownership of the team, player, score,
              or schedule information you enter, and we use it to operate the service as described
              in our{' '}
              <Link
                href="/privacy"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Privacy Policy
              </Link>
              . You grant us the limited licence needed to store, process, and display that data to
              run your league. You may request export or deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Our intellectual property</h2>
            <p>
              The software, design, and brand of Pool League Manager remain ours. These terms grant
              you a limited, non-exclusive, non-transferable right to use the service while your
              account is in good standing, and nothing more.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Availability</h2>
            <p>
              We aim to keep the service available but do not promise uninterrupted operation. We
              may change, suspend, or discontinue features, and we rely on third-party providers for
              hosting, messaging, and payments whose outages can affect us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimer</h2>
            <p>
              The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
              warranties of any kind, whether express or implied, including fitness for a particular
              purpose and non-infringement. In particular, automatically read scores may contain
              errors, and league standings should be confirmed by your league administrator before
              being treated as final.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, we are not liable for indirect, incidental,
              special, or consequential damages, or for lost data or lost profits. Our total
              liability for any claim relating to the service is limited to the amount you paid us
              in the twelve months before the claim, or twenty five US dollars if you paid nothing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Changes to these terms</h2>
            <p>
              We may update these terms. The date at the top of this page will change, and for
              material changes we will notify account holders by email. Continuing to use the
              service after a change means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Governing law</h2>
            <p>
              These terms are governed by the laws of the State of Iowa, United States, without
              regard to its conflict-of-laws rules. Disputes will be brought in the state or federal
              courts located in Iowa.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact</h2>
            <p>
              Questions about these terms? Email{' '}
              <a
                href="mailto:support@pool-league-manager.com"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                support@pool-league-manager.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-8 px-4 text-center text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} Pool League Manager. All rights reserved.{' '}
        <Link href="/privacy" className="hover:text-slate-400 transition-colors">
          Privacy Policy
        </Link>
        {' · '}
        <Link href="/" className="hover:text-slate-400 transition-colors">
          Back to home
        </Link>
      </footer>
    </div>
  );
}
