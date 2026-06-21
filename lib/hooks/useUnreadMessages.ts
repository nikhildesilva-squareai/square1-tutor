"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Polls the unread team-message count for the nav badge. Re-checks on route
 * change (so opening /messages clears the dot) and every 60s while mounted.
 */
export function useUnreadMessages() {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const res = await fetch("/api/messages?count=1");
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setUnread(data.unread ?? 0);
      } catch {
        /* ignore — badge just stays put */
      }
    }
    check();
    const id = setInterval(check, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pathname]);

  return unread;
}
