"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { DIAG_SUBJECTS as SUBJECTS } from "@/lib/diagnostic";

export default function DiagnosticPage() {
  const router = useRouter();

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("subject");
    if (!slug) return;
    const match = SUBJECTS.find((s) => s.slug === slug);
    if (match) router.replace(`/diagnostic/${match.slug}`);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 50%,#F4F8FF 100%)" }}>
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Sign in</Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-3xl text-center animate-fade-in-up">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Free · 3 minutes · No signup
          </span>
          <h1 className="mt-4 mb-3 font-black tracking-tight text-slate-900 leading-[0.95]"
            style={{ fontSize: "clamp(32px,5vw,56px)" }}>
            Where do you stand?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-10">
            Pick the track you&apos;re aiming for. Five quick questions, an instant skill snapshot — no account needed.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SUBJECTS.map((s) => (
              <Link
                key={s.slug}
                href={`/diagnostic/${s.slug}`}
                className="group rounded-2xl p-4 border text-left transition-all hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${s.color}10 0%, #FFFFFF 70%)`,
                  borderColor: `${s.color}25`,
                }}
              >
                <span className="text-2xl">{s.icon}</span>
                <p className="mt-2 text-sm font-bold text-slate-900 leading-tight">{s.title}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: s.color }}>{s.role}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
