import { createClient } from "@/lib/supabase/server";
import { TemplateType } from "@/types/database";

/**
 * Seeding algorithm: Find 20-50 relevant students to auto-add to a new community
 *
 * Matching criteria:
 * 1. Course overlap (if template matches enrolled courses)
 * 2. Skill tag match (from competency report)
 * 3. Recency (recently active students)
 *
 * Returns: Array of profile IDs ranked by relevance score
 */

interface SeedingOptions {
  templateType: TemplateType;
  creatorId: string; // Don't include creator in seed
  description?: string; // Can extract keywords for matching
}

interface ScoredProfile {
  profileId: string;
  score: number;
  courseMatch: number;
  skillMatch: number;
  recencyScore: number;
}

const COURSE_KEYWORDS: Record<string, string[]> = {
  generative_ai: ["generative", "ai", "llm", "gpt", "prompt"],
  machine_learning: ["machine", "learning", "ml", "model", "regression", "classification"],
  data_science: ["data", "science", "pandas", "analysis", "statistics"],
  cybersecurity: ["security", "cyber", "encryption", "attack", "defense"],
  fullstack_development: ["fullstack", "web", "frontend", "backend", "react", "node"],
  computer_vision: ["vision", "cv", "image", "detection", "opencv"],
  llm_agent_architect: ["agent", "llm", "autonomous", "reasoning"],
  devops_engineering: ["devops", "docker", "kubernetes", "ci", "cd"],
  ai_product_management: ["product", "pm", "management", "strategy"],
};

const TEMPLATE_COURSE_PREFERENCE: Record<TemplateType, string[]> = {
  project: ["generative_ai", "data_science", "machine_learning", "computer_vision"],
  research: ["machine_learning", "data_science", "llm_agent_architect"],
  company: [], // No specific course preference
  opensource: ["fullstack_development", "devops_engineering"],
  cohort: [], // General learning group
};

/**
 * Calculate relevance score for seeding
 * Score components:
 * - Course match: 0.4 weight
 * - Skill match: 0.3 weight
 * - Recency: 0.2 weight
 * - Activity level: 0.1 weight
 */
async function scoreProfile(
  profile: { id: string; student_id: string; created_at: string },
  options: SeedingOptions
): Promise<ScoredProfile> {
  const supabase = await createClient();

  // Get student enrollments
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("course_id")
    .eq("student_id", profile.student_id)
    .eq("status", "active");

  // Get enrolled course IDs
  const courseIds = enrollments?.map((e) => e.course_id) ?? [];

  // Get course titles to match against template preference
  let courseMatch = 0;
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from("courses")
      .select("slug")
      .in("id", courseIds);

    const slugs = courses?.map((c) => c.slug) ?? [];
    const preferredCourses = TEMPLATE_COURSE_PREFERENCE[options.templateType];

    if (preferredCourses.length > 0) {
      const matches = slugs.filter((slug) => preferredCourses.includes(slug)).length;
      courseMatch = Math.min(1, matches / preferredCourses.length); // 0-1
    }
  }

  // Get completed projects (skill proxy)
  const { data: submissions } = await supabase
    .from("project_submissions")
    .select("score")
    .eq("student_id", profile.student_id)
    .not("score", "is", null);

  // Count completed projects as skill indicator
  const completedProjects = submissions?.length ?? 0;
  const skillMatch = Math.min(1, completedProjects / 10); // Normalize: 10+ projects = max score

  // Recency score (created within last 6 months = higher score)
  const createdDate = new Date(profile.created_at);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recencyScore = createdDate > sixMonthsAgo ? 1 : 0.5;

  // Activity level (message count, submission count, etc.)
  const activityLevel = submissions ? Math.min(1, submissions.length / 20) : 0;

  // Weighted score
  const score = courseMatch * 0.4 + skillMatch * 0.3 + recencyScore * 0.2 + activityLevel * 0.1;

  return {
    profileId: profile.id,
    score,
    courseMatch,
    skillMatch,
    recencyScore,
  };
}

/**
 * Find relevant students for seeding
 * Returns 20-50 profile IDs ranked by relevance
 */
export async function findSeedingCandidates(
  options: SeedingOptions
): Promise<string[]> {
  const supabase = await createClient();

  // Fetch all community profiles except creator
  const { data: profiles } = await supabase
    .from("community_profiles")
    .select("id, student_id, created_at")
    .neq("id", options.creatorId)
    .limit(500); // Fetch 500 to score from

  if (!profiles || profiles.length === 0) {
    return [];
  }

  // Score each profile
  const scoredProfiles: ScoredProfile[] = [];
  for (const profile of profiles) {
    const scored = await scoreProfile(profile, options);
    // Filter out profiles with very low scores
    if (scored.score > 0.1) {
      scoredProfiles.push(scored);
    }
  }

  // Sort by score descending
  scoredProfiles.sort((a, b) => b.score - a.score);

  // Take 20-50 top candidates (prefer 30 as baseline)
  const targetCount = Math.min(50, Math.max(20, Math.round(profiles.length * 0.15)));
  const selectedProfiles = scoredProfiles.slice(0, targetCount);

  return selectedProfiles.map((p) => p.profileId);
}

/**
 * Add multiple profiles to a community as members
 * Used for seeding during community creation
 */
export async function seedCommunity(
  communityId: string,
  profileIds: string[]
): Promise<{ added: number; failed: number }> {
  const supabase = await createClient();

  let added = 0;
  let failed = 0;

  // Insert members in batches to avoid hitting query limits
  const batchSize = 50;
  for (let i = 0; i < profileIds.length; i += batchSize) {
    const batch = profileIds.slice(i, i + batchSize);
    const memberships = batch.map((profileId) => ({
      community_id: communityId,
      profile_id: profileId,
      role: "member" as const,
    }));

    const { error } = await supabase
      .from("community_members")
      .insert(memberships);

    if (error) {
      failed += batch.length;
      console.error(`Error seeding community batch ${i / batchSize}:`, error);
    } else {
      added += batch.length;
    }
  }

  // Also insert into community_invites to track that these were auto-added
  const invites = profileIds.map((profileId) => ({
    community_id: communityId,
    profile_id: profileId,
    invited_by: null, // NULL = auto-added
    invite_status: "auto_added" as const,
  }));

  const { error: inviteError } = await supabase
    .from("community_invites")
    .insert(invites);

  if (inviteError) {
    console.error("Error inserting community invites:", inviteError);
  }

  return { added, failed };
}

/**
 * Generate a URL-safe slug from community name
 * Example: "AI Ethics Book Club" → "ai-ethics-book-club"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // Trim hyphens from edges
}

/**
 * Check if slug is unique in the database
 */
export async function isSlugUnique(slug: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("communities")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);

  return !data || data.length === 0;
}

/**
 * Generate a unique slug by appending numbers if necessary
 */
export async function generateUniqueSlug(baseName: string): Promise<string> {
  let slug = generateSlug(baseName);
  let counter = 1;
  const maxAttempts = 100;

  while (!(await isSlugUnique(slug)) && counter < maxAttempts) {
    slug = `${generateSlug(baseName)}-${counter}`;
    counter++;
  }

  if (counter >= maxAttempts) {
    // Fallback: use timestamp
    slug = `${generateSlug(baseName)}-${Date.now()}`;
  }

  return slug;
}
