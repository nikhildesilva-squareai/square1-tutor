import { cn } from "@/lib/utils";

// Magic UI's Marquee (via 21st.dev, id 1477) — infinite CSS scroll, no JS.
// Keyframes live in globals.css (`mq-scroll`, namespaced: JourneyHook already
// owns `.animate-marquee`); reduced-motion users get a paused, static row.
interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children?: React.ReactNode;
  repeat?: number;
  [key: string]: unknown;
}

export function Marquee({
  className,
  reverse,
  pauseOnHover = false,
  children,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex flex-row overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
        className,
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            aria-hidden={i > 0}
            className={cn("flex shrink-0 flex-row justify-around [gap:var(--gap)] animate-mq-scroll", {
              "group-hover:[animation-play-state:paused]": pauseOnHover,
              "[animation-direction:reverse]": reverse,
            })}
          >
            {children}
          </div>
        ))}
    </div>
  );
}
