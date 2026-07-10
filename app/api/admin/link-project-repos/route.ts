import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/link-project-repos
 * Links starter repositories to core projects
 */

interface ProjectRepoLink {
  title: string;
  url: string;
}

const REPO_LINKS: ProjectRepoLink[] = [
  {
    title: "Customer Service Agent",
    url: "https://github.com/nikhildesilva-squareai/agentic-customer-service",
  },
  {
    title: "Data Analysis Agent",
    url: "https://github.com/nikhildesilva-squareai/agentic-data-analyst",
  },
  {
    title: "Code Generation Assistant",
    url: "https://github.com/nikhildesilva-squareai/agentic-code-generator",
  },
  {
    title: "Task Automation Agent",
    url: "https://github.com/nikhildesilva-squareai/agentic-task-automation",
  },
  {
    title: "Research Assistant",
    url: "https://github.com/nikhildesilva-squareai/agentic-research-assistant",
  },
  {
    title: "Decision Support System",
    url: "https://github.com/nikhildesilva-squareai/agentic-decision-support",
  },
];

export async function POST(request: NextRequest) {
  try {
    const { createClient: createAdminAuthClient } = await import("@/lib/supabase/server");
    const adminAuthClient = await createAdminAuthClient();
    const { data: { user: adminUser } } = await adminAuthClient.auth.getUser();
    if (!isAdminEmail(adminUser?.email)) {
      return NextResponse.json(
        { error: "Unauthorized: admin email required" },
        { status: 403 }
      );
    }

    const db = createAdminClient();

    // Get the Agentic AI course
    const courseRes = await db
      .from("courses")
      .select("id")
      .eq("slug", "agentic-ai")
      .single();

    if (courseRes.error) {
      throw new Error(`Course not found: ${courseRes.error.message}`);
    }

    const courseId = courseRes.data.id;

    // Get first 6 projects
    const projectsRes = await db
      .from("projects")
      .select("id, title, order_index")
      .eq("course_id", courseId)
      .lte("order_index", 6)
      .order("order_index", { ascending: true });

    if (projectsRes.error) {
      throw new Error(`Projects query failed: ${projectsRes.error.message}`);
    }

    let linked = 0;

    // Link each project to its starter repo
    for (let i = 0; i < projectsRes.data.length; i++) {
      const project = projectsRes.data[i];
      const repoLink = REPO_LINKS[i];

      if (repoLink) {
        const updateRes = await db
          .from("projects")
          .update({
            starter_repo_url: repoLink.url,
          })
          .eq("id", project.id);

        if (updateRes.error) {
          throw new Error(
            `Failed to link ${repoLink.title}: ${updateRes.error.message}`
          );
        }

        linked++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully linked starter repositories to projects!",
      summary: {
        projectsLinked: linked,
        repos: REPO_LINKS.map((r) => ({
          title: r.title,
          url: r.url,
        })),
      },
    });
  } catch (error) {
    console.error("Error linking repos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
