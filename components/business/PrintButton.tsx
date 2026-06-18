"use client";

// Triggers the browser's print dialog (→ "Save as PDF"). Hidden when printing.
export function PrintButton({ label = "Download / Print report" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:-translate-y-0.5 transition-transform"
      style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 10px 28px rgba(0,86,206,0.30)" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
      </svg>
      {label}
    </button>
  );
}
