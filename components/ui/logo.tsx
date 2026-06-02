"use client";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
  /** When true, render only the square-bracket icon without the wordmark */
  iconOnly?: boolean;
  /** When true, render the filled blue gradient "app-icon" style (used for favicons / avatars) */
  appIcon?: boolean;
}

const HEIGHTS = { sm: "h-6", md: "h-8", lg: "h-10", xl: "h-14" };

// ─── The square-bracket mark from the Square 1 AI brand ────────────────────
// A clean square frame where the right side reads as a stylized "1":
// the vertical line on the right doesn't fully meet the bottom edge,
// giving the icon its distinctive open form.
function BracketMark({ color, strokeWidth = 3 }: { color: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      className="h-full w-auto shrink-0"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top edge */}
      <path d="M 6.5 6.5 L 29.5 6.5" />
      {/* Left edge */}
      <path d="M 6.5 6.5 L 6.5 29.5" />
      {/* Bottom edge (partial — leaves room for the '1' to stand on its own) */}
      <path d="M 6.5 29.5 L 22 29.5" />
      {/* Right edge (a stylized '1' — doesn't fully meet the bottom) */}
      <path d="M 29.5 6.5 L 29.5 24" />
    </svg>
  );
}

// ─── The "S1" filled app-icon (gradient square — for favicons, avatars) ────
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
      {/* Rounded blue gradient square */}
      <rect width="64" height="64" rx="14" fill="url(#sq1-gradient)" />
      {/* Inner bracket mark */}
      <path
        d="M 14 16 L 36 16 M 14 16 L 14 38 M 14 38 L 28 38 M 36 16 L 36 32"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* '1' character */}
      <text
        x="44"
        y="42"
        fill="white"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="28"
        fontWeight="800"
        textAnchor="middle"
      >
        1
      </text>
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
  // Brand colour palette
  const lightFg = "#FFFFFF";
  const darkFg  = "#3388FF";  // brand light blue from the screenshot
  const color   = variant === "light" ? lightFg : darkFg;

  // App-icon variant ignores text — just the gradient square
  if (appIcon) {
    const px = size === "sm" ? 28 : size === "md" ? 36 : size === "lg" ? 44 : 56;
    return (
      <div className={cn("inline-flex", className)} aria-label="Square 1 AI">
        <AppIcon size={px} />
      </div>
    );
  }

  // Icon-only variant — just the bracket mark, no wordmark
  if (iconOnly) {
    return (
      <div className={cn(HEIGHTS[size], "inline-flex", className)} aria-label="Square 1 AI">
        <BracketMark color={color} />
      </div>
    );
  }

  // Default: bracket + wordmark
  return (
    <div
      className={cn(HEIGHTS[size], "inline-flex items-center gap-2", className)}
      aria-label="Square 1 AI"
    >
      <BracketMark color={color} />
      <span
        className="font-bold tracking-tight whitespace-nowrap leading-none"
        style={{
          color,
          fontSize: size === "sm" ? "1rem" : size === "md" ? "1.15rem" : size === "lg" ? "1.4rem" : "1.75rem",
          letterSpacing: "-0.02em",
        }}
      >
        Square<span className="font-black">1</span>
        <span className="ml-1.5 font-bold">Ai</span>
      </span>
    </div>
  );
}
