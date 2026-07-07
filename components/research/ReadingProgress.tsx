"use client";

import { useEffect, useRef } from "react";

/**
 * Thin brand-gradient bar under the article header showing scroll progress.
 * Transform-only animation driven by rAF-throttled scroll — no layout work.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-0 h-[3px] bg-slate-100" aria-hidden>
      <div
        ref={barRef}
        className="h-full origin-left"
        style={{
          transform: "scaleX(0)",
          background: "linear-gradient(90deg, #3388FF 0%, #0056CE 60%, #01224F 100%)",
        }}
      />
    </div>
  );
}
