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
// Geometry measured from the official lockup (public/logo-square1.png):
// 75×75 square, 8px stroke, square (butt) ends. Top + left edges are full;
// the right edge is a short stub from the top (32% of the height) and the
// bottom edge runs 60% of the width — the bottom-right corner is OPEN, and in
// the full lockup the "S" of the wordmark nests inside that opening.
function BracketMark({ white = false }: { white?: boolean }) {
  return (
    <svg viewBox="0 0 75 75" fill="none" className="h-full w-auto shrink-0" xmlns="http://www.w3.org/2000/svg">
      {!white && (
        <defs>
          <linearGradient id="sq1-mark" x1="0" y1="0" x2="0" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#689AF4" />
            <stop offset="100%" stopColor="#5E94F0" />
          </linearGradient>
        </defs>
      )}
      <g fill={white ? "#FFFFFF" : "url(#sq1-mark)"}>
        <rect x="0" y="0" width="75" height="8" />
        <rect x="0" y="0" width="8" height="75" />
        <rect x="67" y="0" width="8" height="24" />
        <rect x="0" y="67" width="45" height="8" />
      </g>
    </svg>
  );
}

// ─── Filled app-icon (gradient square — for favicons, avatars) ───────────────
// Wordmark gradient (#4482E5 → #075BCC) as the fill, white brand mark on top.
function AppIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <defs>
        <linearGradient id="sq1-appicon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4482E5" />
          <stop offset="100%" stopColor="#075BCC" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#sq1-appicon)" />
      {/* The full app-icon lockup — bracket AND the S1, kept byte-identical to
          app/icon.svg so the tab, the PWA icon and every in-app avatar show the
          same mark. The bracket's bottom-right corner stays open and the S nests
          into it, which is the whole point of the logo. */}
      <g fill="#FFFFFF">
        <rect x="10" y="15" width="30" height="3.6" />
        <rect x="10" y="15" width="3.6" height="30" />
        <rect x="36.4" y="15" width="3.6" height="9.6" />
        <rect x="10" y="41.4" width="17" height="3.6" />
      </g>
      {/* "S1" as paths, never <text>: a substituted font would change the
          letterforms and the width at the sizes where there is no room for it. */}
      <g fill="#FFFFFF">
        <path d="M33.86 30.2c-3.98 0-6.9 2.36-6.9 5.72 0 3.02 2.02 4.62 5.3 5.44l1.86.46c1.9.48 2.62 1.06 2.62 2.06 0 1.2-1.12 2-2.9 2-2 0-3.32-.92-3.86-2.62l-3.5 1.72c1 3.04 3.72 4.72 7.36 4.72 4.28 0 7.18-2.34 7.18-5.94 0-2.98-1.9-4.62-5.42-5.5l-1.86-.46c-1.72-.42-2.5-1-2.5-1.96 0-1.1 1-1.86 2.62-1.86 1.74 0 2.88.8 3.4 2.28l3.42-1.76c-1.02-2.74-3.4-4.3-6.82-4.3z" />
        <path d="M48.9 30.5l-5.6 2.3 1.02 3.34 2.9-1.06v14.16h4.06V30.5z" />
      </g>
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
        <BracketMark white={variant === "light"} />
      </div>
    );
  }

  // Default: the official lockup, pixel-exact. The PNG is transparent
  // blue-on-nothing; the light variant recolours the ink to white via CSS
  // filter (alpha is preserved) for dark backgrounds.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-square1.png"
      alt="Square1 Ai"
      className={cn(HEIGHTS[size], "w-auto max-w-none shrink-0", className)}
      style={variant === "light" ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}
