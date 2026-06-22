import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { AIReadinessScore } from "@/components/business/AIReadinessScore";

export const metadata: Metadata = {
  title: "AI-Readiness Score — How ready is your team for the age of AI?",
  description:
    "A free 2-minute self-assessment: score your team's AI readiness across strategy, skills, tooling, adoption, output, and governance — and get a tailored rollout plan.",
  openGraph: {
    title: "Team AI-Readiness Score — Square 1 AI",
    description: "How ready is your team for the age of AI? Take the free 2-minute check and get a tailored plan.",
  },
};

export default function AIReadinessPage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 35%)" }}>
      <header className="flex items-center justify-between px-5 sm:px-10 py-5">
        <Link href="/business" aria-label="Back to Square 1 for Teams"><Logo variant="dark" size="md" /></Link>
        <Link href="/business" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">← For Teams</Link>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-6 pt-6 pb-20">
        <div className="text-center mb-8">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">Free · 2 minutes</span>
          <h1 className="mt-3 font-black tracking-tight text-slate-900 leading-[1.05]" style={{ fontSize: "clamp(28px,4.5vw,46px)", letterSpacing: "-0.02em" }}>
            How ready is your team for the{" "}
            <span style={{ background: "linear-gradient(135deg,#3388FF,#0056CE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>age of AI?</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            Six quick questions across strategy, skills, tooling, adoption, output, and governance. Get a score and a tailored next step — no sign-up to see your result.
          </p>
        </div>

        <AIReadinessScore />
      </main>
    </div>
  );
}
