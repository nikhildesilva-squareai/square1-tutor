"use client";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
  iconOnly?: boolean;
  appIcon?: boolean;
}

const HEIGHTS = { sm: "h-6", md: "h-8", lg: "h-10", xl: "h-14" };

// ─── The Square 1 Ai brand mark (matches Figma exactly) ──────────────────────
// An open square: top + left + bottom (shorter) edges form an L-shape,
// right edge starts from top-right corner and goes down ~70% of the height.
// The bottom-right corner is OPEN — creating the distinctive gap.
function BracketMark({ color, strokeW = 2.5 }: { color: string; strokeW?: number }) {
  // The bracket colour is lighter than the text for the dark variant
  const bracketColor = color === "#FFFFFF" ? "#FFFFFF" : "#5B8DEF";
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className="h-full w-auto shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top edge: full width */}
      <line x1="4" y1="4" x2="24" y2="4" stroke={bracketColor} strokeWidth={strokeW} strokeLinecap="round" />
      {/* Left edge: full height */}
      <line x1="4" y1="4" x2="4" y2="24" stroke={bracketColor} strokeWidth={strokeW} strokeLinecap="round" />
      {/* Bottom edge: shorter — stops at ~65% */}
      <line x1="4" y1="24" x2="17" y2="24" stroke={bracketColor} strokeWidth={strokeW} strokeLinecap="round" />
      {/* Right edge: starts from top, goes down ~70% */}
      <line x1="24" y1="4" x2="24" y2="19" stroke={bracketColor} strokeWidth={strokeW} strokeLinecap="round" />
    </svg>
  );
}

// ─── Filled app-icon (gradient square — for favicons, avatars) ───────────────
function AppIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="sq1-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#5B8DEF" />
          <stop offset="100%" stopColor="#0056CE" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#sq1-gradient)" />
      {/* White bracket mark — same proportions as BracketMark */}
      <line x1="14" y1="14" x2="50" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <line x1="14" y1="14" x2="14" y2="50" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <line x1="14" y1="50" x2="34" y2="50" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="14" x2="50" y2="38" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  className,
  size = "md",
  variant = "dark",
  iconOnly = false,
  appIcon = false,
}: LogoProps) {
  const BRAND_BLUE = "#0056CE";
  const textColor = variant === "light" ? "#FFFFFF" : BRAND_BLUE;

  if (appIcon) {
    const px = size === "sm" ? 28 : size === "md" ? 36 : size === "lg" ? 44 : 56;
    return (
      <div className={cn("inline-flex", className)} aria-label="Square1 Ai">
        <AppIcon size={px} />
      </div>
    );
  }

  if (iconOnly) {
    return (
      <div className={cn(HEIGHTS[size], "inline-flex", className)} aria-label="Square1 Ai">
        <BracketMark color={textColor} />
      </div>
    );
  }

  // Default: bracket + wordmark
  return (
    <div
      className={cn(HEIGHTS[size], "inline-flex items-center gap-2", className)}
      aria-label="Square1 Ai"
    >
      <BracketMark color={textColor} />
      <span
        className="font-extrabold tracking-tight whitespace-nowrap leading-none"
        style={{
          color: textColor,
          fontSize: size === "sm" ? "0.9rem" : size === "md" ? "1.05rem" : size === "lg" ? "1.3rem" : "1.65rem",
          letterSpacing: "-0.02em",
        }}
      >
        Square1{" "}
        <span className="font-extrabold" style={{ color: textColor }}>
          Ai
        </span>
      </span>
    </div>
  );
}
