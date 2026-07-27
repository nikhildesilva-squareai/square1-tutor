"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// Product tour — a spotlight walkthrough for features that are not
// self-explanatory (the Study Hub in particular: its whole value is a loop that
// nobody discovers by clicking around).
//
// Dependency-free by design, consistent with the rest of this codebase: no tour
// library, no motion library. A step points at any element carrying a
// data-tour="<key>" attribute; the overlay cuts a hole over it and anchors a
// tooltip beside it.
//
// Rules it follows:
//  • Never traps anyone — Escape, the backdrop, and a visible Skip all exit.
//  • Steps whose target is missing are skipped automatically, so a tour never
//    dead-ends on a button that is conditionally rendered (e.g. the Review
//    button only exists when cards are due).
//  • Completion is remembered per tour id, so it shows once and can be replayed
//    deliberately via `startSignal`.
// ═══════════════════════════════════════════════════════════════════════════════

export interface TourStep {
  /** data-tour value of the element to highlight. Omit for a centred step. */
  target?: string;
  title: string;
  body: string;
}

const seenKey = (id: string) => `sq1_tour_${id}`;

/**
 * A target counts only if it is actually on screen. Presence in the DOM is not
 * enough: the sidebar is `hidden lg:flex`, so on a phone its rows exist but
 * render at zero size — pointing a spotlight at them would highlight nothing.
 */
function isTargetVisible(key: string): boolean {
  const el = document.querySelector(`[data-tour="${key}"]`) as HTMLElement | null;
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function hasSeenTour(id: string): boolean {
  try {
    return localStorage.getItem(seenKey(id)) === "done";
  } catch {
    return false;
  }
}

export function ProductTour({
  id,
  steps,
  autoStart = true,
  startSignal = 0,
  onClose,
}: {
  id: string;
  steps: TourStep[];
  /** Show automatically the first time this learner sees the page. */
  autoStart?: boolean;
  /** Increment to replay on demand (e.g. from a "Take the tour" button). */
  startSignal?: number;
  onClose?: () => void;
}) {
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Resolve which steps actually exist on this page right now.
  const visibleSteps = useRef<TourStep[]>(steps);

  const finish = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(seenKey(id), "done");
    } catch {
      /* storage blocked — the tour simply shows again next time */
    }
    onClose?.();
  }, [id, onClose]);

  // Auto-start once, only if never completed.
  useEffect(() => {
    if (!autoStart) return;
    if (hasSeenTour(id)) return;
    // Let the page paint before measuring anything.
    const t = setTimeout(() => {
      visibleSteps.current = steps.filter((s) => !s.target || isTargetVisible(s.target));
      if (visibleSteps.current.length > 0) {
        setI(0);
        setActive(true);
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual replay.
  useEffect(() => {
    if (startSignal <= 0) return;
    visibleSteps.current = steps.filter(
      (s) => !s.target || document.querySelector(`[data-tour="${s.target}"]`),
    );
    setI(0);
    setActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSignal]);

  const step = active ? visibleSteps.current[i] : undefined;

  // Measure the target, keeping it on screen.
  useLayoutEffect(() => {
    if (!step) return;
    setReady(false);
    if (!step.target) {
      setRect(null);
      setReady(true);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) {
      setRect(null);
      setReady(true);
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const measure = () => {
      setRect(el.getBoundingClientRect());
      setReady(true);
    };
    const t = setTimeout(measure, 260); // after the smooth scroll settles
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  // Escape always exits.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, i]);

  function next() {
    if (i >= visibleSteps.current.length - 1) finish();
    else setI((n) => n + 1);
  }
  function back() {
    setI((n) => Math.max(0, n - 1));
  }

  if (!active || !step) return null;

  const total = visibleSteps.current.length;
  const pad = 8;
  const hole = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  // Place the card below the target when there is room, else above; centred when
  // there is no target.
  const cardTop = hole
    ? hole.top + hole.height + 14 > window.innerHeight - 200
      ? Math.max(12, hole.top - 190)
      : hole.top + hole.height + 14
    : Math.max(12, window.innerHeight / 2 - 110);
  const cardLeft = hole
    ? Math.min(Math.max(12, hole.left), Math.max(12, window.innerWidth - 340))
    : Math.max(12, window.innerWidth / 2 - 165);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Dimmer with a hole punched over the target (box-shadow spread trick,
          so there is no second element to keep in sync). */}
      {hole ? (
        <div
          onClick={finish}
          className="absolute rounded-xl pointer-events-auto transition-all duration-300"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            boxShadow: "0 0 0 9999px rgba(6,16,32,0.66)",
            outline: "2px solid rgba(51,136,255,0.9)",
            outlineOffset: 2,
            opacity: ready ? 1 : 0,
          }}
        />
      ) : (
        <div onClick={finish} className="absolute inset-0" style={{ background: "rgba(6,16,32,0.66)" }} />
      )}

      {/* Step card */}
      <div
        ref={cardRef}
        className="absolute w-[330px] rounded-2xl bg-white shadow-[0_24px_60px_-18px_rgba(1,34,79,0.6)] p-5 transition-all duration-300"
        style={{ top: cardTop, left: cardLeft, opacity: ready ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand mb-1.5">
          Step {i + 1} of {total}
        </p>
        <h3 className="text-base font-black text-slate-900 leading-snug mb-1.5">{step.title}</h3>
        <p className="text-[13px] text-slate-600 leading-relaxed">{step.body}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={finish}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button
                onClick={back}
                className="h-9 px-3 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="h-9 px-4 rounded-lg text-xs font-bold text-white bg-brand hover:-translate-y-0.5 transition-transform"
            >
              {i === total - 1 ? "Got it" : "Next"}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-3 flex items-center gap-1.5">
          {Array.from({ length: total }, (_, n) => (
            <span
              key={n}
              className="h-1 rounded-full transition-all"
              style={{
                width: n === i ? 18 : 6,
                background: n === i ? "#0056CE" : n < i ? "#9CC5FF" : "#E2E8F0",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
