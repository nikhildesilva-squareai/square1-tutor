"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  ExternalLink,
  Check,
  X as XIcon,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import {
  TOOLS,
  ROLES,
  PRICING_TIERS,
  PRICING_NOTE,
  TOOL_COUNT,
  type Pricing,
  type RoleKey,
} from "@/lib/tools-directory";

const PRICING_STYLE: Record<Pricing, { bg: string; fg: string; border: string }> = {
  Free: { bg: "#ECFDF5", fg: "#047857", border: "#A7F3D0" },
  Freemium: { bg: "#EFF6FF", fg: "#0056CE", border: "#BFDBFE" },
  Paid: { bg: "#FEF3F2", fg: "#B42318", border: "#FECDCA" },
};

type RoleFilter = RoleKey | "all";
type PricingFilter = Pricing | "all";

export default function ToolsDirectoryPage() {
  const [role, setRole] = useState<RoleFilter>("all");
  const [pricing, setPricing] = useState<PricingFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (role !== "all" && t.role !== role) return false;
      if (pricing !== "all" && t.pricing !== pricing) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.what.toLowerCase().includes(q) ||
        t.useFor.toLowerCase().includes(q)
      );
    });
  }, [role, pricing, query]);

  const activeRole = ROLES.find((r) => r.key === role);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/login" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
          Sign in
        </Link>
      </header>

      <main className="flex-1 px-4 pb-16 sm:px-6">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-2xl border border-[#D4F0FC] bg-[#ECF8FE] px-6 py-8 text-center sm:px-10 sm:py-9">
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/40 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CCE1FF] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0056CE]">
                <Sparkles className="h-3.5 w-3.5" />
                {TOOL_COUNT} tools · curated · no affiliate links
              </span>
              <h1 className="mt-4 text-[26px] font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-[32px]">
                AI tools for your work
              </h1>
              <p className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed text-slate-500 sm:text-[15px]">
                Not a list of 1,300 tools you&apos;ll never open. A short, opinionated pick per role —
                with the one thing other directories skip: <span className="font-semibold text-slate-700">when to use it, and when not to.</span>
              </p>

              <div className="relative mx-auto mt-6 max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <label htmlFor="tool-search" className="sr-only">Search tools</label>
                <input
                  id="tool-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tools — e.g. meeting notes, spreadsheets"
                  className="h-11 w-full rounded-xl border border-[#D4F0FC] bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-[#0056CE] focus:ring-4 focus:ring-[#0056CE]/15"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <section className="mx-auto mt-6 max-w-6xl">
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterPill active={role === "all"} onClick={() => setRole("all")}>All roles</FilterPill>
            {ROLES.map((r) => (
              <FilterPill key={r.key} active={role === r.key} onClick={() => setRole(r.key)}>
                {r.label}
              </FilterPill>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold text-slate-400">Pricing</span>
            <FilterPill small active={pricing === "all"} onClick={() => setPricing("all")}>Any</FilterPill>
            {PRICING_TIERS.map((p) => (
              <FilterPill key={p} small active={pricing === p} onClick={() => setPricing(p)}>
                {p}
              </FilterPill>
            ))}
          </div>
          {activeRole && (
            <p className="mt-3 text-sm text-slate-500">{activeRole.blurb}</p>
          )}
        </section>

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        <section className="mx-auto mt-4 max-w-6xl">
          <p className="mb-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{filtered.length}</span> {filtered.length === 1 ? "tool" : "tools"}
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => {
                const ps = PRICING_STYLE[t.pricing];
                return (
                  <article
                    key={t.name}
                    className="flex flex-col rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_1px_2px_rgba(21,47,84,0.04)] transition-all hover:border-[#D8E2ED] hover:shadow-[0_14px_26px_-12px_rgba(21,47,84,0.16)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4482E5] to-[#075BCC] text-sm font-bold text-white">
                        {t.name.replace(/^Copilot (in|for) /i, "").trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-[15px] font-bold leading-snug text-slate-900">{t.name}</h3>
                          {t.featured && (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-[#FFF7ED] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#C2410C]">
                              Start here
                            </span>
                          )}
                        </div>
                        <span
                          className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: ps.bg, color: ps.fg, border: `1px solid ${ps.border}` }}
                        >
                          {t.pricing}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{t.what}</p>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <p className="text-[12.5px] leading-snug text-slate-600">
                          <span className="font-semibold text-slate-700">Use it for:</span> {t.useFor}
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <XIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                        <p className="text-[12.5px] leading-snug text-slate-600">
                          <span className="font-semibold text-slate-700">Don&apos;t:</span> {t.avoid}
                        </p>
                      </div>
                    </div>

                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-[#0056CE] hover:underline"
                    >
                      Visit site
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#D8E2ED] bg-[#F8FAFC] px-6 py-16 text-center">
              <Search className="h-9 w-9 text-slate-400" />
              <p className="text-base font-bold text-slate-900">No tools match your filters</p>
              <button
                onClick={() => { setQuery(""); setRole("all"); setPricing("all"); }}
                className="text-sm font-semibold text-[#0056CE] hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* ── Funnel CTA ───────────────────────────────────────────────── */}
        <section className="mx-auto mt-8 max-w-6xl">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#0056CE] px-6 py-8 text-center sm:px-10">
            <div className="relative mx-auto max-w-xl">
              <h2 className="text-[20px] font-bold leading-tight text-white sm:text-[24px]">
                A tool is only as good as the person prompting it.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/70">
                Your company already pays for most of these. Learn to actually get value from them —
                plain-English prompting, no code, graded by our AI tutor.
              </p>
              <Link
                href="/signup"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0A2540] transition-transform hover:-translate-y-0.5"
              >
                Start learning free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-slate-400">
            {PRICING_NOTE}
          </p>
        </section>
      </main>
    </div>
  );
}

function FilterPill({
  active,
  small,
  onClick,
  children,
}: {
  active: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full font-semibold transition-colors",
        small ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-[13px]",
        active
          ? "bg-[#0056CE] text-white"
          : "border border-[#E2E8F0] bg-white text-slate-600 hover:border-[#CBD5E1] hover:text-slate-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
