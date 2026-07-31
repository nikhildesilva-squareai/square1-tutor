import { ArrowRight, ArrowDown } from "lucide-react";
import type { ArticleDiagram } from "@/lib/newsroom-meta";

// ═══════════════════════════════════════════════════════════════════════════════
// Teaching diagram — the mechanism behind the story, drawn.
//
// Deliberately NOT a data chart. Only ~5% of articles contain chartable figures,
// so a numeric chart here would either be empty or invented. A concept diagram
// carries structure instead: the ORDER of an attack, the DIFFERENCE between two
// approaches, the LAYERS of a system. It can be accurate with zero statistics.
//
// Three shapes cover almost every technology story:
//   flow     what happened, in sequence      (attack path, pipeline, lifecycle)
//   compare  approach A vs approach B        (RAG vs fine-tuning, before/after)
//   layers   a stack, top to bottom          (architecture, defence in depth)
//
// Rendered as semantic HTML, not SVG: it reflows on mobile, the text is real
// text (selectable, translatable, screen-readable), and it needs no viewBox
// maths. Everything is layout, so there's nothing to mis-scale.
// ═══════════════════════════════════════════════════════════════════════════════

export function ConceptDiagram({ diagram }: { diagram: ArticleDiagram }) {
  const { type, title, items } = diagram;
  if (!items?.length) return null;

  return (
    <figure className="mt-9 mb-2 rounded-2xl border border-slate-200 bg-surface-soft p-5 sm:p-6">
      <figcaption className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-500 mb-4">
        {title || "How it works"}
      </figcaption>

      {/* ── Flow: numbered steps, arrows between ─────────────────────────── */}
      {type === "flow" && (
        <ol className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0 list-none p-0 m-0">
          {items.map((step, i) => (
            <li key={i} className="flex sm:flex-1 sm:flex-col items-center gap-2 sm:gap-0 min-w-0">
              <div className="flex-1 sm:w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 min-w-0">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-brand/10 text-brand text-[10px] font-black mb-1.5"
                  aria-hidden>
                  {i + 1}
                </span>
                <p className="text-[13px] font-bold text-slate-900 leading-snug">{step.label}</p>
                {step.detail && (
                  <p className="mt-1 text-[11.5px] text-slate-500 leading-snug">{step.detail}</p>
                )}
              </div>
              {i < items.length - 1 && (
                <>
                  <ArrowRight className="hidden sm:block h-4 w-4 text-brand/50 shrink-0 self-center my-1.5 rotate-90 sm:rotate-0" aria-hidden />
                  <ArrowDown className="sm:hidden h-4 w-4 text-brand/50 shrink-0" aria-hidden />
                </>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* ── Compare: two columns ─────────────────────────────────────────── */}
      {type === "compare" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.slice(0, 2).map((side, i) => (
            <div key={i}
              className={`rounded-xl border p-4 ${i === 0 ? "border-brand/30 bg-brand/[0.04]" : "border-slate-200 bg-white"}`}>
              <p className={`text-[11px] font-black tracking-wide uppercase mb-2 ${i === 0 ? "text-brand" : "text-slate-500"}`}>
                {side.label}
              </p>
              {side.detail && (
                <p className="text-[13px] text-slate-700 leading-relaxed">{side.detail}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Layers: a stack, widest at the base ──────────────────────────── */}
      {type === "layers" && (
        <div className="flex flex-col gap-1.5">
          {items.map((layer, i) => (
            <div key={i}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 flex items-baseline gap-3"
              style={{
                // Each layer sits slightly wider than the one above it, so the
                // stack reads as a foundation without needing a legend.
                marginLeft: `${(items.length - 1 - i) * 3}%`,
                marginRight: `${(items.length - 1 - i) * 3}%`,
              }}>
              <span className="text-[10px] font-black text-brand/60 shrink-0 tabular-nums" aria-hidden>
                {String(items.length - i).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-900 leading-snug">{layer.label}</p>
                {layer.detail && (
                  <p className="mt-0.5 text-[11.5px] text-slate-500 leading-snug">{layer.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}
