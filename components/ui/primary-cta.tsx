import Link from "next/link";
import type { ComponentPropsWithRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// PrimaryCta — THE primary call-to-action. One shape, one gradient, everywhere.
//
// Every repeat of the same visual trains visitors to spot "the button". Do not
// introduce new primary-CTA colours/shapes in sections — use this component.
// Secondary actions stay as outline links next to it.
// ═══════════════════════════════════════════════════════════════════════════════

// Same gradient as headline accents (see BLUE_GRADIENT in HeroSection) so the
// brand reads as one system from headline to button.
export const CTA_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";
const CTA_SHADOW = "0 12px 32px rgba(0,86,206,0.32), 0 0 0 1px rgba(255,255,255,0.12) inset";

const SIZES = {
  sm: "px-5 py-2.5 text-xs gap-2",
  md: "px-7 py-3.5 text-sm gap-2",
  lg: "px-10 py-5 text-base lg:text-lg gap-2.5",
} as const;

type Props = ComponentPropsWithRef<typeof Link> & {
  size?: keyof typeof SIZES;
  withArrow?: boolean;
};

export function PrimaryCta({
  size = "md",
  withArrow = true,
  className = "",
  style,
  children,
  ...rest
}: Props) {
  return (
    <Link
      {...rest}
      className={`group inline-flex items-center justify-center rounded-full text-white font-bold tracking-tight transition-transform duration-200 ease-out hover:-translate-y-0.5 ${SIZES[size]} ${className}`}
      style={{ background: CTA_GRADIENT, boxShadow: CTA_SHADOW, ...style }}
    >
      <span>{children}</span>
      {withArrow && (
        <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      )}
    </Link>
  );
}
