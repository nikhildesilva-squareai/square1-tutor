"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Polls the unread message count for the nav badge — team (Square 1) messages
 * plus student-to-student DMs. Re-checks on route change (so opening /messages
 * clears the dot) and every 60s while mounted.
 */
export function useUnreadMessages() {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const [team, dm] = await Promise.all([
          fetch("/api/messages?count=1").then((r) => (r.ok ? r.json() : { unread: 0 })).catch(() => ({ unread: 0 })),
          fetch("/api/dm?count=1").then((r) => (r.ok ? r.json() : { unread: 0 })).catch(() => ({ unread: 0 })),
        ]);
        if (alive) setUnread((team.unread ?? 0) + (dm.unread ?? 0));
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
