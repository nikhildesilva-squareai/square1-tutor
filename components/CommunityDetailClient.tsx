"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CommunityMessagesTab } from "./CommunityMessagesTab";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  template_type: string;
  category: string;
  is_private: boolean;
  memberCount: number;
  created_at: string;
}

interface Creator {
  id: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Rule {
  id: string;
  rule_text: string;
  order_index: number;
}

interface CommunityMember {
  id: string;
  profileId: string;
  role: string;
  joinedAt: string;
  isMuted: boolean;
  profile: {
    id: string;
    avatar_url: string | null;
    bio: string | null;
  };
  messageCount: number;
}

interface CommunityProfile {
  id: string;
  avatar_url: string | null;
  bio: string | null;
  student_id?: string;
}

interface CommunityDetailClientProps {
  community: Community;
  creator: Creator | null;
  rules: Rule[];
  isMember: boolean;
  userRole?: string;
  isAuthorized: boolean;
  currentUserProfile?: CommunityProfile;
  isFounder?: boolean;
}

export function CommunityDetailClient({
  community,
  creator,
  rules,
  isMember,
  userRole,
  isAuthorized,
  currentUserProfile,
  isFounder = false,
}: CommunityDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"messages" | "members" | "about">("messages");
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileMembers, setProfileMembers] = useState<CommunityProfile[]>([]);

  // Fetch members when tab changes
  useEffect(() => {
    if (activeTab === "members") {
      fetchMembers();
    }
  }, [activeTab]);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      setError(null);

      const response = await fetch(`/api/communities/${community.id}/members?limit=100`);
      if (!response.ok) throw new Error("Failed to fetch members");

      const data = await response.json();
      setMembers(data.members || []);

      // Extract profile data for messages tab
      const profiles = data.members?.map((member: CommunityMember) => ({
        id: member.profile.id,
        avatar_url: member.profile.avatar_url,
        bio: member.profile.bio,
        student_id: member.profile.student_id,
      })) || [];
      setProfileMembers(profiles);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleJoin = async () => {
    if (!isAuthorized) {
      router.push("/login");
      return;
    }

    try {
      setJoining(true);
      setError(null);

      const response = await fetch(`/api/communities/${community.id}/members`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join community");
      }

      // Refresh page to update membership status
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this community?")) return;

    try {
      setLeaving(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${community.id}/members?profileId=${encodeURIComponent(community.id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave community");
      }

      // Redirect to community list
      router.push("/community");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden mb-8" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)" }}>
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 0h1v40H0V0zm39 0h1v40h-1V0zM0 0h40v1H0V0zm0 39h40v1H0v-1z'/%3E%3C/g%3E%3C/svg%3E\")" }}
        />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Creator avatar */}
            {creator && (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg">
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  "C"
                )}
              </div>
            )}

            {/* Name + meta */}
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white mb-2">{community.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white/10 text-white border border-white/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 18c0-1.66 3.58-2.5 6.5-2.5s6.5.84 6.5 2.5V19H5.5v-1z" />
                  </svg>
                  {community.memberCount} member{community.memberCount !== 1 ? "s" : ""}
                </span>
                <span className="text-xs font-medium text-slate-300">{community.category}</span>
              </div>

              {/* Creator info */}
              {creator && (
                <p className="text-xs text-slate-400 mt-3">
                  Created by <span className="font-semibold text-slate-300">{creator.bio || "Community Creator"}</span>
                </p>
              )}
            </div>

            {/* Join/Leave button */}
            {!isMember && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="px-6 py-2.5 rounded-lg bg-white text-slate-900 font-bold text-sm hover:bg-white/90 disabled:opacity-50 transition-all shrink-0"
              >
                {joining ? "Joining..." : "+ Join"}
              </button>
            )}

            {isMember && (
              <div className="flex gap-3 shrink-0">
                {isFounder && (
                  <Link
                    href={`/community/${community.slug}/manage`}
                    className="px-6 py-2.5 rounded-lg bg-purple-500 text-white font-bold text-sm hover:bg-purple-600 transition-all"
                  >
                    ⚙ Manage
                  </Link>
                )}
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="px-6 py-2.5 rounded-lg bg-white/10 text-white font-bold text-sm hover:bg-white/20 disabled:opacity-50 transition-all border border-white/20"
                >
                  {leaving ? "Leaving..." : "Leave"}
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          {community.description && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-slate-300 text-sm leading-relaxed">{community.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      {isMember && (
        <div className="flex gap-2 border-b border-border mb-6">
          {(["messages", "members", "about"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? "text-brand border-brand"
                  : "text-ink-muted border-transparent hover:text-ink"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isMember ? (
        <div>
          {activeTab === "messages" && currentUserProfile && (
            <CommunityMessagesTab
              communityId={community.id}
              currentUserProfile={currentUserProfile}
              communityMembers={profileMembers}
            />
          )}

          {activeTab === "members" && (
            <div>
              {loadingMembers ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center">
                    <svg className="animate-spin h-6 w-6 text-brand" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="p-4 rounded-lg bg-surface border border-border hover:border-brand/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white font-bold shrink-0">
                          {member.profile.avatar_url ? (
                            <img src={member.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            "M"
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink">
                            {member.profile.bio || `Member ${member.profileId.slice(0, 8)}`}
                            {member.role !== "member" && (
                              <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand/10 text-brand">
                                {member.role}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5">
                            Joined {new Date(member.joinedAt).toLocaleDateString()} · {member.messageCount} message{member.messageCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-6">
              {rules.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-ink mb-3">Community Rules</h2>
                  <div className="space-y-2">
                    {rules.map((rule, idx) => (
                      <div key={rule.id} className="p-3 rounded-lg bg-surface border border-border">
                        <p className="text-sm text-ink flex gap-3">
                          <span className="font-bold text-brand shrink-0">{idx + 1}.</span>
                          <span>{rule.rule_text}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-surface border border-border">
                <p className="text-sm text-ink-muted">
                  <span className="font-semibold text-ink">Type:</span> {community.template_type}
                </p>
                <p className="text-sm text-ink-muted mt-2">
                  <span className="font-semibold text-ink">Created:</span> {new Date(community.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-surface border border-border text-center">
          <h2 className="text-lg font-bold text-ink mb-2">Join to view this community</h2>
          <p className="text-sm text-ink-muted mb-6">Click the join button above to become a member and see messages and members.</p>
          {!isAuthorized && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand text-white font-semibold text-sm hover:bg-brand/90 transition-all"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
