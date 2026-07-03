"use client";

import { useState } from "react";

interface Member {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  isFollowing: boolean;
  followerCount: number;
}

interface MemberFollowClientProps {
  members: Member[];
  currentUserId: string;
  onFollowChange?: (memberId: string, isFollowing: boolean) => void;
}

export function MemberFollowClient({
  members,
  currentUserId,
  onFollowChange,
}: MemberFollowClientProps) {
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(
    members.reduce((acc, m) => ({ ...acc, [m.id]: m.isFollowing }), {})
  );
  const [loading, setLoading] = useState<string | null>(null);

  const handleFollow = async (memberId: string) => {
    if (memberId === currentUserId) return;

    setLoading(memberId);
    try {
      const isCurrentlyFollowing = followingMap[memberId];
      const endpoint = isCurrentlyFollowing ? "unfollow" : "follow";

      const response = await fetch(
        `/api/members/${memberId}/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        setFollowingMap((prev) => ({
          ...prev,
          [memberId]: !prev[memberId],
        }));
        onFollowChange?.(memberId, !isCurrentlyFollowing);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const isFollowing = followingMap[member.id];
        const isCurrentUser = member.id === currentUserId;

        return (
          <div
            key={member.id}
            className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1">
              <img
                src={member.avatar_url || "https://via.placeholder.com/40"}
                alt={member.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">
                  {member.name}
                </h3>
                <p className="text-xs text-neutral-500">
                  {member.followerCount} followers
                </p>
                {member.bio && (
                  <p className="text-sm text-neutral-600 line-clamp-1">
                    {member.bio}
                  </p>
                )}
              </div>
            </div>

            {!isCurrentUser && (
              <button
                onClick={() => handleFollow(member.id)}
                disabled={loading === member.id}
                className={`ml-4 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isFollowing
                    ? "bg-neutral-100 text-neutral-900 border border-neutral-200 hover:bg-neutral-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === member.id
                  ? "..."
                  : isFollowing
                    ? "Following"
                    : "Follow"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
