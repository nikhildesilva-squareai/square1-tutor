"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// Pending community invitations.
//
// Creating a public community used to add 20–50 real learners to it outright.
// It now sends invitations, and this is where they're answered. Renders nothing
// at all when there's nothing waiting, so it stays out of the way.
// ═══════════════════════════════════════════════════════════════════════════════

interface Invite {
  id: string;
  sent_at: string | null;
  communities: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon_url: string | null;
  } | null;
}

export function CommunityInvites() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/communities/invites")
      .then((r) => (r.ok ? r.json() : { invites: [] }))
      .then((d) => { if (!cancelled) setInvites(d.invites ?? []); })
      .catch(() => { /* an invitations strip is not worth an error state on load */ });
    return () => { cancelled = true; };
  }, []);

  async function respond(inviteId: string, action: "accept" | "decline") {
    setBusy(inviteId);
    setError(null);
    try {
      const res = await fetch("/api/communities/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save your response");
      // Answered either way, it leaves the list.
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your response");
    } finally {
      setBusy(null);
    }
  }

  if (invites.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="invites-heading">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-4 w-4 text-brand" aria-hidden />
        <h2 id="invites-heading" className="text-sm font-bold text-ink">
          {invites.length === 1 ? "1 invitation" : `${invites.length} invitations`}
        </h2>
      </div>

      <ul className="space-y-2">
        {invites.map((invite) => {
          const c = invite.communities;
          if (!c) return null;
          return (
            <li
              key={invite.id}
              className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <Link href={`/community/${c.slug}`} className="text-sm font-semibold text-ink hover:text-brand">
                  {c.name}
                </Link>
                {c.description && (
                  <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{c.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => respond(invite.id, "decline")}
                  disabled={busy === invite.id}
                >
                  Decline
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => respond(invite.id, "accept")}
                  disabled={busy === invite.id}
                >
                  {busy === invite.id ? "…" : "Join"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {error && <p className="text-xs text-error mt-2">{error}</p>}
    </section>
  );
}
