import type { Metadata } from "next";
import { Suspense } from "react";
import { SkillCheckClient } from "./SkillCheckClient";

// ═══════════════════════════════════════════════════════════════════════════════
// /skill-check — the DIRECT entry into the skill check. The landing page's CTAs
// point here so the first click puts question 1 on screen; the track choice is
// asked INSIDE the quiz frame as its own step (chips, one tap), never as a
// separate landing page. /diagnostic and /diagnostic/[subject] remain the
// SEO/organic entrances — this route exists for traffic we already convinced.
//
// Fully static: no cookies, no Supabase — the question bank ships in the client
// bundle (lib/diagnostic), so nothing here can force dynamic rendering.
// ═══════════════════════════════════════════════════════════════════════════════

export const metadata: Metadata = {
  title: "Free 3-minute AI skill check — Square 1 AI",
  description:
    "Answer a handful of quick questions and get an instant skill snapshot: your strengths, your gaps, and exactly what to learn next. Free, no account.",
  robots: { index: false }, // funnel entrance for warm traffic; the indexable versions live under /diagnostic
};

export default function SkillCheckPage() {
  return (
    <Suspense fallback={null}>
      <SkillCheckClient />
    </Suspense>
  );
}
