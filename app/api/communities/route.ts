import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findSeedingCandidates, seedCommunity, generateUniqueSlug } from "@/lib/community/seeding";
import { TemplateType } from "@/types/database";
import { NextResponse } from "next/server";

const VALID_TEMPLATES: TemplateType[] = ["project", "research", "company", "opensource", "cohort"];
// Categories shown in the create form + discovery filters.
// Keep in sync with CommunityCreationClient and CommunityDiscoveryClient.
const VALID_CATEGORIES = [
  "Music",
  "Design",
  "Business management",
  "Learn AI Tech",
  "IT & Software",
  "Finance & Accounting",
  "Sciences & Technology",
  "Sports",
];

/**
 * GET /api/communities
 * List communities with optional filtering
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const template = searchParams.get("template");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Start with base query
    let query = supabase
      .from("communities")
      .select(
        `
        id,
        name,
        slug,
        description,
        template_type,
        category,
        is_private,
        creator_id,
        icon_url,
        cover_url,
        created_at,
        updated_at,
        community_members(count)
      `,
        { count: "exact" }
      )
      .is("deleted_at", null) // Exclude soft-deleted communities
      .eq("is_private", false); // Only public communities in discovery

    // Filter by category
    if (category) {
      query = query.eq("category", category);
    }

    // Filter by template
    if (template) {
      query = query.eq("template_type", template);
    }

    // Search by name/description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Pagination
    query = query.order("created_at", { ascending: false }).limit(limit).range(offset, offset + limit - 1);

    const { data: communities, error, count } = await query;

    if (error) {
      console.error("Error fetching communities:", error);
      return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
    }

    // Transform response
    const enriched = communities?.map((c: any) => ({
      ...c,
      memberCount: c.community_members?.[0]?.count ?? 0,
      community_members: undefined, // Remove the nested array
    }));

    return NextResponse.json({
      communities: enriched,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/communities
 * Create a new community with auto-seeding
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, template_type, description, category, is_private, icon_url, cover_url } = body;

    // The primary create UI has no template picker; default to a learning
    // cohort when one isn't supplied (still honour a valid explicit value).
    const templateType: TemplateType = VALID_TEMPLATES.includes(template_type)
      ? template_type
      : "cohort";

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Community name is required" }, { status: 400 });
    }

    if (name.length > 60) {
      return NextResponse.json({ error: "Name must be 60 characters or less" }, { status: 400 });
    }

    if (description && description.length > 500) {
      return NextResponse.json({ error: "Description must be 500 characters or less" }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
    }

    // Get creator's community profile
    const { data: creatorProfile, error: profileError } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !creatorProfile) {
      return NextResponse.json({ error: "Community profile not found. Please refresh the page." }, { status: 500 });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(name);

    // Create community
    const { data: community, error: createError } = await supabase
      .from("communities")
      .insert({
        name,
        slug,
        description: description || null,
        template_type: templateType,
        category,
        is_private: is_private ?? false,
        creator_id: creatorProfile.id,
        icon_url: icon_url || null,
        cover_url: cover_url || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating community:", createError);
      return NextResponse.json({ error: "Failed to create community" }, { status: 500 });
    }

    // Add creator as member with role='creator'.
    // Service role: RLS only allows self-inserts with role='member'.
    const admin = createAdminClient();
    const { error: memberError } = await admin
      .from("community_members")
      .insert({
        community_id: community.id,
        profile_id: creatorProfile.id,
        role: "creator",
      });

    if (memberError) {
      console.error("Error adding creator as member:", memberError);
      // Continue anyway - community is created
    }

    // Find seeding candidates
    let seedCount = 0;
    if (!is_private) {
      // Only auto-seed public communities
      const candidateIds = await findSeedingCandidates({
        templateType: templateType,
        creatorId: creatorProfile.id,
        description,
      });

      if (candidateIds.length > 0) {
        const { added } = await seedCommunity(community.id, candidateIds);
        seedCount = added;
      }
    }

    return NextResponse.json(
      {
        community: {
          ...community,
          memberCount: 1 + seedCount, // Creator + seeded members
        },
        seeded: seedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
