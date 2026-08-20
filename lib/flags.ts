// Simple build-time feature flags.
//
// COMMUNITY_ENABLED: the Community section (discover / feed / posts / group
// chat / member DMs) is fully built but hidden for the initial launch to keep
// the student experience focused. Flip to `true` (one line) to bring it back â€”
// the nav links reappear and the /community routes stop redirecting. The
// separate Messages inbox (team thread + broadcasts) stays live either way.
export const COMMUNITY_ENABLED = false;

// BOOTCAMP_ENABLED: the Bootcamp product — six live 6-month cohort tracks with a
// weekly 30-minute 1-1, six gated projects and a recorded viva (docs/bootcamp-prd.md).
// A different product for a different buyer at a different price ($890 founding vs
// $19.90/mo), so it stays hidden until Cohort 1 opens: the six `bootcamps` rows and
// Cohort 1 are already seeded, and flipping this one line is what makes them
// reachable. Until then /bootcamp 404s and no nav entry appears.
//
// Turning this on is a PRICING and MARKETING decision, not an engineering one —
// it puts a $890 product in front of every visitor.
export const BOOTCAMP_ENABLED = false;

// STARTUP_SCHOOL_ENABLED: the founder programme that rides the bootcamp cohort
// spine. Referenced by the sidebar nav; kept off until the programme opens.
export const STARTUP_SCHOOL_ENABLED = false;

// COMPETITIONS_ENABLED: the competitions surface. Off, matching production —
// /competitions currently 404s and no nav entry appears.
export const COMPETITIONS_ENABLED = false;
