import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { BackPill } from "@/components/ui/back-pill";

export const metadata = {
  title: "Privacy Policy — Square 1 AI",
  description: "How Square 1 AI collects, uses, and protects your personal data. GDPR compliant.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Header */}
      <header className="bg-brand-deep px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo variant="light" size="sm" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-10 sm:py-12">
        <BackPill href="/" label="Back to home" className="mb-6" />
        <div className="bg-surface rounded-2xl border border-border shadow-[0_1px_2px_rgb(15_23_42_/_0.05)] p-10">
          <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">
            Legal
          </p>
          <h1 className="text-4xl font-bold text-ink mb-2">Privacy Policy</h1>
          <p className="text-sm text-ink-muted mb-10">Last updated: June 2026</p>

          <div className="prose prose-sm max-w-none text-ink-secondary space-y-8">

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">1. Who we are</h2>
              <p>
                Square 1 AI ("we", "us", "our") operates the Square 1 AI learning platform available
                at square1.ai. We are committed to protecting your personal data and complying with
                the General Data Protection Regulation (GDPR) and applicable privacy laws.
              </p>
              <p className="mt-3">
                For privacy matters, contact us at:{" "}
                <a href="mailto:privacy@square1.ai" className="text-brand hover:underline">
                  privacy@square1.ai
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">2. What data we collect</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Email address</strong> — used to authenticate you via magic link (OTP).
                  Required to use the platform.
                </li>
                <li>
                  <strong>Name</strong> — optional, used to personalise your experience and reports.
                </li>
                <li>
                  <strong>Assessment responses</strong> — your answers to assessment questions, used
                  to generate your skill report and personalised learning plan.
                </li>
                <li>
                  <strong>Lesson progress</strong> — which lessons, exercises, and projects you have
                  completed, used to track and adapt your curriculum.
                </li>
                <li>
                  <strong>Consent timestamp</strong> — the date and time you agreed to this policy,
                  stored for our GDPR records.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">3. How we use your data</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>To authenticate you and keep your account secure.</li>
                <li>To personalise your learning experience and generate skill reports.</li>
                <li>To track your progress and adapt the curriculum to your level.</li>
                <li>
                  To provide AI-powered grading and feedback on your exercises and projects
                  (responses are processed by Claude AI; no data is used to train AI models).
                </li>
                <li>To comply with our legal obligations.</li>
              </ul>
              <p className="mt-3">
                We do <strong>not</strong> sell your data. We do <strong>not</strong> use your data
                for advertising. We do <strong>not</strong> share your data with third parties
                except as described in section 5.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">4. Legal basis (GDPR)</h2>
              <p>
                We process your data under the following legal bases:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>
                  <strong>Contract performance</strong> — processing necessary to provide the
                  service you signed up for.
                </li>
                <li>
                  <strong>Consent</strong> — where you have given explicit consent (e.g., at
                  account creation).
                </li>
                <li>
                  <strong>Legitimate interests</strong> — for security monitoring and platform
                  improvements, balanced against your rights.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">5. Data storage and security</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Data is stored on <strong>Supabase</strong>, a PostgreSQL-based platform with
                  encryption at rest and TLS in transit.
                </li>
                <li>EU server regions are available. Contact us to request EU-only hosting.</li>
                <li>We use row-level security (RLS) policies so each user can only access their
                  own data.</li>
                <li>AI grading is performed via the Anthropic API. Responses are not stored by
                  Anthropic or used to train models under their API terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">6. Your rights (GDPR)</h2>
              <p>You have the following rights regarding your personal data:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Right of access</strong> — request a copy of all data we hold about you.</li>
                <li><strong>Right to rectification</strong> — correct inaccurate data.</li>
                <li><strong>Right to erasure</strong> ("right to be forgotten") — request deletion of your account and all associated data.</li>
                <li><strong>Right to data portability</strong> — receive your data in a structured, machine-readable format.</li>
                <li><strong>Right to object</strong> — object to processing based on legitimate interests.</li>
                <li><strong>Right to withdraw consent</strong> — withdraw consent at any time without affecting prior processing.</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, email{" "}
                <a href="mailto:privacy@square1.ai" className="text-brand hover:underline">
                  privacy@square1.ai
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">7. Cookies</h2>
              <p>
                <strong>Essential cookies</strong> are required for authentication (keeping you
                signed in) and are set by Supabase&apos;s authentication library. These are always on
                — without them you cannot log in.
              </p>
              <p className="mt-2">
                <strong>Analytics cookies (optional, off by default).</strong> If you choose
                &ldquo;Allow analytics&rdquo; in our cookie banner, we load{" "}
                <strong>Google Analytics</strong> to understand how the product is used — which
                lessons people finish, where they get stuck — so we can improve it. Google acts as
                our analytics provider and receives your IP address (truncated) and page-view data.
                We never load it until you opt in, and you can decline with one click.
              </p>
              <p className="mt-2">
                We do <strong>not</strong> use:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Advertising or ad-targeting cookies (no Meta pixel, no ad networks)</li>
                <li>Any cookie that profiles you across other websites</li>
              </ul>
              <p className="mt-3">
                We do not sell your data, and we do not share it with third parties for advertising.
                To change your choice, clear this site&apos;s cookies and site data in your browser
                and the banner will ask again.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">8. Data retention</h2>
              <p>
                We retain your data for as long as your account is active. If you request deletion,
                we will remove all personal data within 30 days, except where retention is required
                by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">9. Changes to this policy</h2>
              <p>
                We may update this policy from time to time. We will notify you by email of any
                material changes. Continued use of the platform after notification constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-3">10. Contact</h2>
              <p>
                For privacy questions or to exercise your rights:{" "}
                <a href="mailto:privacy@square1.ai" className="text-brand hover:underline">
                  privacy@square1.ai
                </a>
              </p>
              <p className="mt-2">
                You also have the right to lodge a complaint with your local data protection
                authority (e.g., the ICO in the UK, or your national DPA in the EU).
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 flex items-center justify-center gap-4 text-xs text-ink-muted">
        <BackPill href="/" label="Back to home" />
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
      </footer>
    </div>
  );
}
