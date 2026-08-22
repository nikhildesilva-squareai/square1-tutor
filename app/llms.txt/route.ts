import { DIAG_SUBJECTS, SUBJECT_SEO } from "@/lib/diagnostic";
import { RESEARCH_ARTICLES } from "@/lib/research";
import { CAREER_ROLES, WORK_ROLES, ROLES } from "@/lib/roles-directory";
import { createAdminClient } from "@/lib/supabase/admin";

// ═══════════════════════════════════════════════════════════════════════════════
// /llms.txt — the AI-crawler-facing map of the site.
//
// Answer engines (ChatGPT Search, Perplexity, Claude, AI Overviews) read this
// to work out what the site IS and which URLs are worth fetching, without
// having to infer it from a 350KB marketing page. Sibling of sitemap.xml: the
// sitemap says "these URLs exist", this says "here's what they mean".
//
// Everything below is generated from the same sources the pages themselves
// render from — courses/news from the DB, skill checks from lib/diagnostic,
// research from lib/research. Nothing is hand-maintained, so it cannot drift.
// ═══════════════════════════════════════════════════════════════════════════════

const BASE = "https://www.square1ai.com";

// Cheap page, changes only when content does. Revalidate hourly so a newly
// published article shows up without a deploy.
export const revalidate = 3600;

type CourseRow = {
  slug: string;
  title: string;
  description: string | null;
  total_lessons: number | null;
  total_projects: number | null;
};

