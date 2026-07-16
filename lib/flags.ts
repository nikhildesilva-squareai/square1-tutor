// Simple build-time feature flags.
//
// COMMUNITY_ENABLED: the Community section (discover / feed / posts / group
// chat / member DMs) is fully built but hidden for the initial launch to keep
// the student experience focused. Flip to `true` (one line) to bring it back —
// the nav links reappear and the /community routes stop redirecting. The
// separate Messages inbox (team thread + broadcasts) stays live either way.
export const COMMUNITY_ENABLED = false;
