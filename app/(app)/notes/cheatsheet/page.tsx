import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheatsheetClient } from "./CheatsheetClient";

// The student's personal reference manual: every saved code snippet,
// grouped by course and module, in a dense print-ready layout.
export default async function CheatsheetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase.from("students").select("id, name").eq("user_id", user.id).maybeSingle();
  if (!student) redirect("/dashboard");

  const { data: snippets } = await supabase
    .from("study_notes")
    .select("id, title, content, course_title, module_title, lesson_title, tags, created_at")
    .eq("student_id", student.id)
    .eq("type", "code_snippet")
    .order("course_title", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(500);

  return <CheatsheetClient snippets={snippets ?? []} studentName={student.name ?? "My"} />;
}
