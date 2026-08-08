// The no-code "AI for your work" role-track course slugs. Shared by server
// components (counts) and client components (lane rendering) — keep it a plain
// module (no "use client") so the Set survives the server/client boundary.
export const WORK_LANE_SLUGS = new Set([
  "ai-for-marketers", "ai-for-finance", "ai-for-creators",
  "ai-for-founders", "ai-for-teachers", "ai-for-project-managers", "ai-for-sales",
  "ai-for-operations", "ai-for-students",
]);

/**
 * Courses that exist as a course row but must NOT appear as a standalone track
 * in any catalogue or lane.
 *
 * AI Foundations is now shipped as a free module inside 23 courses (the block at
 * order_index -1), so listing it as its own track sells something every student
 * already has. It still exists as the canonical course that those copies are
 * synced from — see square1-content/ai-foundations/sync_foundations_module.sql.
 *
 * Excluded explicitly rather than by dropping it from WORK_LANE_SLUGS: the
 * engineering lane is "everything not in the work lane", so removing it from one
 * set alone would silently promote a beginner prompting course into the
 * engineering career tracks.
 */
export const CATALOG_HIDDEN_SLUGS = new Set(["ai-foundations"]);
