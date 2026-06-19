import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudyHubClient } from "./StudyHubClient";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase.from("students").select("id, name").eq("user_id", user.id).maybeSingle();
  if (!student) redirect("/dashboard");

  const nowIso = new Date().toISOString();

  // Two queries, both accurate at any scale:
  //  1. The first page of full notes for initial render.
  //  2. A lightweight (type + next_review_at only) sweep of EVERY note so the
  //     filter counts and "due" count are correct beyond the loaded page.
  const [{ data: notes }, { data: meta }] = await Promise.all([
    supabase
      .from("study_notes")
      .select("*")
      .eq("student_id", student.id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("study_notes")
      .select("type, next_review_at")
      .eq("student_id", student.id),
  ]);

  const allMeta = meta ?? [];
  const countOf = (t: string) => allMeta.filter((n) => n.type === t).length;
  const stats = {
    total: allMeta.length,
    highlights: countOf("highlight"),
    codeSnippets: countOf("code_snippet"),
    flashcards: countOf("flashcard"),
    dueFlashcards: allMeta.filter((n) => n.type === "flashcard" && n.next_review_at && n.next_review_at <= nowIso).length,
    userNotes: countOf("note"),
    novaSaves: countOf("nova_save"),
    summaries: countOf("auto_summary"),
  };

  return (
    <StudyHubClient
      initialNotes={notes ?? []}
      stats={stats}
      totalCount={allMeta.length}
    />
  );
}
