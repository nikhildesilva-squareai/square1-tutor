"use client";

import { useState } from "react";
import Link from "next/link";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  memberCount: number;
  icon_url?: string;
  is_free: boolean;
}

interface Comment {
  id: string;
  author: string;
  avatar_url?: string;
  text: string;
  timestamp: string;
  likes: number;
  replies: number;
}

interface CommunityPost {
  id: string;
  community: Community;
  description: string;
  likes: number;
  comments: number;
  commenters: Array<{ avatar_url?: string }>;
  latestComment?: Comment;
}

interface UserStats {
  contributions: number;
  followers: number;
  following: number;
}

interface UserProfileClientProps {
  userName: string;
  bio: string;
  avatar_url?: string;
  isOnline: boolean;
  stats: UserStats;
  ownedCommunities: CommunityPost[];
  memberCommunities: Community[];
  activityGraph?: string;
}

export function UserProfileClient({
  userName,
  bio,
  avatar_url,
  isOnline,
  stats,
  ownedCommunities,
  memberCommunities,
  activityGraph,
}: UserProfileClientProps) {
  const [followingUser, setFollowingUser] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-4 gap-8">
          {/* Left Sidebar - User Card */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden sticky top-8">
              {/* Profile Card Content */}
              <div className="flex flex-col items-center gap-6 p-10">
                {/* Avatar */}
                <img
                  src={avatar_url || "https://via.placeholder.com/180"}
                  alt={userName}
                  className="w-44 h-44 rounded-full border-4 border-blue-100"
                />

                {/* User Info */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-neutral-400 font-medium">Community</p>
                  <h1 className="text-2xl font-semibold text-neutral-900">
                    {userName}
                  </h1>
                </div>

                {/* Bio */}
                <p className="text-center text-sm text-neutral-500 leading-relaxed">
                  {bio}
                </p>

                {/* Divider */}
                <div className="w-full h-px bg-neutral-100" />

                {/* Online Status */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="text-xs font-medium text-green-600">
                    Online
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="w-full grid grid-cols-3 gap-3">
                  <div className="bg-neutral-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-neutral-900">
                      {stats.contributions}
                    </div>
                    <div className="text-xs text-neutral-600">Contribution</div>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-neutral-900">
                      {(stats.followers / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-neutral-600">Followers</div>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-neutral-900">
                      {stats.following}
                    </div>
                    <div className="text-xs text-neutral-600">Following</div>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-neutral-100" />

                {/* Follow Button */}
                <button
                  onClick={() => setFollowingUser(!followingUser)}
                  className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    followingUser
                      ? "bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                      : "bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  {followingUser ? "Following" : "Follow"}
                </button>
              </div>
            </div>
          </div>

          {/* Center - Activity Feed */}
          <div className="col-span-3 space-y-8">
            {/* Activity Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-800">Activity</h2>
              {activityGraph && (
                <div className="bg-white rounded-lg border border-neutral-200 p-6 h-48 flex items-center justify-center">
                  <img
                    src={activityGraph}
                    alt="Activity graph"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              )}
            </div>

            {/* Owned Communities */}
            {ownedCommunities.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-800">
                  Owned by {userName}
                </h3>
                <div className="space-y-4">
                  {ownedCommunities.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6 relative"
                    >
                      {/* Community Header */}
                      <div className="flex gap-6">
                        <div className="flex gap-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-700 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900">
                              {post.community.name}
                            </h4>
                            <p className="text-xs text-neutral-400 flex items-center gap-1">
                              <span className="font-medium">Free</span>
                              <span>•</span>
                              <span className="font-medium">
                                {post.community.memberCount}k members
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-neutral-600 line-clamp-2">
                        {post.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-8 text-xs text-neutral-400">
                        <div className="flex items-center gap-1">
                          <span>👍</span>
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>💬</span>
                          <span>{post.comments}</span>
                        </div>
                      </div>

                      {/* View Button */}
                      <button className="absolute top-6 right-6 px-5 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memberships Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-800">
                Memberships (0 in common)
              </h3>
              <div className="grid gap-4">
                {memberCommunities.map((community) => (
                  <div
                    key={community.id}
                    className="bg-white rounded-lg border border-neutral-200 p-6"
                  >
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-700 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900">
                          {community.name}
                        </h4>
                        <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                          <span className="font-medium">
                            {community.is_free ? "Free" : "Paid"}
                          </span>
                          <span>•</span>
                          <span className="font-medium">
                            {community.memberCount}k members
                          </span>
                        </p>
                        <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                          {community.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-800">
                Memberships (0 in common)
              </h3>
              <div className="space-y-4">
                {ownedCommunities.map((post) => (
                  <div key={post.id} className="space-y-4">
                    {post.latestComment && (
                      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
                        <div className="flex gap-3">
                          <img
                            src={
                              post.latestComment.avatar_url ||
                              "https://via.placeholder.com/40"
                            }
                            alt={post.latestComment.author}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="bg-neutral-50 rounded p-3 border border-neutral-100">
                              <p className="text-sm font-medium text-neutral-900">
                                {post.latestComment.author}{" "}
                                <span className="font-normal text-neutral-400 text-xs">
                                  0 likes • {post.latestComment.timestamp}
                                </span>
                              </p>
                              <p className="text-sm text-neutral-600 mt-1">
                                {post.latestComment.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
