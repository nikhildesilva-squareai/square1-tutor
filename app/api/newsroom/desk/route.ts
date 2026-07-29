import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { NEWS_TOPICS, NEWS_REGIONS } from "@/lib/newsroom";

// ═══════════════════════════════════════════════════════════════════════════════
// Newsroom review desk API. This is the ONLY write path to news_articles
// (students hold no privileges on the table; the pipeline writes drafts via the
// service role too, in Phase 2).
//
// Unlike /admin (deliberately local-only), this must work in production — the
// daily review happens there. So the gate is full session auth: getUser() +
// isAdminEmail(), never anything from the query string.
// ═══════════════════════════════════════════════════════════════════════════════

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

const sourceSchema = z.object({
  outlet: z.string().min(1).max(120),
  title: z.string().min(1).max(300),
  url: z.string().url().max(600),
});

const updateSchema = z.object({
  action: z.literal("update"),
  id: z.string().uuid(),
  headline: z.string().min(8).max(200).optional(),
  dek: z.string().max(400).nullable().optional(),
  body_md: z.string().min(50).max(20000).optional(),
  topic: z.enum(Object.keys(NEWS_TOPICS) as [string, ...string[]]).optional(),
  region: z.enum(Object.keys(NEWS_REGIONS) as [string, ...string[]]).optional(),
  sources: z.array(sourceSchema).max(10).optional(),
  course_slugs: z.array(z.string().max(80)).max(6).optional(),
});

const transitionSchema = z.object({
  action: z.enum(["publish", "reject", "unpublish"]),
  id: z.string().uuid(),
});

const createSchema = z.object({
  action: z.literal("create"),
  headline: z.string().min(8).max(200),
  dek: z.string().max(400).nullable().optional(),
  body_md: z.string().min(50).max(20000),
  topic: z.enum(Object.keys(NEWS_TOPICS) as [string, ...string[]]),
  region: z.enum(Object.keys(NEWS_REGIONS) as [string, ...string[]]),
  sources: z.array(sourceSchema).min(1).max(10),
  course_slugs: z.array(z.string().max(80)).max(6).default([]),
});

const bodySchema = z.discriminatedUnion("action", [updateSchema, transitionSchema, createSchema]);

function slugify(headline: string): string {
  const base = headline
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80)
    .replace(/-+$/, "");
  // A date prefix keeps recurring headlines ("OpenAI ships GPT-…") unique.
  const day = new Date().toISOString().slice(0, 10);
  return `${day}-${base}`;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Service role: the desk must see drafts and rejects, which RLS hides.
  const { data, error } = await createAdminClient()
    .from("news_articles")
    .select("id, slug, headline, dek, body_md, topic, region, sources, course_slugs, status, published_at, created_at, reviewed_by")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[newsroom/desk] list:", error);
    return NextResponse.json({ error: "Could not load articles" }, { status: 500 });
  }
  return NextResponse.json({ articles: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = bodySchema.parse(await request.json());
    const admin = createAdminClient();

    if (body.action === "create") {
      const { data, error } = await admin
        .from("news_articles")
        .insert({
          slug: slugify(body.headline),
          headline: body.headline,
          dek: body.dek ?? null,
          body_md: body.body_md,
          topic: body.topic,
          region: body.region,
          sources: body.sources,
          course_slugs: body.course_slugs,
          status: "draft",
        })
        .select("id")
        .single();
      if (error) {
        console.error("[newsroom/desk] create:", error);
        return NextResponse.json({ error: "Could not create the draft" }, { status: 500 });
      }
      return NextResponse.json({ id: data.id }, { status: 201 });
    }

    if (body.action === "update") {
      const { action: _action, id, ...fields } = body;
      void _action;
      const patch = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined),
      );
      if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });
      const { error } = await admin
        .from("news_articles")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) {
        console.error("[newsroom/desk] update:", error);
        return NextResponse.json({ error: "Could not save the edit" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // publish / reject / unpublish — the human gate itself.
    const next =
      body.action === "publish" ? { status: "published", published_at: new Date().toISOString() }
      : body.action === "reject" ? { status: "rejected" }
      : { status: "draft", published_at: null };

    const { error } = await admin
      .from("news_articles")
      .update({ ...next, reviewed_by: user.email, updated_at: new Date().toISOString() })
      .eq("id", body.id);

    if (error) {
      // 23514 = the sources CHECK — an article can't publish without credits.
      const friendly = error.code === "23514"
        ? "This article has no sources. Add at least one credited source before publishing."
        : "Could not update the article";
      console.error("[newsroom/desk] transition:", error);
      return NextResponse.json({ error: friendly }, { status: error.code === "23514" ? 400 : 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[newsroom/desk] unexpected:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
