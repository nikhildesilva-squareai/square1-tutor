"use client";

import { useState } from "react";
import Link from "next/link";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  is_private: boolean;
  memberCount: number;
  monthlyPrice?: number;
  thumbnail_url?: string;
}

interface Creator {
  id: string;
  avatar_url?: string;
  bio?: string;
}

interface Member {
  id: string;
  avatar_url?: string;
  name?: string;
}

interface CommunityDetailJoinedClientProps {
  community: Community;
  creator?: Creator;
  members?: Member[];
  isMember: boolean;
  userRole?: string;
  currentUserProfile?: any;
  isFounder: boolean;
}

type Tab = "community" | "members" | "about";

export function CommunityDetailJoinedClient({
  community,
  creator,
  members = [],
  isMember,
  userRole,
  currentUserProfile,
  isFounder,
}: CommunityDetailJoinedClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(community.description || "");
  const [isSaving, setIsSaving] = useState(false);

  const onlineCount = Math.floor(members.length * 0.4);
  const adminCount = Math.floor(members.length * 0.05);

  const handleSaveDescription = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/communities/${community.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        setIsEditingDescription(false);
      }
    } catch (error) {
      console.error("Failed to save description:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("community")}
              className={`py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === "community"
                  ? "text-neutral-900 border-b-2 border-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Community
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === "members"
                  ? "text-neutral-900 border-b-2 border-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === "about"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              About
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Panel */}
          <div className="col-span-2 space-y-6">
            {/* Community Title */}
            <h1 className="text-2xl font-bold text-neutral-900">
              {community.name}
            </h1>

            {/* About Tab Content */}
            {activeTab === "about" && (
              <>
                {/* Media Upload Section */}
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <label className="block text-sm font-medium text-neutral-900 mb-4">
                    That Pickleball School
                  </label>
                  <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-neutral-900"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.67}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">
                          Click to upload
                        </p>
                        <p className="text-xs text-neutral-400">
                          or drag and drop
                        </p>
                      </div>
                      <p className="text-xs text-neutral-400">
                        MP4 or MOV (max. 200 MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gallery Section */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-32 h-20 rounded-md bg-blue-50 border-2 border-dashed border-blue-300 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors relative"
                    >
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.67}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  ))}
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between py-4 border-t border-neutral-200">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-neutral-700"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span className="text-sm font-semibold text-neutral-700">
                        Private
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-neutral-700"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="text-sm font-semibold text-neutral-700">
                        1.4k members
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-neutral-700"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 6v6m3-3H9" />
                      </svg>
                      <span className="text-sm font-semibold text-neutral-700">
                        ${community.monthlyPrice || "49"}/month
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {creator?.avatar_url && (
                      <img
                        src={creator.avatar_url}
                        alt={creator.id}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm text-neutral-700">
                      Create by Kyle Koszuta
                    </span>
                  </div>
                </div>

                {/* Description Section */}
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <div className="p-6 border-b border-neutral-200">
                    <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                      Description
                    </h2>

                    {isEditingDescription ? (
                      <div className="space-y-4">
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe about your community"
                          rows={5}
                          className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => setIsEditingDescription(false)}
                            className="px-5 py-2 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveDescription}
                            disabled={isSaving}
                            className="px-5 py-2 bg-gradient-to-b from-blue-500 to-blue-700 text-white text-sm font-medium rounded-lg hover:shadow-lg disabled:opacity-50 transition-shadow"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          {description ||
                            "No description added yet. Click edit to add one."}
                        </p>
                        <button
                          onClick={() => setIsEditingDescription(true)}
                          className="px-5 py-2 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          Edit Description
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Members Tab Placeholder */}
            {activeTab === "members" && (
              <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
                <p className="text-neutral-600">Members view coming soon</p>
              </div>
            )}

            {/* Community Tab Placeholder */}
            {activeTab === "community" && (
              <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
                <p className="text-neutral-600">Community feed coming soon</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden sticky top-8">
              {/* Preview Image */}
              <div className="relative bg-gradient-to-br from-purple-400 via-purple-500 to-cyan-400 h-40 overflow-hidden">
                <img
                  src={community.thumbnail_url || "https://via.placeholder.com/360x180"}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-sky-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                  #1
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Title & Link */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-neutral-900 line-clamp-2">
                    {community.name}
                  </h3>
                  <p className="text-xs text-blue-600">
                    Square1.Ai/Community/{community.slug}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm text-neutral-600 line-clamp-3">
                  {community.description ||
                    "The Last Language App You'll Ever Need. From your first word to full fluency Migaku supports every step."}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-neutral-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-neutral-900">
                      1.4K
                    </div>
                    <div className="text-xs text-neutral-600">Members</div>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-neutral-900">
                      36
                    </div>
                    <div className="text-xs text-neutral-600">Online</div>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-neutral-900">
                      10
                    </div>
                    <div className="text-xs text-neutral-600">Admins</div>
                  </div>
                </div>

                {/* Invite Button */}
                <button className="w-full py-3 rounded-lg font-medium text-white bg-gradient-to-b from-blue-500 to-blue-700 hover:shadow-lg transition-shadow">
                  Invite people
                </button>

                {/* Member Avatars */}
                <div className="flex items-center gap-1">
                  {members.slice(0, 8).map((member, i) => (
                    <img
                      key={member.id}
                      src={member.avatar_url || "https://via.placeholder.com/32"}
                      alt={member.name || "Member"}
                      className="w-7 h-7 rounded-full border border-white"
                      style={{ marginLeft: i > 0 ? "-8px" : "0" }}
                    />
                  ))}
                  {members.length > 8 && (
                    <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-semibold">
                      +{members.length - 8}
                    </div>
                  )}
                </div>

                {/* Powered By */}
                <div className="text-center pt-2">
                  <p className="text-xs text-neutral-500">
                    Powered by{" "}
                    <Link href="/" className="text-blue-600 hover:underline">
                      Square1 AI
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
