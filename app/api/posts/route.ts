import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/community/current-profile";
import { rateLimitGeneral } from "@/lib/rate-limit";

const VALID_KINDS = ["project", "repo", "notes", "image", "video", "document"];

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

/**
 * GET /api/posts — platform-wide community feed (newest first).
 * Returns each post with its author, attachments, like/collab counts, and
 * whether the caller has liked / is collaborating / follows the author.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getCurrentProfile(supabase);
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { data: rows, error, count } = await supabase
      .from("community_posts")
      .select(
        `
        id,
        author_id,
        text,
        created_at,
        edited_at,
        community_profiles!author_id(id, avatar_url, student_id),
        post_attachments(id, kind, payload)
      `,
        { count: "exact" }
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching posts:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    const posts = rows ?? [];
    const postIds = posts.map((p: any) => p.id);
    const authorProfileIds = [...new Set(posts.map((p: any) => p.author_id))];
    const studentIds = [
      ...new Set(posts.map((p: any) => p.community_profiles?.student_id).filter(Boolean)),
    ];

    // Author display names
    const nameByStudent: Record<string, string> = {};
    if (studentIds.length) {
      const { data: students } = await supabase
        .from("students")
        .select("id, name")
        .in("id", studentIds);
      for (const s of students ?? []) nameByStudent[s.id] = s.name;
    }

    // Author primary enrolled course (for the "· Course" meta line)
    const courseByStudent: Record<string, string> = {};
    if (studentIds.length) {
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("student_id, course_id")
        .in("student_id", studentIds)
        .eq("status", "active");
      const courseIds = [...new Set((enrollments ?? []).map((e: any) => e.course_id))];
      const titleById: Record<string, string> = {};
      if (courseIds.length) {
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);
        for (const c of courses ?? []) titleById[c.id] = c.title;
      }
      for (const e of enrollments ?? []) {
        if (!courseByStudent[e.student_id] && titleById[e.course_id]) {
          courseByStudent[e.student_id] = titleById[e.course_id];
        }
      }
    }

    // Likes
    const likeCount: Record<string, number> = {};
    const likedByMe = new Set<string>();
    if (postIds.length) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id, profile_id")
        .in("post_id", postIds);
      for (const l of likes ?? []) {
        likeCount[l.post_id] = (likeCount[l.post_id] ?? 0) + 1;
        if (l.profile_id === me.id) likedByMe.add(l.post_id);
      }
    }

    // Collaboration requests
    const collabCount: Record<string, number> = {};
    const collabByMe = new Set<string>();
    if (postIds.length) {
      const { data: collabs } = await supabase
        .from("post_collaborations")
        .select("post_id, profile_id")
        .in("post_id", postIds);
      for (const c of collabs ?? []) {
        collabCount[c.post_id] = (collabCount[c.post_id] ?? 0) + 1;
        if (c.profile_id === me.id) collabByMe.add(c.post_id);
      }
    }

    // Which authors the caller follows
    const followsAuthor = new Set<string>();
    if (authorProfileIds.length) {
      const { data: follows } = await supabase
        .from("community_follows")
        .select("following_profile_id")
        .eq("follower_profile_id", me.id)
        .in("following_profile_id", authorProfileIds);
      for (const f of follows ?? []) followsAuthor.add(f.following_profile_id);
    }

    const feed = posts.map((p: any) => {
      const studentId = p.community_profiles?.student_id;
      const name = nameByStudent[studentId] ?? "Member";
      const course = courseByStudent[studentId];
      const meta = [course, relativeTime(p.created_at)].filter(Boolean).join(" · ");
      return {
        id: p.id,
        authorProfileId: p.author_id,
        author: {
          profileId: p.author_id,
          name,
          initials: initialsOf(name),
          avatarUrl: p.community_profiles?.avatar_url ?? null,
        },
        meta,
        text: p.text ?? "",
        createdAt: p.created_at,
        editedAt: p.edited_at,
        attachments: (p.post_attachments ?? []).map((a: any) => ({
          id: a.id,
          kind: a.kind,
          ...(a.payload ?? {}),
        })),
        likeCount: likeCount[p.id] ?? 0,
        likedByMe: likedByMe.has(p.id),
        commentCount: 0,
        collabCount: collabCount[p.id] ?? 0,
        collabByMe: collabByMe.has(p.id),
        followsAuthor: followsAuthor.has(p.author_id),
        isSelf: p.author_id === me.id,
      };
    });

    return NextResponse.json({ posts: feed, total: count, limit, offset });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/posts — create a post with optional attachments.
 * Body: { text?: string, attachments?: { kind, payload }[] }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimitGeneral(user.id);
    if (!rl.success) return rl.response;

    const body = await req.json();
    const text: string = typeof body.text === "string" ? body.text.trim() : "";
    const attachments: { kind: string; payload: unknown }[] = Array.isArray(body.attachments)
      ? body.attachments
      : [];

    if (!text && attachments.length === 0) {
      return NextResponse.json(
        { error: "A post needs text or at least one attachment" },
        { status: 400 }
      );
    }
    if (text.length > 5000) {
      return NextResponse.json({ error: "Post is too long (max 5000 characters)" }, { status: 400 });
    }
    for (const a of attachments) {
      if (!VALID_KINDS.includes(a?.kind)) {
        return NextResponse.json({ error: `Invalid attachment kind: ${a?.kind}` }, { status: 400 });
      }
    }

    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: "Community profile not found" }, { status: 500 });
    }

    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({ author_id: profile.id, text: text || null })
      .select("id")
      .maybeSingle();

    if (postError || !post) {
      console.error("Error creating post:", postError);
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }

    if (attachments.length) {
      const rows = attachments.map((a) => ({
        post_id: post.id,
        kind: a.kind,
        payload: a.payload ?? {},
      }));
      const { error: attError } = await supabase.from("post_attachments").insert(rows);
      if (attError) console.error("Error inserting attachments:", attError);
    }

    return NextResponse.json({ post: { id: post.id } }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
