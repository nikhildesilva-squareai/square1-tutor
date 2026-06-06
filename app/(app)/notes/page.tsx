import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudyHubClient } from "./StudyHubClient";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase.from("students").select("id, name").eq("user_id", user.id).maybeSingle();
  if (!student) redirect("/dashboard");

  // Fetch all notes
  const { data: notes } = await supabase
    .from("study_notes")
    .select("*")
    .eq("student_id", student.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  // Stats
  const allNotes = notes ?? [];
  const highlights = allNotes.filter(n => n.type === "highlight").length;
  const codeSnippets = allNotes.filter(n => n.type === "code_snippet").length;
  const flashcards = allNotes.filter(n => n.type === "flashcard").length;
  const dueFlashcards = allNotes.filter(n => n.type === "flashcard" && n.next_review_at && new Date(n.next_review_at) <= new Date()).length;
  const userNotes = allNotes.filter(n => n.type === "note").length;
  const novaSaves = allNotes.filter(n => n.type === "nova_save").length;
  const summaries = allNotes.filter(n => n.type === "auto_summary").length;

  return (
    <StudyHubClient
      initialNotes={allNotes}
      stats={{ total: allNotes.length, highlights, codeSnippets, flashcards, dueFlashcards, userNotes, novaSaves, summaries }}
    />
  );
}
