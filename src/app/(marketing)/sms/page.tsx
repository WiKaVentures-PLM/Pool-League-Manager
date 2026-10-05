import Link from 'next/link';
import type { Metadata } from 'next';
import { MessageSquare, Camera, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Submit Scores by Text | Pool League Manager',
  description:
    'Team captains can text a photo of their scoresheet to submit scores. How to opt in, message rates, and how to stop messages.',
};

// The league's registered A2P 10DLC sending number. This page is the public
// call-to-action that mobile carriers review during campaign vetting, so the
// number and the consent language below must stay visible and accurate.
const SMS_NUMBER_DISPLAY = '(319) 249-0664';
const SMS_NUMBER_E164 = '+13192490664';

export default function SmsPage() {
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
              href="/terms"
              className="text-slate-400 hover:text-white font-medium transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black mb-4">Submit scores by text</h1>
        <p className="text-slate-400 text-lg mb-12">
          Team captains can submit match results by texting a photo of the scoresheet. No app, no
          login, no typing scores in.
        </p>

        {/* The call-to-action. */}
        <section className="rounded-2xl border border-emerald-500 bg-emerald-950/40 p-8 mb-12 text-center">
          <p className="text-slate-300 mb-3 flex items-center justify-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            Text a photo of your completed scoresheet to
          </p>
          <a
            href={`sms:${SMS_NUMBER_E164}`}
            className="text-4xl md:text-5xl font-black text-emerald-400 hover:text-emerald-300 transition-colors block mb-4"
          >
            {SMS_NUMBER_DISPLAY}
          </a>
          <p className="text-slate-400 text-sm">
            The first time you text us, we&rsquo;ll ask you to reply{' '}
            <span className="text-white font-mono font-bold">YES</span> to confirm you agree to
            receive text messages. You only have to do that once, and we hold on to your scoresheet
            while you do &mdash; no need to resend the photo.
          </p>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How it works</h2>
          <ol className="space-y-5">
            {[
              {
                icon: Camera,
                title: 'Text us a photo of the scoresheet',
                body: `Snap the completed sheet and send it to ${SMS_NUMBER_DISPLAY}. Make sure the whole sheet is in frame and readable.`,
              },
              {
                icon: MessageSquare,
                title: 'Reply YES the first time',
                body: 'We reply asking you to confirm you agree to receive texts. Reply YES once and you are set for the season.',
              },
              {
                icon: Check,
                title: 'We read it and text you back',
                body: 'We read the scores off the photo and text you a confirmation. If the other captain submitted matching scores, the match is approved automatically. If not, your league admin reviews it.',
              },
            ].map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">
                    {i + 1}. {title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Required program disclosures. */}
        <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Message program details</h2>
          <dl className="space-y-3 text-sm">
            {[
              ['Who it is for', 'Pool league team captains submitting match scores.'],
              [
                'What we send',
                'Only replies to a text you sent us — a confirmation that your scores were received and recorded, or a request for a clearer photo. No marketing or promotional messages.',
              ],
              [
                'Message frequency',
                'Varies by how often you submit scores, typically one or two messages per match night.',
              ],
              ['Cost', 'We do not charge for texts. Message and data rates may apply.'],
              [
                'To stop messages',
                'Reply STOP at any time. Reply START to resume. Reply HELP for help. Opting out of texts does not close your account — you can still enter scores on the web.',
              ],
              [
                'Carriers',
                'Mobile carriers are not liable for delayed or undelivered messages.',
              ],
            ].map(([term, def]) => (
              <div key={term} className="flex flex-col sm:flex-row sm:gap-4">
                <dt className="text-white font-semibold sm:w-44 shrink-0">{term}</dt>
                <dd className="text-slate-400">{def}</dd>
              </div>
            ))}
          </dl>
          <p className="text-slate-400 text-sm mt-5">
            We never share your mobile number or your consent to receive texts with third parties
            for their marketing. See our{' '}
            <Link
              href="/privacy"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link
              href="/terms"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Terms of Service
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Not a captain yet?</h2>
          <p className="text-slate-400 mb-6">
            Text submission is set up by your league administrator. If you captain a team and want
            it enabled, ask your admin, or{' '}
            <Link
              href="/signup"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              start a league of your own
            </Link>
            .
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 px-4 text-center text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} Pool League Manager. All rights reserved.{' '}
        <Link href="/privacy" className="hover:text-slate-400 transition-colors">
          Privacy Policy
        </Link>
        {' · '}
        <Link href="/terms" className="hover:text-slate-400 transition-colors">
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}
