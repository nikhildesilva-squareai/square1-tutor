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
  verificationId: string;
}

export function CertificateView(props: Props) {
  const router = useRouter();

  function handlePrint() {
    window.print();
  }

  const levelLabel =
    props.level === "advanced" ? "Advanced" :
    props.level === "intermediate" ? "Intermediate" :
    "Foundational";

  return (
    <div className="min-h-full bg-surface-soft px-4 py-8 print:bg-white print:p-0">
      {/* Controls — hidden when printing */}
      <div className="max-w-[900px] mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="text-sm text-ink-muted hover:text-brand transition-colors flex items-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const url = `${window.location.origin}/certificate/${props.courseSlug}`;
              navigator.clipboard.writeText(url);
            }}
            className="h-10 px-5 rounded-xl border border-border text-ink text-sm font-semibold hover:bg-surface-alt transition-all flex items-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
            Share
          </button>
          <button
            onClick={handlePrint}
            className="h-10 px-6 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand/90 transition-all flex items-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* Certificate — landscape, print-optimized */}
      <div className="max-w-[900px] mx-auto aspect-[1.414/1] bg-surface rounded-2xl border border-border shadow-card overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-w-none print:aspect-auto">
        <div className="relative w-full h-full flex flex-col">

          {/* Decorative border frame */}
          <div className="absolute inset-3 sm:inset-5 border border-border-mid/40 rounded-lg pointer-events-none print:inset-4" />
          <div className="absolute inset-4 sm:inset-6 border border-border/30 rounded-md pointer-events-none print:inset-5" />

          {/* Top accent stripe */}
          <div className="h-1.5 flex-shrink-0">
            <div className="h-full" style={{ background: `linear-gradient(90deg, ${props.courseColor}, ${props.courseColor}88, #7C3AED)` }} />
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-between px-8 sm:px-16 py-6 sm:py-10 print:px-12 print:py-8">

            {/* Top section: Logo + Title */}
            <div className="text-center">
              {/* Square 1 AI logo */}
              <div className="flex items-center justify-center mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-square1.png" alt="Square 1 AI" className="h-10 sm:h-12 w-auto" />
              </div>

              {/* Decorative divider */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-16 sm:w-24" style={{ background: `linear-gradient(90deg, transparent, ${props.courseColor}60)` }} />
                <svg width="12" height="12" viewBox="0 0 24 24" fill={props.courseColor} opacity="0.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" /></svg>
                <div className="h-px w-16 sm:w-24" style={{ background: `linear-gradient(270deg, transparent, ${props.courseColor}60)` }} />
              </div>

              <h2 className="text-[10px] sm:text-xs font-bold text-ink-muted uppercase tracking-[0.35em] mb-6">Certificate of Completion</h2>
            </div>

            {/* Middle section: Student + Course */}
            <div className="text-center flex-1 flex flex-col justify-center -mt-4">
              <p className="text-xs sm:text-sm text-ink-muted mb-2">This is to certify that</p>

              <h1 className="text-2xl sm:text-4xl font-black text-ink mb-1.5 tracking-tight">
                {props.studentName}
              </h1>

              <p className="text-xs sm:text-sm text-ink-muted mb-5">has successfully completed</p>

              <div className="inline-block mx-auto mb-5">
                <h2 className="text-lg sm:text-2xl font-bold mb-2" style={{ color: props.courseColor }}>
                  {props.courseTitle}
                </h2>
                <div className="w-12 h-0.5 mx-auto rounded-full" style={{ background: props.courseColor }} />
              </div>

              {/* Achievement summary */}
              <p className="text-xs sm:text-sm text-ink-muted max-w-lg mx-auto leading-relaxed">
                an online programme offered by Square 1 AI, with a verified assessment score
                of <span className="font-bold text-ink">{props.assessmentScore ?? "—"}%</span> at
                the <span className="font-bold text-ink">{levelLabel}</span> level,
                completing <span className="font-bold text-ink">{props.lessonsCompleted} lessons</span> and <span className="font-bold text-ink">{props.projectsCompleted} projects</span>.
              </p>
            </div>

            {/* Bottom section: Signatures + Meta */}
            <div>
              {/* Signature row */}
              <div className="flex items-end justify-between mb-6 px-2 sm:px-8">
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/signature-founder.png" alt="Nikhil De Silva signature" className="h-8 sm:h-10 w-auto mx-auto mb-0.5 opacity-85" />
                  <div className="w-28 sm:w-36 border-b border-ink/20 mb-1.5" />
                  <p className="text-[10px] sm:text-xs font-bold text-ink">Nikhil De Silva</p>
                  <p className="text-[9px] sm:text-[10px] text-ink-muted">Founder, Square 1 AI</p>
                </div>

                {/* Date */}
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-ink-muted mb-0.5">Date of Issue</p>
                  <p className="text-xs sm:text-sm font-bold text-ink">{props.issueDate}</p>
                </div>

                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-square1.png" alt="Square 1 AI" className="h-6 sm:h-8 w-auto mx-auto mb-1" />
                  <div className="w-28 sm:w-36 border-b border-ink/20 mb-1.5" />
                  <p className="text-[10px] sm:text-xs font-bold text-ink">Square 1 AI</p>
                  <p className="text-[9px] sm:text-[10px] text-ink-muted">AI-Powered Education</p>
                </div>
              </div>

              {/* Verification footer */}
              <div className="flex items-center justify-between border-t border-border pt-3 px-1">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  <span className="text-[9px] sm:text-[10px] text-ink-muted font-mono">
                    Credential ID: {props.verificationId}
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-ink-muted">
                  Verify at <span className="font-semibold">square1ai.com/verify</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bottom accent stripe */}
          <div className="h-1.5 flex-shrink-0">
            <div className="h-full" style={{ background: `linear-gradient(90deg, #7C3AED, ${props.courseColor}88, ${props.courseColor})` }} />
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:aspect-auto { aspect-ratio: auto !important; }
          @page { margin: 0.4in; size: landscape; }
        }
      `}</style>
    </div>
  );
}
