import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
import { generateVerificationId, normaliseCredentialId } from "@/lib/certificates";

// ═══════════════════════════════════════════════════════════════════════════════
// /verify — public certificate verification (UX review R3).
//
// Every certificate footer has said "Verify at square1ai.com/verify" since
// launch; this makes that sentence true. An employer pastes the credential ID
// and gets the verified facts — student, course, completion date — or an
// honest "not found". Verification recomputes IDs over COMPLETED enrollments
// server-side (the completion gate is what makes a certificate real), so
// nothing here trusts the visitor's input beyond matching a string.
// ═══════════════════════════════════════════════════════════════════════════════

export const metadata: Metadata = {
  title: "Verify a certificate — Square 1 AI",
  description:
    "Check any Square 1 AI certificate of completion by its credential ID. Verified against real course completions.",
};

type VerifiedCert = {
  studentName: string;
  courseTitle: string;
  completedAt: string;
};

async function lookupCredential(id: string): Promise<VerifiedCert | null> {
  try {
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("student_enrollments")
      .select("id, student_id, completed_at, courses(title), students(name)")
      .not("completed_at", "is", null);
    for (const row of rows ?? []) {
      if (generateVerificationId(row.id as string, row.student_id as string) === id) {
        const course = row.courses as unknown as { title: string } | null;
        const student = row.students as unknown as { name: string | null } | null;
        return {
          studentName: student?.name ?? "Square 1 student",
          courseTitle: course?.title ?? "Square 1 course",
          completedAt: row.completed_at as string,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: rawId } = await searchParams;
  const id = rawId ? normaliseCredentialId(rawId) : null;
  const result = id ? await lookupCredential(id) : null;

  return (
    <main className="min-h-dvh bg-[#F8FAFC] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" aria-label="Square 1 AI home"><Logo variant="dark" size="sm" /></Link>
          <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800">Sign in</Link>
        </div>

        <div className="rounded-2xl border border-[#E8EEF5] bg-white p-6 shadow-[0_1px_2px_rgba(21,47,84,0.04)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0056CE]">Certificate verification</p>
          <h1 className="mt-1.5 text-2xl font-bold text-slate-900">Check a Square 1 credential</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Every Square 1 AI certificate carries a credential ID (e.g.{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px]">SQ1-1A2B-3C4D</code>).
            Enter it below — we verify against real, completed coursework, never a mailing list.
          </p>

          <form method="get" className="mt-5 flex gap-2">
            <input
              type="text"
              name="id"
              defaultValue={rawId ?? ""}
              placeholder="SQ1-XXXX-XXXX"
              aria-label="Credential ID"
              className="h-11 min-w-0 flex-1 rounded-xl border border-[#D8E2ED] px-3.5 font-mono text-sm uppercase tracking-wide text-slate-900 outline-none focus:border-[#0056CE]"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-xl bg-[#0056CE] px-5 text-sm font-bold text-white transition-colors hover:bg-[#004AB0]"
            >
              Verify
            </button>
          </form>

          {rawId && !id && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              That doesn&apos;t look like a Square 1 credential ID — the format is{" "}
              <span className="font-mono font-semibold">SQ1-XXXX-XXXX</span>.
            </div>
          )}

          {id && result && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <p className="text-sm font-bold text-emerald-800">Verified credential</p>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-emerald-800/70">Issued to</dt><dd className="font-semibold text-emerald-900">{result.studentName}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-emerald-800/70">Course</dt><dd className="font-semibold text-emerald-900">{result.courseTitle}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-emerald-800/70">Completed</dt><dd className="font-semibold tabular-nums text-emerald-900">{new Date(result.completedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-emerald-800/70">Credential ID</dt><dd className="font-mono font-semibold text-emerald-900">{id}</dd></div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-emerald-800/80">
                This certificate is backed by completed, AI-graded coursework on Square 1 AI —
                not attendance. Ask the candidate for their portfolio link to see the graded projects behind it.
              </p>
            </div>
          )}

          {id && !result && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-bold">No matching credential.</p>
              <p className="mt-1 leading-relaxed">
                <span className="font-mono">{id}</span>{" "}doesn&apos;t match any completed Square 1 course.
                Check the ID for typos — if it still fails, the certificate wasn&apos;t issued by us.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Square 1 AI · proof over certificates —{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-slate-600">square1ai.com</Link>
        </p>
      </div>
    </main>
  );
}
