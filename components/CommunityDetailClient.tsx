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

interface CommunityDetailClientProps {
  community: Community;
  creator?: Creator;
  rules?: Array<{ id: string; rule_text: string }>;
  isMember: boolean;
  userRole?: string;
  isAuthorized: boolean;
  currentUserProfile?: any;
  isFounder: boolean;
}

export function CommunityDetailClient({
  community,
  creator,
  rules,
  isMember,
  userRole,
  isAuthorized,
  currentUserProfile,
  isFounder,
}: CommunityDetailClientProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinClick = async () => {
    if (!isAuthorized) {
      window.location.href = "/login";
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(`/api/communities/${community.id}/members`, {
        method: "POST",
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to join community:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const galleryImages = [
    community.thumbnail_url,
    "https://via.placeholder.com/140x75",
    "https://via.placeholder.com/140x75",
    "https://via.placeholder.com/140x75",
    "https://via.placeholder.com/140x75",
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-xl overflow-hidden">
              {/* Header Section */}
              <div className="p-8 space-y-5">
                {/* Community Title */}
                <h1 className="text-2xl font-semibold text-neutral-900">
                  {community.name}
                </h1>

                {/* Hero Image with Rank Badge - Fixed aspect ratio to prevent CLS */}
                <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg overflow-hidden w-full aspect-video">
                  {community.thumbnail_url ? (
                    <img
                      src={community.thumbnail_url}
                      alt={`${community.name} community cover image`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600" aria-hidden="true" />
                  )}

                  {/* Rank Badge */}
                  <div className="absolute top-3 left-3 bg-sky-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold" aria-label="Top ranked community">
                    #1
                  </div>
                </div>

                {/* Media Gallery */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`flex-shrink-0 w-32 h-20 rounded-md overflow-hidden bg-neutral-100 ${
                        idx === 1 ? "ring-2 ring-blue-600" : ""
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Gallery ${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                  <div className="flex gap-6">
                    {/* Private Badge */}
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

                    {/* Member Count */}
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

                    {/* Price */}
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

                  {/* Creator Info */}
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
              </div>

              {/* Description Section */}
              <div className="border-t border-neutral-200 p-8 space-y-4">
                <h2 className="text-2xl font-semibold text-neutral-900">
                  Description
                </h2>

                <div className="space-y-3">
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    The 3.5 to 4.0 in 30 Days Challenge starts Monday, February 2nd.
                    Click the video above to get more info. ThatPickleballSchool helps
                    you see the game differently and play your best pickleball ever.
                    I'm Kyle "ThatPickleballGuy" Koszuta. I went from never playing to
                    a top 10 pro on the APP Tour in less than 3 years. I will help you
                    overcome your biggest pickleball challenge.
                  </p>

                  {isDescriptionExpanded && (
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      Merch Store In Person Clinics Our Codes - Product Partners
                    </p>
                  )}
                </div>

                {/* Show More Button */}
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <span>Show {isDescriptionExpanded ? "less" : "more"}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform ${
                      isDescriptionExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Stats & Join */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-xl overflow-hidden sticky top-8">
              {/* Preview Image - Fixed aspect ratio to prevent CLS */}
              <div className="relative bg-gradient-to-br from-purple-400 via-purple-500 to-cyan-400 w-full aspect-video overflow-hidden">
                <img
                  src={community.thumbnail_url || "https://via.placeholder.com/360x180"}
                  alt={`${community.name} community preview`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-sky-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold" aria-label="Top ranked community">
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
                    "The Last Language App You'll Ever Need. From your first word to full fluency."}
                </p>

                {/* Stats Grid - Improved contrast */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-100 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-slate-900">
                      1.4K
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-1">Members</div>
                  </div>
                  <div className="bg-slate-100 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-slate-900">
                      36
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-1">Online</div>
                  </div>
                  <div className="bg-slate-100 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-slate-900">
                      10
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-1">Admins</div>
                  </div>
                </div>

                {/* Join Button - Min 44px height for touch target */}
                <button
                  onClick={handleJoinClick}
                  disabled={isMember || isJoining}
                  className={`w-full py-3 rounded-lg font-medium transition-all text-white min-h-[48px] flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isMember || isJoining
                      ? "bg-slate-400 cursor-not-allowed opacity-75"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/50 active:scale-95 focus:ring-blue-500"
                  }`}
                  aria-label={isMember ? "You are already a member" : "Join this community"}
                  aria-busy={isJoining}
                >
                  {isJoining && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isMember ? "Already Joined" : isJoining ? "Joining..." : "Join Community"}
                </button>

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
