"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Shared B2B sign-in — Google (the reliable path: it's the configured, working
// provider) with email 6-digit code as a fallback. Microsoft/Azure is NOT
// enabled in Supabase, so it's deliberately omitted (a button that errors is
// worse than no button).
//  - Google redirects out and back to `next` via /api/auth/callback.
//  - Email OTP verifies in place, then calls onAuthed() so the page advances
//    without a full reload. (Email delivery depends on Supabase SMTP config.)
// ─────────────────────────────────────────────────────────────────────────────

const CODE_LENGTH = 6;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function TeamSignIn({ next, onAuthed }: { next: string; onAuthed: () => void }) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resend, setResend] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resend <= 0) return;
    const id = setInterval(() => setResend((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resend]);

  async function signInWithGoogle() {
    setLoading(true); setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await createClient().auth.signInWithOtp({ email });
    if (error) setError(error.message);
    else { setStep("otp"); setDigits(Array(CODE_LENGTH).fill("")); setResend(60); setTimeout(() => refs.current[0]?.focus(), 50); }
    setLoading(false);
  }

  const verify = useCallback(async (code: string) => {
    setLoading(true); setError(null);
    const { error } = await createClient().auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      setError("Invalid or expired code. Try again.");
      setDigits(Array(CODE_LENGTH).fill("")); setTimeout(() => refs.current[0]?.focus(), 50); setLoading(false);
    } else {
      onAuthed();
    }
  }, [email, onAuthed]);

  function onDigit(i: number, raw: string) {
    const d = raw.replace(/\D/g, "").slice(-1);
    const n = [...digits]; n[i] = d; setDigits(n); setError(null);
    if (d) {
      if (i < CODE_LENGTH - 1) refs.current[i + 1]?.focus();
      else { const code = n.join(""); if (code.length === CODE_LENGTH) verify(code); }
    }
  }
  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[i]) { const n = [...digits]; n[i] = ""; setDigits(n); }
      else if (i > 0) refs.current[i - 1]?.focus();
    }
  }
  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!p) return;
    const n = Array(CODE_LENGTH).fill(""); p.split("").forEach((c, i) => (n[i] = c)); setDigits(n); setError(null);
    if (p.length === CODE_LENGTH) verify(p);
    else refs.current[Math.min(p.length, CODE_LENGTH - 1)]?.focus();
  }
  async function resendCode() {
    setLoading(true); setError(null);
    const { error } = await createClient().auth.signInWithOtp({ email });
    if (error) setError(error.message);
    else { setDigits(Array(CODE_LENGTH).fill("")); setResend(60); }
    setLoading(false);
  }

  if (step === "otp") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
        <p className="text-sm text-slate-600 mb-1">Enter the 6-digit code sent to</p>
        <p className="text-sm font-bold text-slate-900 mb-5 break-all">{email}</p>
        <div className="flex gap-2 justify-center mb-4" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1} value={d} disabled={loading}
              onChange={(e) => onDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} onFocus={(e) => e.target.select()}
              className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl text-center text-lg font-bold text-slate-900 border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus:border-brand disabled:opacity-50"
            />
          ))}
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          onClick={() => { const c = digits.join(""); if (c.length === CODE_LENGTH) verify(c); }}
          disabled={digits.join("").length < CODE_LENGTH || loading}
          className="w-full h-12 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:-translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)" }}>
          {loading ? "Verifying…" : "Verify code"}
        </button>
        <div className="mt-4 flex flex-col items-center gap-2">
          {resend > 0
            ? <p className="text-xs text-slate-500">Resend code in {resend}s</p>
            : <button onClick={resendCode} disabled={loading} className="text-sm text-brand font-semibold hover:underline disabled:opacity-50">Resend code</button>}
          <button onClick={() => { setStep("email"); setError(null); }} className="text-xs text-slate-500 hover:text-slate-700 hover:underline">Use a different email</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <button onClick={signInWithGoogle} disabled={loading}
        className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-sm hover:bg-slate-50 transition-all disabled:opacity-50 mb-1.5">
        <GoogleIcon /> Continue with Google
      </button>
      <p className="text-[11px] text-slate-500 text-center mb-5">Fastest — most teams sign in this way.</p>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">or use your work email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={sendCode} className="space-y-3">
        <input
          type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full h-12 px-4 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus:border-brand"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:-translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)" }}>
          {loading ? "Sending…" : "Email me a code"}
        </button>
      </form>
    </div>
  );
}
