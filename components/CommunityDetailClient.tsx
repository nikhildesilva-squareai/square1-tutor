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
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Community Title Section */}
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4">
                {community.category}
              </span>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 leading-tight">
                {community.name}
              </h1>
              <p className="text-lg text-slate-600">
                Connect with passionate members and grow your skills
              </p>
            </div>

            {/* Hero Image Card */}
            <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/60 shadow-xl">
              <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 aspect-video overflow-hidden group">
                {community.thumbnail_url ? (
                  <img
                    src={community.thumbnail_url}
                    alt={community.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 via-cyan-600 to-slate-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-blue-400/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-56 h-56 bg-purple-400/20 rounded-full blur-3xl" />
                    <div className="relative z-10 text-white/30">
                      <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM15 20a3 3 0 01-6 0" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Premium rank badge */}
                <div className="absolute top-6 left-6 z-10">
                  <div className="px-5 py-2 rounded-full bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg border border-white/30 text-white text-sm font-bold">
                    Premium Community
                  </div>
                </div>

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Media Gallery */}
              <div className="p-6 border-t border-white/20">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Gallery</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-40 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-blue-400 transition-all duration-300 cursor-pointer hover:scale-105"
                    >
                      <img
                        src={img}
                        alt={`Gallery ${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Privacy */}
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/60 p-5 text-center hover:shadow-lg transition-all">
                <div className="flex justify-center mb-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-blue-600"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {community.is_private ? "Private" : "Public"}
                </p>
              </div>

              {/* Members */}
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/60 p-5 text-center hover:shadow-lg transition-all">
                <div className="flex justify-center mb-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-blue-600"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-slate-900">{(community.memberCount || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-600 uppercase tracking-wider">Members</p>
              </div>

              {/* Price */}
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/60 p-5 text-center hover:shadow-lg transition-all">
                <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ${community.monthlyPrice || "49"}
                </p>
                <p className="text-xs text-slate-600 uppercase tracking-wider">/month</p>
              </div>
            </div>
              </div>

            {/* Description Section */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-xl p-8 space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  About This Community
                </h2>

                <div className="space-y-4">
                  <p className="text-base text-slate-600 leading-relaxed">
                    {community.description ||
                      "The 3.5 to 4.0 in 30 Days Challenge starts Monday, February 2nd. Click the video above to get more info. ThatPickleballSchool helps you see the game differently and play your best pickleball ever. I'm Kyle \"ThatPickleballGuy\" Koszuta. I went from never playing to a top 10 pro on the APP Tour in less than 3 years. I will help you overcome your biggest pickleball challenge."}
                  </p>

                  {isDescriptionExpanded && (
                    <p className="text-base text-slate-600 leading-relaxed">
                      Join our community to access exclusive content, connect with like-minded members, and grow your skills together. We host regular events, webinars, and networking opportunities to help you succeed.
                    </p>
                  )}
                </div>

                {/* Show More Button */}
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors mt-4"
                >
                  <span>{isDescriptionExpanded ? "Show less" : "Show more"}</span>
                  <svg
                    width="18"
                    height="18"
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

              {/* Creator Info Card */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Created by
                </h3>
                <div className="flex items-center gap-4">
                  {creator?.avatar_url && (
                    <img
                      src={creator.avatar_url}
                      alt={creator.id}
                      className="w-16 h-16 rounded-full border-2 border-blue-600"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">Kyle Koszuta</p>
                    <p className="text-sm text-slate-600">
                      {creator?.bio || "Community Creator"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Stats & Join */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Main Card */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-xl overflow-hidden">
                {/* Preview Image */}
                <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 h-48 overflow-hidden group">
                  <img
                    src={community.thumbnail_url || "https://via.placeholder.com/360x180"}
                    alt={community.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Premium badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="px-4 py-2 rounded-full bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg border border-white/30 text-white text-xs font-bold">
                      Featured
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Title & Info */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-lg line-clamp-2">
                      {community.name}
                    </h3>
                    <p className="text-sm text-blue-600 font-medium">
                      square1.ai/community/{community.slug}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {community.description ||
                      "Join this vibrant community and connect with like-minded members from around the world."}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {(community.memberCount || 1400).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-600 uppercase tracking-wider mt-1">Members</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">36</p>
                      <p className="text-xs text-slate-600 uppercase tracking-wider mt-1">Online</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">10</p>
                      <p className="text-xs text-slate-600 uppercase tracking-wider mt-1">Admins</p>
                    </div>
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={handleJoinClick}
                    disabled={isMember || isJoining}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 text-white text-base mt-6 ${
                      isMember || isJoining
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
                    }`}
                  >
                    {isMember ? "Already Joined" : isJoining ? "Joining..." : "Join Community"}
                  </button>

                  {/* Powered By */}
                  <div className="text-center pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-600">
                      Powered by{" "}
                      <Link href="/" className="text-blue-600 font-semibold hover:underline">
                        Square1 AI
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6">
                <h4 className="font-semibold text-slate-900 mb-3">Ready to join?</h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Gain access to exclusive content, network with {(community.memberCount || 1400).toLocaleString()}+ members, and grow your skills.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
