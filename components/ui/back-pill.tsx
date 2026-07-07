import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The site-standard back control: a left-aligned white pill with an arrow
 * that nudges on hover. Sits at the top-left of the content column (never a
 * bare text link in a header's top-right).
 */
export function BackPill({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm transition-all hover:text-slate-900 hover:border-brand/40 hover:shadow",
        className,
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        className="transition-transform group-hover:-translate-x-0.5" aria-hidden>
        <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
      </svg>
      {label}
    </Link>
  );
}
