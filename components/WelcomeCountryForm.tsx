"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";
import { Logo } from "@/components/ui/logo";

// Required post-signup country step. Reached from the (app) layout gate whenever a
// signed-in student has no country yet, so it covers BOTH email/OTP and Google
// OAuth signups. Saves via /api/onboard (which already persists students.country).
export function WelcomeCountryForm() {
  const router = useRouter();
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country) {
      setError("Please select your country to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });
      if (!res.ok) throw new Error("save failed");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: `
          radial-gradient(ellipse 800px 500px at 20% 20%, rgba(0,86,206,0.08), transparent 60%),
          radial-gradient(ellipse 700px 500px at 80% 80%, rgba(14,165,233,0.06), transparent 60%),
          linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
        `,
      }}
    >
      <div className="w-full max-w-md mx-auto px-4 sm:px-0 py-10">
        <div
          className="relative rounded-3xl p-6 sm:p-8 bg-white"
          style={{ border: "1px solid #E2E8F0", boxShadow: "0 24px 64px rgba(15,28,49,0.12)" }}
        >
          <div className="flex flex-col items-center gap-3 mb-6">
            <Logo variant="dark" size="lg" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-slate-900">One quick thing</h1>
            <p className="text-sm text-slate-500 mt-1">
              Where are you based? This helps us tailor your experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="country"
                className="block text-[10px] font-medium text-slate-500 mb-1 uppercase tracking-wider"
              >
                Country
              </label>
              <select
                id="country"
                required
                value={country}
                onChange={(e) => { setCountry(e.target.value); setError(null); }}
                className="w-full h-11 px-3 rounded-lg text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 focus:border-brand transition-all"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
              >
                <option value="" disabled>Select your country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {error && (
              <div
                className="text-sm text-red-600 px-4 py-3 rounded-xl"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !country}
              className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ background: "linear-gradient(135deg, #0056CE, #01224F)", boxShadow: "0 8px 24px rgba(0,86,206,0.28)" }}
            >
              {loading ? "Saving..." : "Continue to your dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