export async function GET() {
  const admin = createAdminClient();

  // Active, top-level courses only — the same filter the landing grid uses, so
  // llms.txt never advertises a course the site won't show.
  let courses: CourseRow[] = [];
  try {
    const { data } = await admin
      .from("courses")
      .select("slug, title, description, total_lessons, total_projects")
      .is("parent_course_id", null)
      .eq("status", "active")
      .not("slug", "in", "(game-development,drone-technology,devops-engineering)")
      .order("title");
    courses = data ?? [];
  } catch (e) {
    console.error("[llms.txt] courses skipped:", e);
  }

  let news: { slug: string; headline: string; published_at: string | null }[] = [];
  try {
    const { data } = await admin
      .from("news_articles")
      .select("slug, headline, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50);
    news = data ?? [];
  } catch (e) {
    console.error("[llms.txt] news skipped:", e);
  }

  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push("# Square 1 AI");
  push();
  push(
    "> An AI education platform with two lanes. The career lane trains people " +
      "for AI engineering roles through code and deployed projects. The work lane " +
      "teaches non-technical professionals to use AI well in the job they already " +
      "have — no code. Every exercise, project and assessment is graded by Nova, " +
      "the platform's AI tutor, against a published rubric."
  );
  push();
  push("Key facts:");
  push();
  push("- Format: 100% text and code, zero video lectures. Roughly 45 minutes a day, self-paced.");
  push("- Grading: AI-graded exercises, projects and code review against per-project rubrics — not multiple-choice quizzes alone.");
  push("- Output: deployed projects with live URLs plus a verified skill report, rather than a completion certificate alone.");
  push("- Entry point: a free 5-question skill check per subject, ungated at /diagnostic — no email or account needed to take it or to see the result. The /skill-check entrance asks for an email address and country, or a one-tap Google sign-in, before starting; the email path creates no account or password, and nothing anywhere asks for payment.");
  push(`- Courses currently live: ${courses.length}.`);
  push("- Based in Australia. Regional pricing applies; see the pricing section on the homepage.");
  push();

  push("## Start here");
  push();
  push(`- [Home](${BASE}/): what the platform is, the two lanes, pricing and FAQ.`);
  push(`- [About](${BASE}/about): the company, the eight-part roadmap and what is live versus planned.`);
  push(`- [Courses](${BASE}/courses): the full catalogue, with every module and lesson title public.`);
  push(`- [Skill checks](${BASE}/diagnostic): free 3-minute diagnostics, one per subject. No email or account required to take one or to read the result.`);
  push(`- [AI roles directory](${BASE}/roles): what each AI-affected role actually does, the skills it needs, and the curriculum that trains for it.`);
  push(`- [For teams](${BASE}/business): the B2B offer — seats, manager portal, team skill reporting.`);
  push(`- [AI tools directory](${BASE}/tools): curated AI tools by role, with guidance on when NOT to use each. No affiliate links.`);
  push(`- [Contact](${BASE}/contact)`);
  push();

  if (courses.length) {
    push("## Courses");
    push();
    push(
      `Each course maps to a named role. The full curriculum — every module and ` +
        `lesson title — is public at /courses/{slug}; the first lesson is readable ` +
        `in full at /try/{slug}; a free skill check for the same subject is at ` +
        `/diagnostic/{slug}. Only lesson bodies beyond the first require an ` +
        `account. Index: ${BASE}/courses`
    );
    push();
    for (const c of courses) {
      const size = [
        c.total_lessons ? `${c.total_lessons} lessons` : null,
        c.total_projects ? `${c.total_projects} projects` : null,
      ]
        .filter(Boolean)
        .join(", ");
      const blurb = (c.description ?? "").replace(/\s+/g, " ").trim();
      push(`- [${c.title}](${BASE}/courses/${c.slug})${size ? ` — ${size}.` : ""}${blurb ? ` ${blurb}` : ""}`);
    }
    push();
  }

  push("## Roles");
  push();
  push(
    `What each role does day to day, the skills it demands, and the track that ` +
      `trains for it. Skills on each page are the real curriculum modules, not a ` +
      `generic list. ${ROLES.length} roles. Index: ${BASE}/roles`
  );
  push();
  push("Technical roles (involve code):");
  push();
  for (const r of CAREER_ROLES) {
    push(`- [${r.title}](${BASE}/roles/${r.slug}) — ${r.summary}`);
  }
  push();
  push("Existing roles, done better with AI (no code):");
  push();
  for (const r of WORK_ROLES) {
    push(`- [${r.title}](${BASE}/roles/${r.slug}) — ${r.summary}`);
  }
  push();

  push("## Skill checks");
  push();
  push("Five questions, instant result, free. No email or account needed at these /diagnostic addresses; an email is optional afterwards if you want the report sent to you. One per subject:");
  push();
  for (const s of DIAG_SUBJECTS) {
    const seo = SUBJECT_SEO[s.slug];
    const desc = seo?.description?.replace(/\s+/g, " ").trim();
    push(`- [${s.title} — ${s.role}](${BASE}/diagnostic/${s.slug})${desc ? ` — ${desc}` : ""}`);
  }
  push();

  push("## Research");
  push();
  push(
    `Long-form explainers on applied AI, published by Square 1 AI. Index: ${BASE}/research`
  );
  push();
  for (const a of RESEARCH_ARTICLES) {
    const desc = a.description.replace(/\s+/g, " ").trim();
    push(`- [${a.title}](${BASE}/research/${a.slug}) (${a.published}) — ${desc}`);
  }
  push();

  if (news.length) {
    push("## Newsroom");
    push();
    push(
      "Daily technology news. Every story is human-reviewed before publication and " +
        `cites its primary sources; the editorial standards are at ${BASE}/newsroom/standards. ` +
        `Index: ${BASE}/newsroom`
    );
    push();
    for (const n of news) {
      const date = n.published_at ? n.published_at.slice(0, 10) : "";
      push(`- [${n.headline}](${BASE}/newsroom/${n.slug})${date ? ` (${date})` : ""}`);
    }
    push();
  }

  push("## Not available to crawlers");
  push();
  push("- Lesson bodies, the dashboard, Nova chat and student work are behind sign-in.");
  push("- Student portfolios at /portfolio/{id} and skill reports at /report/{token} are public only where the student chose to share them.");
  push();

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
