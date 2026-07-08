"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error]", error);
    // Forward to the server so the real message + stack land in our logs
    // (client render errors otherwise only appear in the browser console).
    try {
      const body = JSON.stringify({
        path: typeof window !== "undefined" ? window.location.pathname : "",
        message: error?.message ?? String(error),
        stack: error?.stack ?? "",
        digest: error?.digest ?? "",
      });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
      else void fetch("/api/client-error", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    } catch { /* never block the error UI */ }
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-white">
      <div className="mb-8"><Logo variant="dark" size="lg" /></div>
      <p className="text-[11px] tracking-[0.35em] uppercase text-brand font-bold mb-3">Something went wrong</p>
      <h1 className="font-black text-slate-900 leading-[0.98] mb-4" style={{ fontSize: "clamp(32px,6vw,64px)", letterSpacing: "-0.03em" }}>
        That&apos;s on us, not you.
      </h1>
      <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-9">
        Something broke while loading this page. Try again — and if it keeps happening, it&apos;s logged on our side.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={reset} className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(135deg,#0056CE,#01224F)", boxShadow: "0 12px 32px rgba(0,86,206,0.28)" }}>
          Try again
        </button>
        <Link href="/" className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-sm text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors">
          Back to home
        </Link>
      </div>
      {error?.digest && <p className="mt-6 text-[10px] text-slate-400 font-mono">ref: {error.digest}</p>}
    </main>
  );
}
