"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { REGIONS, S1_REGION_COOKIE, type RegionKey } from "@/lib/pricing";

// ═══════════════════════════════════════════════════════════════════════════════
// Region override for regional pricing. IP geolocation is a guess — VPNs,
// travellers, expats and corporate proxies all resolve wrongly — so the
// detected region must always be visible and changeable, never silently
// imposed. Writing the cookie client-side is enough: the proxy only sets the
// cookie when one is ABSENT, so a manual choice sticks (1 year).
//
// This changes the price DISPLAY only. Eligibility for the lower rate is
// re-checked at checkout against the payment method's country
// (verifyRegionAtCheckout in lib/pricing.ts).
// ═══════════════════════════════════════════════════════════════════════════════

export function RegionSelector({ region }: { region: RegionKey }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<RegionKey>(region);

  function choose(next: RegionKey) {
    if (next === value) return;
    setValue(next);
    // 1 year, site-wide. Same name the proxy reads, so this wins from now on.
    document.cookie = `${S1_REGION_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200"
        role="group"
        aria-label="Choose your pricing region"
      >
        <Globe className="h-3.5 w-3.5 ml-2 mr-0.5 text-slate-400" aria-hidden />
        {(Object.keys(REGIONS) as RegionKey[]).map((key) => {
          const active = key === value;
          return (
            <button
              key={key}
              type="button"
              onClick={() => choose(key)}
              aria-pressed={active}
              disabled={pending}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-60 ${
                active ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {REGIONS[key].label}
            </button>
          );
        })}
      </div>
      {/* Says only what is true TODAY. verifyRegionAtCheckout() exists but has no
          call sites yet (Stripe isn't live), so promising checkout verification
          here would be a claim the system doesn't currently honour. Restore the
          stronger wording when that function is actually wired. */}
      <p className="text-[11px] text-slate-400 text-center max-w-xs">
        Prices shown for your region. Regional rates require a payment method from that region.
      </p>
    </div>
  );
}
