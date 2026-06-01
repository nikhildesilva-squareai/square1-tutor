import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export const metadata = {
  title: "Terms of Service — Square 1 AI",
  description: "Terms of Service for the Square 1 AI learning platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Header */}
      <header className="bg-brand-deep px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo variant="light" size="sm" />
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-surface rounded-2xl border border-border shadow-[0_1px_2px_rgb(15_23_42_/_0.05)] p-10">
          <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">
            Legal
          </p>
          <h1 className="text-4xl font-bold text-ink mb-2">Terms of Service</h1>
          <p className="text-sm text-ink-muted mb-10">Last updated: June 2026</p>

          <div className="prose prose-sm max-w-none text-ink-secondary space-y-8">

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">1. Service description</h2>
              <p>
                Square 1 AI provides an AI-powered personalised tech education platform (the
                "Service") that includes skill assessments, adaptive learning plans, lesson
                content, AI-graded exercises, and project-based learning. The Service is provided
                by Square 1 AI ("we", "us", "our").
              </p>
              <p className="mt-3">
                By creating an account or using the Service, you agree to these Terms. If you do
                not agree, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">2. Eligibility</h2>
              <p>
                You must be at least 13 years old to use the Service. If you are under 18, you
                confirm that you have obtained consent from a parent or guardian.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">3. User obligations</h2>
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>
                  Provide accurate information when creating your account (email, name).
                </li>
                <li>
                  Keep your account credentials secure. Do not share your account with others —
                  each account is for a single individual.
                </li>
                <li>
                  Use the Service for lawful purposes only. You must not attempt to abuse,
                  hack, scrape, or reverse-engineer any part of the platform.
                </li>
                <li>
                  Not submit harmful, offensive, or illegal content through assessments, exercises,
                  or any input field.
                </li>
                <li>
                  Not attempt to manipulate or game the AI grading system.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">4. Intellectual property</h2>
              <p>
                All content on the platform — including lesson text, exercises, project briefs,
                AI-generated feedback, and branding — is the intellectual property of Square 1 AI
                or its licensors.
              </p>
              <p className="mt-3">
                You may use platform content for your personal learning only. You may not reproduce,
                distribute, sell, or sublicense any platform content without our written permission.
              </p>
              <p className="mt-3">
                <strong>Your work is yours.</strong> Projects you build and code you write remain
                your intellectual property. We claim no ownership over your submissions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">5. Account termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms,
                engage in abusive behaviour, or that have been inactive for more than 24 months.
              </p>
              <p className="mt-3">
                You may delete your account at any time by emailing{" "}
                <a href="mailto:privacy@square1.ai" className="text-brand hover:underline">
                  privacy@square1.ai
                </a>
                . Data deletion is subject to our{" "}
                <Link href="/privacy" className="text-brand hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">6. Limitation of liability</h2>
              <p>
                The Service is provided "as is" without warranties of any kind, express or implied.
                Square 1 AI does not guarantee that the Service will be error-free, uninterrupted,
                or that learning outcomes (including employment) will be achieved.
              </p>
              <p className="mt-3">
                To the maximum extent permitted by law, Square 1 AI&apos;s total liability to you
                for any claims arising from the use of the Service shall not exceed the amount you
                paid us in the 12 months preceding the claim.
              </p>
              <p className="mt-3">
                We are not liable for any indirect, incidental, special, or consequential damages,
                including loss of data, profits, or business opportunities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">7. Your GDPR rights</h2>
              <p>
                If you are located in the European Economic Area or United Kingdom, you have rights
                under GDPR including access, rectification, erasure, and portability of your
                personal data. Please see our{" "}
                <Link href="/privacy" className="text-brand hover:underline">
                  Privacy Policy
                </Link>{" "}
                for full details.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">8. Changes to these Terms</h2>
              <p>
                We may update these Terms from time to time. We will notify you by email of any
                material changes at least 14 days before they take effect. Continued use of the
                Service after the effective date constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">9. Governing law</h2>
              <p>
                These Terms are governed by the laws of England and Wales. Any disputes shall be
                subject to the exclusive jurisdiction of the courts of England and Wales, unless
                mandatory consumer protection laws in your country of residence require otherwise.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">10. Contact</h2>
              <p>
                For questions about these Terms:{" "}
                <a href="mailto:hello@square1.ai" className="text-brand hover:underline">
                  hello@square1.ai
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-xs text-ink-muted">
        <Link href="/" className="text-brand hover:underline">← Back to Square 1 AI</Link>
        <span className="mx-3">·</span>
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}
