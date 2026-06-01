"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

const CODE_LENGTH = 6;

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCountdown]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!gdprConsent) {
      setError("Please accept the Privacy Policy and Terms of Service to continue.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setError(error.message);
    } else {
      // Store name temporarily for post-verify onboarding
      if (name.trim()) {
        localStorage.setItem("sq1_pending_name", name.trim());
      }
      setStep("otp");
      setDigits(Array(CODE_LENGTH).fill(""));
      setResendCountdown(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
    setLoading(false);
  }

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

      // Post-verify: onboard the student with their name
      const pendingName = localStorage.getItem("sq1_pending_name");
      try {
        await fetch("/api/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: pendingName ?? "" }),
        });
        localStorage.removeItem("sq1_pending_name");
      } catch {
        // Non-fatal — student record may already exist or will be created lazily
      }

      router.push("/dashboard");
      setLoading(false);
    },
    [email, router]
  );

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

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
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

  const brandPanel = (
    <div className="hidden lg:flex lg:w-[480px] flex-col justify-between p-12 bg-brand-deep text-ink-on-dark">
      <div>
        <Logo variant="light" size="md" />
        <h1 className="mt-8 text-4xl font-bold leading-tight">
          Your learning
          <br />journey starts
          <br />here.
        </h1>
        <p className="mt-4 text-base text-[#94A3B8]">
          AI-powered personalised learning. Get assessed, get a plan, build 10+ real projects.
        </p>
      </div>

      <div className="space-y-5">
        {[
          { n: "01", label: "Take your assessment" },
          { n: "02", label: "Get your skill report" },
          { n: "03", label: "Follow your plan" },
          { n: "04", label: "Build real projects" },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-4">
            <span className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-xs font-bold text-brand-light shrink-0">
              {s.n}
            </span>
            <span className="text-sm text-[#94A3B8]">{s.label}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#475569]">
        © 2026 Square 1 AI · Personalised tech learning
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {brandPanel}

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-surface-soft">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo size="sm" />
          </div>

          {/* Step 1: Email + Name */}
          {step === "email" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-ink">Create your account</h2>
                <p className="text-sm text-ink-muted mt-1">
                  Free to start. No credit card required.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                {/* Name field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wide"
                  >
                    Your name <span className="text-ink-muted font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-border bg-surface text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>

                {/* Email field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wide"
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
                    className="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-border bg-surface text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>

                {/* GDPR consent checkbox */}
                <div className="flex items-start gap-3 pt-1">
                  <input
                    id="gdpr"
                    type="checkbox"
                    required
                    checked={gdprConsent}
                    onChange={(e) => setGdprConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand shrink-0"
                  />
                  <label htmlFor="gdpr" className="text-xs text-ink-secondary leading-relaxed">
                    I agree to the{" "}
                    <Link href="/privacy" className="text-brand underline" target="_blank">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/terms" className="text-brand underline" target="_blank">
                      Terms of Service
                    </Link>
                  </label>
                </div>

                {error && (
                  <p className="text-sm text-error bg-error-bg px-3 py-2 rounded-[var(--radius-md)]">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Create account →
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-ink-muted">
                We&apos;ll email you a one-time code. No spam, ever.
              </p>

              <p className="mt-4 text-center text-sm text-ink-secondary">
                Already have an account?{" "}
                <Link href="/login" className="text-brand font-semibold hover:underline">
                  Sign in →
                </Link>
              </p>
            </>
          )}

          {/* Step 2: OTP code entry */}
          {step === "otp" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-ink">Check your email</h2>
                <p className="text-sm text-ink-muted mt-1">
                  We sent a 6-digit code to{" "}
                  <strong className="text-ink">{email}</strong>.
                  <br />Check your inbox (and spam folder).
                </p>
              </div>

              <div className="flex gap-1.5 sm:gap-2 mb-5" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    disabled={loading}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className={[
                      "w-full aspect-[3/4] max-h-[56px] rounded-[var(--radius-md)] border-2 text-center text-lg sm:text-xl font-bold",
                      "bg-surface text-ink transition-all",
                      "focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      digit ? "border-brand" : "border-border",
                    ].join(" ")}
                  />
                ))}
              </div>

              {error && (
                <p className="text-sm text-error bg-error-bg px-3 py-2 rounded-[var(--radius-md)] mb-4">
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
                Verify &amp; start learning →
              </Button>

              <div className="mt-6 flex flex-col items-center gap-3">
                {resendCountdown > 0 ? (
                  <p className="text-xs text-ink-muted">
                    Resend code in{" "}
                    <span className="font-semibold text-ink">{resendCountdown}s</span>
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
                  className="text-xs text-ink-muted hover:text-ink hover:underline"
                >
                  Use a different email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
