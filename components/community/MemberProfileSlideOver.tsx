"use client";

import { useEffect, useState } from "react";
import { X, BadgeCheck, Send, NotebookText, ChevronRight, Loader2 } from "lucide-react";
import type { ProfileDetail } from "@/lib/community/feed-types";
import { Avatar } from "./Avatar";

interface Props {
  profileId: string | null;
  onClose: () => void;
  onFollow: (profileId: string, next: boolean) => void;
  onMessage: (profileId: string) => void;
}

export function MemberProfileSlideOver({ profileId, onClose, onFollow, onMessage }: Props) {
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) {
      setProfile(null);
      return;
    }
    let active = true;
    setLoading(true);
    fetch(`/api/community-profile/${profileId}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setProfile(d.profile ?? null);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (profileId) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profileId, onClose]);

  if (!profileId) return null;

  const toggleFollow = () => {
    if (!profile) return;
    const next = !profile.followsThem;
    setProfile({ ...profile, followsThem: next, stats: { ...profile.stats, followers: profile.stats.followers + (next ? 1 : -1) } });
    onFollow(profile.profileId, next);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        <div className="relative">
          <div className="h-24 bg-gradient-to-br from-brand to-brand-dark" />
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-md bg-surface/90 text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute -bottom-9 left-6">
            {profile ? (
              <Avatar
                name={profile.name}
                initials={profile.initials}
                avatarUrl={profile.avatarUrl}
                size={72}
                className="border-4 border-surface"
              />
            ) : (
              <div className="h-[72px] w-[72px] rounded-full border-4 border-surface bg-surface-alt" />
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-12">
          {loading && !profile ? (
            <div className="flex items-center gap-2 text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
            </div>
          ) : profile ? (
            <>
              <h2 className="text-2xl font-bold text-ink">{profile.name}</h2>
              <div className="mt-0.5 text-[15px] text-ink-muted">{profile.role}</div>

              {profile.enrolled && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1 text-[13px] font-medium text-success">
                  <BadgeCheck className="h-[15px] w-[15px]" />
                  {profile.enrolled}
                </div>
              )}

              {profile.bio && <p className="mt-4 text-[15px] leading-relaxed text-ink-secondary">{profile.bio}</p>}

              <div className="mt-4 flex gap-6">
                <div>
                  <span className="text-lg font-bold text-ink">{profile.stats.posts}</span>{" "}
                  <span className="text-sm text-ink-muted">posts</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-ink">{profile.stats.followers}</span>{" "}
                  <span className="text-sm text-ink-muted">followers</span>
                </div>
              </div>

              {!profile.isSelf && (
                <div className="mt-5 flex gap-2.5">
                  <button
                    onClick={toggleFollow}
                    className={
                      profile.followsThem
                        ? "h-10 rounded-md border border-border bg-surface px-5 text-[15px] font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
                        : "h-10 rounded-md bg-brand px-5 text-[15px] font-medium text-white transition-colors hover:bg-brand-dark"
                    }
                  >
                    {profile.followsThem ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={() => onMessage(profile.profileId)}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-5 text-[15px] font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
                  >
                    <Send className="h-[17px] w-[17px]" /> Message
                  </button>
                </div>
              )}

              {profile.skills.length > 0 && (
                <div className="mt-7">
                  <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-muted">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((sk) => (
                      <span key={sk} className="rounded-full bg-surface-alt px-3 py-1 text-[13px] font-medium text-ink-secondary">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.sharedNotes.length > 0 && (
                <div className="mt-7">
                  <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-muted">Shared notes</div>
                  <div className="flex flex-col gap-2.5">
                    {profile.sharedNotes.map((nt, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3.5">
                        <NotebookText className="h-[18px] w-[18px] shrink-0 text-brand" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink text-sm">{nt.topic}</div>
                          {nt.course && <div className="text-[13px] text-ink-muted">{nt.course}</div>}
                        </div>
                        <ChevronRight className="h-4 w-4 text-ink-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-ink-muted">Couldn&apos;t load this profile.</div>
          )}
        </div>
      </div>
    </div>
  );
}
