// ═══════════════════════════════════════════════════════════════════════════════
// ONE readiness model (UX review R1) — the single source of truth for the
// student's global level, consumed by BOTH /portfolio (the tier bar) and
// /career (shown beside the per-job-posting %). Before this, the two pages
// computed different scales from the same graded record and could disagree.
//
// The scale is the portfolio bar's: Foundation → Junior → Mid → Senior → Lead.
// Volume gates matter: one lucky 95% project is not "Senior" — the tier needs
// both quality (avg score) and a body of graded work behind it. Measured
// inputs only; a tier can never be bought or self-reported.
//
// NOTE: /career's gap-map percentage is a DIFFERENT number on purpose — it is
// per-job-posting readiness against specific requirements. The global tier
// answers "where am I overall?"; the gap map answers "how ready am I for THIS
// role?". Both surfaces now say so explicitly.
// ═══════════════════════════════════════════════════════════════════════════════

export const READINESS_TIERS = ["Foundation", "Junior", "Mid", "Senior", "Lead"] as const;
export type ReadinessTierLabel = (typeof READINESS_TIERS)[number];

export interface Readiness {
  /** 1-based index into READINESS_TIERS. */
  tier: 1 | 2 | 3 | 4 | 5;
  label: ReadinessTierLabel;
  /** What earns the NEXT tier — always concrete, never vague. Null at Lead. */
  next: string | null;
}

export function computeReadiness(avgScorePct: number, gradedProjects: number): Readiness {
  if (avgScorePct >= 90 && gradedProjects >= 6) {
    return { tier: 5, label: "Lead", next: null };
  }
  if (avgScorePct >= 85 && gradedProjects >= 4) {
    return {
      tier: 4, label: "Senior",
      next: `Lead needs a 90%+ average across 6+ graded projects (you have ${gradedProjects}).`,
    };
  }
  if (avgScorePct >= 75 && gradedProjects >= 2) {
    return {
      tier: 3, label: "Mid",
      next: `Senior needs an 85%+ average across 4+ graded projects (you have ${gradedProjects}).`,
    };
  }
  if (avgScorePct >= 60 && gradedProjects >= 1) {
    return {
      tier: 2, label: "Junior",
      next: `Mid needs a 75%+ average across 2+ graded projects (you have ${gradedProjects}).`,
    };
  }
  return {
    tier: 1, label: "Foundation",
    next: gradedProjects === 0
      ? "Junior starts with your first graded project scoring 60%+."
      : "Junior needs a 60%+ average on your graded projects — resubmit to raise a score.",
  };
}
