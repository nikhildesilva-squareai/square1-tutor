import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Code2, Briefcase } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { JsonLd } from "@/components/seo/JsonLd";
import { CAREER_ROLES, WORK_ROLES, ROLES, type Role } from "@/lib/roles-directory";

const BASE = "https://www.square1ai.com";

export const metadata: Metadata = {
  title: "AI Roles Directory — What Each Job Actually Does",
  description:
    "A directory of the roles AI is reshaping. For each: what the job actually involves day to day, the skills it demands, and the curriculum that trains for it. Free, no signup.",
  alternates: { canonical: `${BASE}/roles` },
  openGraph: {
    title: "AI Roles Directory — Square 1 AI",
    description:
      "What each AI role actually does, the skills it demands, and how to train for it. No signup.",
    url: `${BASE}/roles`,
  },
};

function RoleCard({ role }: { role: Role }) {
  return (
    <Link
      href={`/roles/${role.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#CCE1FF] hover:shadow-lg"
    >
      <h3 className="text-base font-bold text-slate-900">{role.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{role.summary}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0056CE]">
        What this role does
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default function RolesDirectoryPage() {
  // ItemList so an answer engine reads this as ONE directory of N roles rather
  // than a page that happens to mention some job titles.
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${BASE}/roles#directory`,
    name: "AI Roles Directory",
    description:
      "Roles reshaped by AI: what each job involves, the skills it demands, and the curriculum that trains for it.",
    url: `${BASE}/roles`,
    numberOfItems: ROLES.length,
    itemListElement: ROLES.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.title,
      url: `${BASE}/roles/${r.slug}`,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Roles", item: `${BASE}/roles` },
    ],
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <JsonLd data={itemListLd} />
      <JsonLd data={breadcrumbLd} />

      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/login" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
          Sign in
        </Link>
      </header>

      <main id="main" className="flex-1 px-4 pb-16 sm:px-6">
        <section className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-2xl border border-[#D4F0FC] bg-[#ECF8FE] px-6 py-9 text-center sm:px-10">
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/40 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                AI roles directory
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                {ROLES.length} roles AI is reshaping — the ones you retrain into, and the
                ones you already have. For each: what the job actually involves, the
                skills it demands, and the curriculum that trains for it.
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Free to read. No signup.
              </p>
            </div>
          </div>
        </section>

        {/* ── Career lane ────────────────────────────────────────────────── */}
        <section className="mx-auto mt-12 max-w-6xl">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0056CE]">
              <Code2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Roles you train into</h2>
              <p className="text-sm text-slate-600">
                Technical roles reached by writing code and shipping real projects.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAREER_ROLES.map((r) => <RoleCard key={r.slug} role={r} />)}
          </div>
        </section>

        {/* ── Work lane ──────────────────────────────────────────────────── */}
        <section className="mx-auto mt-12 max-w-6xl">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#047857]">
              <Briefcase className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Roles you already have</h2>
              <p className="text-sm text-slate-600">
                Existing jobs, done better with AI. No code involved.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WORK_ROLES.map((r) => <RoleCard key={r.slug} role={r} />)}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#0056CE] px-6 py-8 sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Not sure which one fits you?
              </h2>
              <p className="mt-1.5 text-sm text-white/85">
                Five questions, about three minutes, no account. Get an honest starting point.
              </p>
            </div>
            <Link
              href="/diagnostic"
              className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#0056CE] shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Take the free skill check
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
