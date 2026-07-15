"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { SuggestedMember } from "@/lib/community/feed-types";
import { Avatar } from "./Avatar";

interface PeopleToFollowProps {
  onFollow: (profileId: string, next: boolean) => void;
  onMessage: (profileId: string) => void;
  onOpenProfile: (profileId: string) => void;
  /** Bump this to refetch (e.g. after following from a post). */
  followVersion: number;
}

export function PeopleToFollow({ onFollow, onMessage, onOpenProfile, followVersion }: PeopleToFollowProps) {
  const [members, setMembers] = useState<SuggestedMember[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/members/suggestions?limit=5")
      .then((r) => r.json())
      .then((d) => {
        if (active) setMembers(d.members ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [followVersion]);

  const toggle = (m: SuggestedMember) => {
    const next = !m.followsThem;
    setMembers((arr) => arr.map((x) => (x.profileId === m.profileId ? { ...x, followsThem: next } : x)));
    onFollow(m.profileId, next);
  };

  if (members.length === 0) return null;

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
      <div className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_0_rgba(21,47,84,0.04)]">
        <div className="mb-4 text-[13px] font-bold uppercase tracking-wide text-ink-muted">People to follow</div>
        <div className="flex flex-col gap-5">
          {members.map((m) => (
            <div key={m.profileId} className="flex items-center gap-3">
              <button onClick={() => onOpenProfile(m.profileId)} className="shrink-0">
                <Avatar name={m.name} initials={m.initials} avatarUrl={m.avatarUrl} size={40} />
              </button>
              <button onClick={() => onOpenProfile(m.profileId)} className="min-w-0 flex-1 text-left">
                <div className="truncate font-semibold text-ink text-sm">{m.name}</div>
                <div className="truncate text-xs text-ink-muted">{m.role}</div>
              </button>
              <div className="flex gap-1.5">
                <button
                  onClick={() => toggle(m)}
                  className={
                    m.followsThem
                      ? "h-8 whitespace-nowrap rounded-md border border-border bg-surface px-3 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
                      : "h-8 whitespace-nowrap rounded-md bg-brand px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-dark"
                  }
                >
                  {m.followsThem ? "Following" : "Follow"}
                </button>
                <button
                  onClick={() => onMessage(m.profileId)}
                  title="Message"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface transition-colors hover:bg-surface-alt"
                >
                  <Send className="h-4 w-4 text-ink-secondary" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
