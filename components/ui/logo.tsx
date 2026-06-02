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

// ─── The Square 1 Ai brand mark ──────────────────────────────────────────────
// An open square bracket — thick, bold, matching the Figma design.
// The bracket is open on the bottom-right, suggesting forward movement.
function BracketMark({ color, strokeW = 3.5 }: { color: string; strokeW?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className="h-full w-auto shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Open square bracket — L-shaped top + left + partial bottom */}
      <path
        d="M 26 5 L 5 5 L 5 27 L 18 27"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
      {/* Right vertical (partial — stops short to create the open form) */}
      <path
        d="M 26 5 L 26 20"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="square"
        fill="none"
      />
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
      {/* White bracket mark inside the gradient square */}
      <path
        d="M 44 14 L 14 14 L 14 50 L 32 50"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
      <path
        d="M 44 14 L 44 38"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="square"
        fill="none"
      />
      {/* S1 text */}
      <text
        x="38"
        y="54"
        fill="white"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="16"
        fontWeight="800"
        textAnchor="middle"
        opacity="0.7"
      >
        S1
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
  const BRAND_BLUE = "#0056CE";
  const color = variant === "light" ? "#FFFFFF" : BRAND_BLUE;

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
        <BracketMark color={color} />
      </div>
    );
  }

  // Default: bracket + wordmark
  return (
    <div
      className={cn(HEIGHTS[size], "inline-flex items-center gap-1.5", className)}
      aria-label="Square1 Ai"
    >
      <BracketMark color={color} />
      <span
        className="font-black tracking-tight whitespace-nowrap leading-none"
        style={{
          color,
          fontSize: size === "sm" ? "0.95rem" : size === "md" ? "1.1rem" : size === "lg" ? "1.35rem" : "1.7rem",
          letterSpacing: "-0.03em",
        }}
      >
        Square1 <span className="font-bold" style={{ color: variant === "light" ? "#FFFFFF" : BRAND_BLUE }}>Ai</span>
      </span>
    </div>
  );
}
