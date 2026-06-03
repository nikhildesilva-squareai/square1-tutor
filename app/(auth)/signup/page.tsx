"use client";

/**
 * SIGNUP PAGE — Square1 Ai
 *
 * Compliance posture:
 * ───────────────────
 * - Essential Eight MFA: Email OTP = "something you have". OAuth = delegated
 *   identity via Google/Microsoft. Both satisfy the E8 MFA requirement.
 * - No passwords: eliminates credential stuffing, brute force, and password
 *   reuse attack surfaces entirely.
 * - Session management: Supabase handles JWT rotation + httpOnly cookies
 *   (SOC 2 session-token requirement).
 * - GDPR: Explicit consent checkbox required before email signup. OAuth
 *   signup: consent implied by action — note displayed below OAuth buttons.
 *   Consent timestamp stored via /api/onboard.
 * - Security headers (HSTS, CSP, X-Frame-Options, etc.) are enforced in
 *   next.config.ts — not duplicated here.
 * - OAuth tokens are handled server-side by Supabase; they never touch the
 *   client bundle.
 * - Input validation: Zod on all API inputs (server-side).
 * - Rate limiting: TODO — add Upstash rate limiter for production.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

const CODE_LENGTH = 6;

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "India",
  "Germany",
  "France",
  "Japan",
  "South Korea",
  "Brazil",
  "Singapore",
  "UAE",
  "Netherlands",
  "Sweden",
  "Switzerland",
  "Ireland",
  "Israel",
  "New Zealand",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Sri Lanka",
  "Pakistan",
  "Bangladesh",
  "Malaysia",
  "Philippines",
  "Indonesia",
  "Vietnam",
  "Mexico",
  "Other",
] as const;

/* ─── Brand SVG icons (inline — no external requests) ─────────────────────── */

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── Countdown timer ──────────────────────────────────────────────────── */

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCountdown]);

  /* ── OAuth handler (Google / Microsoft) ───────────────────────────────── */

  async function handleOAuth(provider: "google" | "azure") {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  /* ── Email OTP — send code ────────────────────────────────────────────── */

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();

    if (!gdprConsent) {
      setError(
        "Please accept the Privacy Policy and Terms of Service to continue.",
      );
      return;
    }
    if (!country) {
      setError("Please select your country.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setError(error.message);
    } else {
      // Store name + country temporarily for post-verify onboarding
      if (name.trim()) {
        localStorage.setItem("sq1_pending_name", name.trim());
      }
      if (country) {
        localStorage.setItem("sq1_pending_country", country);
      }
      setStep("otp");
      setDigits(Array(CODE_LENGTH).fill(""));
      setResendCountdown(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
    setLoading(false);
  }

  /* ── OTP — verify code ────────────────────────────────────────────────── */

  const handleVerify = useCallback(
    async (code: string) => {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error) {
        setError("Invalid or expired code. Please try again.");
        setDigits(Array(CODE_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        setLoading(false);
        return;
      }

      // Post-verify: onboard the student with name + country
      const pendingName = localStorage.getItem("sq1_pending_name");
      const pendingCountry = localStorage.getItem("sq1_pending_country");
      try {
        await fetch("/api/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pendingName ?? "",
            country: pendingCountry ?? "",
          }),
        });
        localStorage.removeItem("sq1_pending_name");
        localStorage.removeItem("sq1_pending_country");
      } catch {
        // Non-fatal — student record may already exist or will be created lazily
      }

      router.push("/dashboard");
      setLoading(false);
    },
    [email, router],
  );

  /* ── OTP digit helpers ────────────────────────────────────────────────── */

  function handleDigitChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);

    if (digit) {
      if (index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        const code = next.join("");
        if (code.length === CODE_LENGTH) handleVerify(code);
      }
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    setError(null);
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === CODE_LENGTH) handleVerify(pasted);
  }

  async function handleResend() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setError(error.message);
    } else {
      setDigits(Array(CODE_LENGTH).fill(""));
      setResendCountdown(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
    setLoading(false);
  }

  /* ── Shared input className ───────────────────────────────────────────── */

  const inputClass =
    "w-full h-12 px-4 rounded-xl border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors";

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.10)",
  };

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: "#050B14" }}
    >
      <div
        className="w-full max-w-md mx-auto rounded-3xl p-8 sm:p-10 border"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,28,49,0.6) 0%, rgba(8,18,32,0.4) 100%)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo variant="light" size="md" />
        </div>

        {/* ── Step 1: OAuth + Email form ──────────────────────────────────── */}
        {step === "email" && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white">
                Create your account
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Free forever. No credit card.
              </p>
            </div>

            {/* OAuth buttons */}
            <div className="space-y-3 mb-4">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white text-slate-800 font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GoogleIcon />
                Sign up with Google
              </button>

              <button
                type="button"
                onClick={() => handleOAuth("azure")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-[#2F2F2F] text-white font-semibold text-sm border border-white/10 hover:bg-[#404040] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MicrosoftIcon />
                Sign up with Microsoft
              </button>
            </div>

            {/* OAuth implied-consent note */}
            <p className="text-[11px] text-slate-500 text-center mb-6">
              By signing up, you agree to our{" "}
              <Link
                href="/privacy"
                className="text-slate-400 underline hover:text-white"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="text-slate-400 underline hover:text-white"
              >
                Terms of Service
              </Link>
              .
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                or sign up with email
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Email signup form */}
            <form onSubmit={handleSendCode} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* Country */}
              <div>
                <label
                  htmlFor="country"
                  className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide"
                >
                  Country
                </label>
                <select
                  id="country"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="" disabled>
                    Select your country
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* GDPR consent checkbox */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  id="gdpr"
                  type="checkbox"
                  required
                  checked={gdprConsent}
                  onChange={(e) => {
                    setGdprConsent(e.target.checked);
                    if (e.target.checked) setError(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-brand focus:ring-brand shrink-0 accent-[#0056CE]"
                />
                <label
                  htmlFor="gdpr"
                  className="text-xs text-slate-400 leading-relaxed"
                >
                  I agree to the{" "}
                  <Link
                    href="/privacy"
                    className="text-brand underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/terms"
                    className="text-brand underline"
                    target="_blank"
                  >
                    Terms of Service
                  </Link>
                  . I consent to Square1 Ai processing my data to provide the
                  learning platform as described in the Privacy Policy.
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-xl">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
              >
                Create account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-brand font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* ── Step 2: OTP code entry ─────────────────────────────────────── */}
        {step === "otp" && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white">
                Check your email
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                We sent a 6-digit code to{" "}
                <strong className="text-white">{email}</strong>.
                <br />
                Check your inbox (and spam folder).
              </p>
            </div>

            <div
              className="flex gap-2 mb-5 justify-center"
              onPaste={handlePaste}
            >
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={loading}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  className="w-12 h-14 rounded-xl border-2 text-center text-xl font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: digit
                      ? "var(--color-brand, #0056CE)"
                      : "rgba(255,255,255,0.10)",
                  }}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-xl mb-4">
                {error}
              </p>
            )}

            <Button
              onClick={() => {
                const code = digits.join("");
                if (code.length === CODE_LENGTH) handleVerify(code);
              }}
              disabled={digits.join("").length < CODE_LENGTH || loading}
              loading={loading}
              className="w-full"
              size="lg"
            >
              Verify &amp; start learning
            </Button>

            <div className="mt-6 flex flex-col items-center gap-3">
              {resendCountdown > 0 ? (
                <p className="text-xs text-slate-500">
                  Resend code in{" "}
                  <span className="font-semibold text-white">
                    {resendCountdown}s
                  </span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm text-brand hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              )}

              <button
                onClick={() => {
                  setStep("email");
                  setDigits(Array(CODE_LENGTH).fill(""));
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:text-white hover:underline"
              >
                Use a different email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
