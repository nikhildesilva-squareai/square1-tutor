"use client";

import { useEffect, useState } from "react";

// Number Ticker (danielpetho via 21st.dev, id 20459) ported to the landing's
// plain-rAF idiom — same behavior (from→target tween, externally triggered),
// without adding a motion dependency for one counter. Ease-out cubic to match
// the hero's CountUp; reduced-motion users get the final value instantly.
// Always lands EXACTLY on target — these render cited statistics.
export function useNumberTicker({
  target,
  from = 0,
  start,
  duration = 900,
  delay = 0,
  decimals = 0,
}: {
  target: number;
  from?: number;
  start: boolean;
  duration?: number;
  delay?: number;
  decimals?: number;
}) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Number((from + (target - from) * eased).toFixed(decimals)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, from, duration, delay, decimals]);

  return value.toFixed(decimals);
}

export function NumberTicker({
  target,
  from = 0,
  start,
  duration = 900,
  delay = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  target: number;
  from?: number;
  start: boolean;
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const value = useNumberTicker({ target, from, start, duration, delay, decimals });
  return (
    <span className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
