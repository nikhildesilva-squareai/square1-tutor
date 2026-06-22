"use client";

import { useEffect, type RefObject } from "react";

/**
 * Accessible modal/dialog behaviour for an overlay:
 *  - Esc closes it
 *  - focus moves into the dialog on open, and is restored to the trigger on close
 *  - Tab/Shift+Tab cycle stays trapped within the dialog
 *
 * Usage: give the dialog container a ref, then call
 *   useFocusTrap(open, onClose, ref)
 * and put role="dialog" aria-modal="true" aria-label="…" on that container.
 */
export function useFocusTrap(
  active: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    const prevFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      el
        ? Array.from(
            el.querySelectorAll<HTMLElement>(
              'a[href],button:not([disabled]),textarea,input:not([disabled]),select,[tabindex]:not([tabindex="-1"])',
            ),
          ).filter((n) => n.offsetParent !== null)
        : [];

    // Move focus in (first focusable, else the container itself).
    const first = focusable()[0];
    if (first) first.focus();
    else if (el) { el.setAttribute("tabindex", "-1"); el.focus(); }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && el) {
        const f = focusable();
        if (f.length === 0) { e.preventDefault(); return; }
        const firstEl = f[0];
        const lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocused?.focus?.();
    };
  }, [active, onClose, containerRef]);
}
