"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Lock, Globe, Share2, Shield, Check } from "lucide-react";
import { CommunityMessagesTab } from "./CommunityMessagesTab";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  is_private: boolean;
  memberCount: number;
  cover_url?: string | null;
  icon_url?: string | null;
}

interface CommunityDetailClientProps {
  community: Community;
  creator?: { id: string; avatar_url?: string; bio?: string };
  rules?: Array<{ id: string; rule_text: string }>;
  isMember: boolean;
  userRole?: string;
  isAuthorized: boolean;
  currentUserProfile?: { id: string; avatar_url: string | null; bio: string | null; student_id?: string } | null;
  isFounder: boolean;
}

export function CommunityDetailClient({
  community,
  rules = [],
  isMember,
  userRole,
  isAuthorized,
  currentUserProfile,
  isFounder,
}: CommunityDetailClientProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [joined, setJoined] = useState(isMember);
  const [copied, setCopied] = useState(false);

  useEffect(() => setJoined(isMember), [isMember]);

  const canManage = isFounder || userRole === "moderator";
  const memberLabel = `${community.memberCount} ${community.memberCount === 1 ? "member" : "members"}`;

  const handleJoin = async () => {
    if (!isAuthorized) {
      window.location.href = "/login";
      return;
    }
    setIsJoining(true);
    try {
      const res = await fetch(`/api/communities/${community.id}/members`, { method: "POST" });
      if (res.ok) {
        setJoined(true);
        // Reload so the server re-renders with membership (chat access) resolved.
        setTimeout(() => window.location.reload(), 600);
      }
    } catch (e) {
      console.error("Failed to join community:", e);
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All communities
      </Link>

      {/* Header */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_0_rgba(21,47,84,0.04)]">
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand to-brand-dark sm:h-52">
          {community.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={community.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {!community.cover_url && (
            <span className="pointer-events-none absolute -bottom-4 right-6 select-none text-[120px] font-bold leading-none text-white/15">
              {community.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-surface-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
                  {community.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-ink-secondary">
                  {community.is_private ? (
                    <><Lock className="h-3 w-3" /> Private</>
                  ) : (
                    <><Globe className="h-3 w-3" /> Public</>
                  )}
                </span>
                {canManage && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                    <Shield className="h-3 w-3" /> {isFounder ? "Founder" : "Moderator"}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">{community.name}</h1>
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-ink-muted">
                <Users className="h-4 w-4" /> {memberLabel}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleShare}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
              >
                {copied ? <><Check className="h-4 w-4 text-success" /> Copied</> : <><Share2 className="h-4 w-4" /> Share</>}
              </button>
              {canManage && (
                <Link
                  href={`/community/${community.slug}/manage`}
                  className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
                >
                  Manage
                </Link>
              )}
            </div>
          </div>

          {community.description ? (
            <p className="max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-ink-secondary">
              {community.description}
            </p>
          ) : (
            <p className="text-[15px] text-ink-muted">No description yet.</p>
          )}

          {joined ? (
            <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-success-bg px-5 text-[15px] font-semibold text-success">
              <Check className="h-4 w-4" /> You&apos;re a member
            </span>
          ) : (
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-semibold text-white transition-all hover:bg-brand-dark disabled:opacity-60"
            >
              {isJoining ? "Joining…" : isAuthorized ? "Join community" : "Sign in to join"}
            </button>
          )}
        </div>
      </section>

      {/* Rules */}
      {rules.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="mb-4 text-lg font-bold text-ink">Community rules</h2>
          <ol className="space-y-3">
            {rules.map((r, i) => (
              <li key={r.id} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-tint text-[13px] font-bold text-brand">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed text-ink-secondary">{r.rule_text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Community chat */}
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="mb-1 text-lg font-bold text-ink">Community chat</h2>
        <p className="mb-5 text-sm text-ink-muted">Talk with other members in real time.</p>
        {joined && currentUserProfile ? (
          <CommunityMessagesTab
            communityId={community.id}
            currentUserProfile={currentUserProfile}
            communityMembers={[]}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-soft px-6 py-12 text-center">
            <Lock className="h-8 w-8 text-ink-muted" />
            <p className="text-[15px] font-medium text-ink">Join to unlock the chat</p>
            <p className="text-sm text-ink-muted">Only members can read and post messages in this community.</p>
          </div>
        )}
      </section>
    </div>
  );
}
