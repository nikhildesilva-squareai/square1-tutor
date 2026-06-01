"use client";
import { useEffect, useRef, useState } from "react";

type Stat = {
  target: number;
  suffix: string;
  prefix?: string;
  label: string;
  display?: string; // override final display if not just number+suffix
};

const STATS: Stat[] = [
  { target: 12,  suffix: "",   label: "real projects built"  },
  { target: 49,  suffix: "",   prefix: "4.", label: "AI feedback rating", display: "4.9★" },
  { target: 45,  suffix: "",   label: "minutes per day"      },
  { target: 3,   suffix: "",   label: "months to first job"  },
  { target: 8,   suffix: "",   label: "subjects available"   },
  { target: 100, suffix: "%",  label: "code, no videos"      },
];

function useCountUp(target: number, active: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [active, target, duration]);

  return count;
}

function StatItem({ stat, active }: { stat: Stat; active: boolean }) {
  const count = useCountUp(stat.target, active);

  let displayed: string;
  if (stat.display) {
    // Custom display — use it as-is after animation finishes, else partial
    displayed = active && count >= stat.target ? stat.display : `${count}${stat.suffix}`;
  } else {
    displayed = `${stat.prefix ?? ""}${count}${stat.suffix}`;
  }

  return (
    <div className="text-center">
      <p
        className="text-4xl sm:text-5xl lg:text-6xl font-bold tabular-nums"
        style={{ color: "#3388FF" }}
      >
        {displayed}
      </p>
      <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
    </div>
  );
}

export function StatsSection() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="py-20 px-6"
      style={{ background: "#00183A" }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
        {STATS.map((stat) => (
          <StatItem key={stat.label} stat={stat} active={active} />
        ))}
      </div>
    </section>
  );
}
