"use client";

import { useState, useEffect } from "react";

interface CommunityMember {
  id: string;
  profileId: string;
  role: string;
  joinedAt: string;
  isMuted: boolean;
  messageCount: number;
  profile: {
    id: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

interface CommunityMemberManagementProps {
  communityId: string;
  currentUserRole: string;
  isFounder: boolean;
}

export function CommunityMemberManagement({
  communityId,
  currentUserRole,
  isFounder,
}: CommunityMemberManagementProps) {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [showMutedOnly, setShowMutedOnly] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [muteReason, setMuteReason] = useState("");

  useEffect(() => {
    fetchMembers();
  }, [communityId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/members?limit=100`
      );

      if (!response.ok) throw new Error("Failed to fetch members");

      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (filterRole !== "all" && m.role !== filterRole) return false;
    if (showMutedOnly && !m.isMuted) return false;
    return true;
  });

  const handleUpdateMember = async (
    memberId: string,
    updates: { role?: string; isMuted?: boolean; mutedReason?: string }
  ) => {
    try {
      setActionInProgress(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update member");
      }

      const { member } = await response.json();

      // Update local state
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                role: member.role,
                isMuted: member.isMuted,
              }
            : m
        )
      );

      setSelectedMember(member);
      setMuteReason("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setActionInProgress(false);
    }
  };

  const canManageMembers = isFounder || currentUserRole === "moderator";

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center">
          <svg
            className="animate-spin h-6 w-6 text-brand"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Members List */}
      <div className="lg:col-span-1 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-ink mb-3">
            Members ({members.length})
          </h2>

          {/* Filters */}
          {canManageMembers && (
            <div className="space-y-2 mb-4">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="all">All Roles</option>
                <option value="creator">Creator</option>
                <option value="moderator">Moderator</option>
                <option value="member">Member</option>
              </select>

              <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMutedOnly}
                  onChange={(e) => setShowMutedOnly(e.target.checked)}
                  className="rounded"
                />
                Show Muted Only
              </label>
            </div>
          )}
        </div>

        {/* Members List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedMember?.id === member.id
                  ? "bg-brand/10 border-brand"
                  : "bg-surface border-border hover:border-brand/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                  {member.profile.avatar_url ? (
                    <img
                      src={member.profile.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    "M"
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {member.profile.bio || `User ${member.profileId.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-brand font-bold uppercase">
                    {member.role}
                  </p>
                </div>
              </div>

              {member.isMuted && (
                <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  🔇 Muted
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Member Details & Actions */}
      {selectedMember && canManageMembers && (
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-lg bg-surface border border-border">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white font-bold">
                {selectedMember.profile.avatar_url ? (
                  <img
                    src={selectedMember.profile.avatar_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  "M"
                )}
              </div>

              <div>
                <p className="font-semibold text-ink text-lg">
                  {selectedMember.profile.bio || `User ${selectedMember.profileId.slice(0, 8)}`}
                </p>
                <p className="text-sm text-ink-muted">
                  Joined {new Date(selectedMember.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-white/50 border border-border mb-4">
              <div className="text-center">
                <p className="text-xs text-ink-muted uppercase">Role</p>
                <p className="text-sm font-bold text-ink capitalize">
                  {selectedMember.role}
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs text-ink-muted uppercase">Status</p>
                <p className={`text-sm font-bold ${selectedMember.isMuted ? "text-red-600" : "text-green-600"}`}>
                  {selectedMember.isMuted ? "Muted" : "Active"}
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs text-ink-muted uppercase">Messages</p>
                <p className="text-sm font-bold text-ink">
                  {selectedMember.messageCount}
                </p>
              </div>
            </div>
          </div>

          {/* Role Management */}
          {isFounder && selectedMember.role !== "creator" && (
            <div className="p-4 rounded-lg bg-surface border border-border">
              <p className="text-sm font-bold text-ink-muted uppercase mb-3">
                Role
              </p>

              <div className="space-y-2">
                <button
                  onClick={() =>
                    handleUpdateMember(selectedMember.id, { role: "member" })
                  }
                  disabled={
                    actionInProgress || selectedMember.role === "member"
                  }
                  className={`w-full px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    selectedMember.role === "member"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  } disabled:opacity-50`}
                >
                  Member
                </button>

                <button
                  onClick={() =>
                    handleUpdateMember(selectedMember.id, { role: "moderator" })
                  }
                  disabled={
                    actionInProgress || selectedMember.role === "moderator"
                  }
                  className={`w-full px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    selectedMember.role === "moderator"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  } disabled:opacity-50`}
                >
                  Moderator
                </button>
              </div>
            </div>
          )}

          {/* Mute/Unmute */}
          <div className="p-4 rounded-lg bg-surface border border-border">
            <p className="text-sm font-bold text-ink-muted uppercase mb-3">
              Moderation
            </p>

            {!selectedMember.isMuted ? (
              <div className="space-y-2">
                <textarea
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  placeholder="Reason for muting (optional)..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/50"
                  rows={2}
                />

                <button
                  onClick={() =>
                    handleUpdateMember(selectedMember.id, {
                      isMuted: true,
                      mutedReason: muteReason || undefined,
                    })
                  }
                  disabled={actionInProgress}
                  className="w-full px-3 py-2 rounded-lg bg-orange-100 text-orange-700 font-semibold text-sm hover:bg-orange-200 disabled:opacity-50 transition-colors"
                >
                  🔇 Mute Member
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  handleUpdateMember(selectedMember.id, { isMuted: false })
                }
                disabled={actionInProgress}
                className="w-full px-3 py-2 rounded-lg bg-green-100 text-green-700 font-semibold text-sm hover:bg-green-200 disabled:opacity-50 transition-colors"
              >
                🔊 Unmute Member
              </button>
            )}
          </div>

          {/* Info */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
            <p>
              <strong>Creator:</strong> Can manage all aspects of the community
            </p>
            <p className="mt-2">
              <strong>Moderator:</strong> Can review messages and manage members
            </p>
            <p className="mt-2">
              <strong>Member:</strong> Can post messages and participate
            </p>
            <p className="mt-2">
              <strong>Muted:</strong> Cannot post messages but can still read
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
