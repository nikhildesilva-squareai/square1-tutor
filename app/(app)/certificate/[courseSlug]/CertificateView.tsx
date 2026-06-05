"use client";

import { useRouter } from "next/navigation";

interface Props {
  studentName: string;
  courseTitle: string;
  courseColor: string;
  level: string;
  lessonsCompleted: number;
  totalLessons: number;
  completionPct: number;
  assessmentScore: number | null;
  projectsCompleted: number;
  enrollDate: string;
  issueDate: string;
  courseSlug: string;
}

export function CertificateView(props: Props) {
  const router = useRouter();

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-full bg-surface-soft px-4 py-8">
      {/* Controls — hidden when printing */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button onClick={() => router.back()}
          className="text-sm text-ink-muted hover:text-brand transition-colors flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
          Back
        </button>
        <button onClick={handlePrint}
          className="h-10 px-6 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand/90 transition-all flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Certificate — optimized for print */}
      <div className="max-w-4xl mx-auto bg-surface rounded-2xl border border-border shadow-card overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Top accent bar */}
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${props.courseColor}, #7C3AED)` }} />

        <div className="p-10 sm:p-16">
          {/* Header */}
          <div className="text-center mb-12">
            {/* Logo mark */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center">
                <span className="text-white font-black text-sm">[ ]</span>
              </div>
              <span className="text-lg font-black text-ink tracking-tight">Square 1 AI</span>
            </div>

            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.3em] mb-4">Certificate of Completion</p>

            <h1 className="text-3xl sm:text-4xl font-black text-ink mb-2">
              {props.courseTitle}
            </h1>

            <div className="w-16 h-0.5 mx-auto rounded-full my-6" style={{ background: props.courseColor }} />

            <p className="text-sm text-ink-muted mb-1">This certifies that</p>
            <p className="text-2xl sm:text-3xl font-black text-ink mb-1">{props.studentName}</p>
            <p className="text-sm text-ink-muted">
              has successfully completed the {props.courseTitle} programme at Square 1 AI
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            <div className="text-center p-4 rounded-xl border border-border">
              <p className="text-2xl font-black text-ink">{props.completionPct}%</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">Completion</p>
            </div>
            <div className="text-center p-4 rounded-xl border border-border">
              <p className="text-2xl font-black text-ink">{props.lessonsCompleted}/{props.totalLessons}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">Lessons</p>
            </div>
            <div className="text-center p-4 rounded-xl border border-border">
              <p className="text-2xl font-black text-ink">{props.assessmentScore ?? "—"}%</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">Assessment</p>
            </div>
            <div className="text-center p-4 rounded-xl border border-border">
              <p className="text-2xl font-black text-ink">{props.projectsCompleted}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">Projects</p>
            </div>
          </div>

          {/* Level badge */}
          <div className="text-center mb-12">
            <span className={[
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border capitalize",
              props.level === "advanced" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
              props.level === "intermediate" ? "bg-amber-50 text-amber-600 border-amber-200" :
              "bg-blue-50 text-blue-600 border-blue-200",
            ].join(" ")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              {props.level} Level Certified
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between border-t border-border pt-8">
            <div>
              <p className="text-xs text-ink-muted">Enrolled: {props.enrollDate}</p>
              <p className="text-xs text-ink-muted">Issued: {props.issueDate}</p>
            </div>
            <div className="text-right">
              <div className="w-32 h-px bg-ink mb-2" />
              <p className="text-xs font-bold text-ink">Square 1 AI</p>
              <p className="text-[10px] text-ink-muted">AI-Powered Education</p>
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${props.courseColor}, #7C3AED)` }} />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          @page { margin: 0.5in; size: landscape; }
        }
      `}</style>
    </div>
  );
}
