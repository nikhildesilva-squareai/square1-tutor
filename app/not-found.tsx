import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: "#050B14" }}>
      <div className="mb-8"><Logo variant="light" size="lg" /></div>
      <p className="text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold mb-3">404 · Not found</p>
      <h1 className="font-black text-white leading-[0.95] mb-4" style={{ fontSize: "clamp(40px,8vw,88px)", letterSpacing: "-0.03em" }}>
        This page took{" "}
        <span style={{ background: "linear-gradient(135deg,#3388FF,#A78BFA,#10B981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>a different path.</span>
      </h1>
      <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto mb-9">
        The page you&apos;re after doesn&apos;t exist or moved. Let&apos;s get you back to building proof.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
          Back to home
        </Link>
        <Link href="/diagnostic" className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-sm text-slate-200 border border-white/15 hover:bg-white/[0.06] transition-colors">
          Take the free skill check
        </Link>
      </div>
    </main>
  );
}
