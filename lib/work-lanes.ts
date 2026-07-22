// The no-code "AI for your work" role-track course slugs. Shared by server
// components (counts) and client components (lane rendering) — keep it a plain
// module (no "use client") so the Set survives the server/client boundary.
export const WORK_LANE_SLUGS = new Set([
  "ai-foundations", "ai-for-marketers", "ai-for-finance", "ai-for-creators",
  "ai-for-founders", "ai-for-teachers", "ai-for-project-managers", "ai-for-sales",
]);
