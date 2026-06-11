import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Certificate",
  description: "Verify a Square 1 AI certificate credential using its unique verification ID.",
};

function generateVerificationId(enrollmentId: string, studentId: string): string {
  const raw = `${enrollmentId}-${studentId}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `SQ1-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const { id } = await searchParams;

  let result: {
    valid: boolean;
    studentName?: string;
    courseTitle?: string;
    courseColor?: string;
    level?: string;
    issueDate?: string;
    verificationId?: string;
  } = { valid: false };

  if (id?.startsWith("SQ1-")) {
    const supabase = await createClient();

    const { data: enrollments } = await supabase
      .from("student_enrollments")
      .select("id, student_id, assessment_level, enrolled_at, course_id")
      .eq("status", "active");

    if (enrollments) {
      for (const enrollment of enrollments) {
        const vid = generateVerificationId(enrollment.id, enrollment.student_id);
        if (vid === id) {
          const [{ data: student }, { data: course }] = await Promise.all([
            supabase.from("students").select("name, email").eq("id", enrollment.student_id).maybeSingle(),
            supabase.from("courses").select("title, color").eq("id", enrollment.course_id).maybeSingle(),
          ]);

          result = {
            valid: true,
            studentName: student?.name ?? student?.email?.split("@")[0] ?? "Student",
            courseTitle: course?.title ?? "Course",
            courseColor: course?.color ?? "#0056CE",
            level: enrollment.assessment_level ?? "beginner",
            issueDate: new Date(enrollment.enrolled_at).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" }),
            verificationId: vid,
          };
          break;
        }
      }
    }
  }

  const searched = !!id;

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-square1.png" alt="Square 1 AI" className="h-8 w-auto" />
          </Link>
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Certificate Verification</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Search form */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-card mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-ink">Verify a Credential</h1>
                <p className="text-xs text-ink-muted">Enter a Square 1 AI credential ID</p>
              </div>
            </div>

            <form className="flex gap-2">
              <input
                name="id"
                type="text"
                defaultValue={id ?? ""}
                placeholder="SQ1-XXXX-XXXX"
                className="flex-1 h-11 px-4 rounded-xl border border-border bg-surface-soft text-sm font-mono text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
              />
              <button type="submit" className="h-11 px-5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-all">
                Verify
              </button>
            </form>
          </div>

          {/* Result */}
          {searched && (
            result.valid ? (
              <div className="bg-surface rounded-2xl border-2 border-emerald-300 p-6 shadow-card">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Verified Credential</p>
                    <p className="text-[10px] text-ink-muted font-mono">{result.verificationId}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-0.5">Student</p>
                    <p className="text-base font-bold text-ink">{result.studentName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-0.5">Course</p>
                    <p className="text-base font-bold" style={{ color: result.courseColor }}>{result.courseTitle}</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-0.5">Level</p>
                      <p className="text-sm font-semibold text-ink capitalize">{result.level}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-0.5">Issued</p>
                      <p className="text-sm font-semibold text-ink">{result.issueDate}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  <span className="text-[10px] text-ink-muted">This credential was issued by Square 1 AI and is valid.</span>
                </div>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border-2 border-red-200 p-6 shadow-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-700">Credential Not Found</p>
                    <p className="text-xs text-ink-muted">No matching certificate was found for this ID.</p>
                  </div>
                </div>
                <p className="text-xs text-ink-muted">Please double-check the credential ID and try again. The format should be SQ1-XXXX-XXXX.</p>
              </div>
            )
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-4">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between text-xs text-ink-muted">
          <span>&copy; {new Date().getFullYear()} Square 1 AI</span>
          <Link href="/" className="hover:text-brand transition-colors">Back to Square 1 AI</Link>
        </div>
      </footer>
    </div>
  );
}
