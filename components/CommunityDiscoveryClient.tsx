"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  "All",
  "Music",
  "Design",
  "Business management",
  "Learn AI Tech",
  "IT & Software",
  "Finance & Accounting",
  "Sciences & Technology",
  "Sports",
];

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  template_type: string;
  category: string;
  is_private: boolean;
  creator_id: string;
  memberCount: number;
  created_at: string;
  monthlyPrice?: number;
  annualPrice?: number;
  thumbnail_url?: string;
}

export function CommunityDiscoveryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const itemsPerPage = 8;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    if (currentPage > 1) params.set("page", currentPage.toString());

    const queryString = params.toString();
    router.push(`?${queryString}`, { scroll: false });
  }, [selectedCategory, search, currentPage, router]);

  useEffect(() => {
    fetchCommunities();
    setCurrentPage(1);
  }, [selectedCategory, search]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory !== "All") {
        params.append("category", selectedCategory);
      }
      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/communities?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch communities");
      }

      const data = await response.json();
      setCommunities(data.communities || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | undefined): string => {
    if (!price) return "Free";
    return `$${price.toFixed(2)}`;
  };

  const formatMemberCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k members`;
    }
    return `${count} members`;
  };

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCommunities = communities.slice(startIndex, endIndex);
  const totalPages = Math.ceil(communities.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Hero Banner */}
      <div className="relative w-screen -mx-[calc((100vw-100%)/2)] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-16 px-4 mb-12 overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="mb-3">
            <span className="inline-block px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium uppercase tracking-widest">
              ✨ Explore Communities
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-tight">
            Find Your <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Community</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with like-minded people, share ideas, and grow together
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-3xl mx-auto group">
            <label htmlFor="community-search" className="sr-only">
              Search communities by name, category, or keywords
            </label>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur" aria-hidden="true" />
              <div className="relative">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  id="community-search"
                  type="text"
                  placeholder="Search by name, category, or keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-14 pr-5 py-3 rounded-xl bg-white/95 backdrop-blur-sm border border-white/20 text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                  aria-label="Search communities"
                />
              </div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex justify-center gap-3 mt-7">
            <Link href="/community/create">
              <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105">
                Create Community
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Category Filters */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Filter by Interest</h2>
          </div>
          <div className="flex flex-wrap gap-3" role="group" aria-label="Community category filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
                aria-label={`Filter by ${cat} community`}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap min-h-[44px] flex items-center justify-center ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-md hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-8">
            {error}
          </div>
        )}

        {/* Communities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 mb-4" />
                <div className="h-4 rounded-lg bg-slate-200 w-3/4 mb-3" />
                <div className="h-3 rounded-lg bg-slate-100 w-full mb-2" />
                <div className="h-3 rounded-lg bg-slate-100 w-2/3 mb-4" />
                <div className="h-10 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : communities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedCommunities.map((community, index) => (
                <Link key={community.id} href={`/community/${community.slug}`}>
                  <div
                    className="group cursor-pointer h-full"
                    onMouseEnter={() => setHoveredCard(community.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    role="article"
                    aria-label={`${community.name} community with ${community.memberCount || 0} members`}
                  >
                    {/* Premium Card with Glass Morphism effect */}
                    <div className="relative h-full bg-white/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/60 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 flex flex-col" role="button" tabIndex={0}>
                      {/* Gradient overlay border */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none rounded-2xl" />

                      {/* Image Container with overlay effect - Fixed aspect ratio to prevent CLS */}
                      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 aspect-video overflow-hidden">
                        {community.thumbnail_url ? (
                          <img
                            src={community.thumbnail_url}
                            alt={`${community.name} community thumbnail`}
                            className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-cyan-600 to-slate-900 flex items-center justify-center relative overflow-hidden">
                            {/* Animated gradient shapes */}
                            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-400/30 rounded-full blur-2xl animate-pulse" />
                            <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
                            <div className="relative z-10 text-white/30">
                              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM15 20a3 3 0 01-6 0" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* Rank Badge - Premium style */}
                        <div className="absolute top-4 left-4 z-10">
                          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg border border-white/30 text-white text-xs font-bold" aria-label={`Rank ${startIndex + index + 1}`}>
                            #{startIndex + index + 1}
                          </div>
                        </div>

                        {/* Hover overlay effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                      </div>

                      {/* Content Section */}
                      <div className="relative z-10 p-6 flex-1 flex flex-col">
                        {/* Category badge - Improved contrast */}
                        <div className="mb-3">
                          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider" aria-label={`Category: ${community.category}`}>
                            {community.category}
                          </span>
                        </div>

                        {/* Community Name - Better contrast (4.5:1) */}
                        <h3 className="font-bold text-slate-900 line-clamp-2 text-lg leading-snug mb-3 group-hover:text-blue-700 transition-colors">
                          {community.name}
                        </h3>

                        {/* Description - Improved contrast */}
                        <p className="text-sm text-slate-700 line-clamp-2 mb-auto leading-relaxed flex-1">
                          {community.description ||
                            "Join this vibrant community and connect with peers."}
                        </p>
                      </div>

                      {/* Footer - Premium stats with better contrast */}
                      <div className="relative z-10 px-6 py-5 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 backdrop-blur-sm">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-600">Members</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">
                              {formatMemberCount(community.memberCount || 0)}
                            </p>
                          </div>
                          <div className="flex-1 text-right min-w-0">
                            <p className="text-xs font-medium text-slate-600">Price</p>
                            <p className="text-base font-bold text-blue-700 mt-0.5">
                              {formatPrice(community.monthlyPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-3 mt-16" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="min-w-[44px] h-[44px] rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 transition-all duration-300 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Previous page"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-2" role="group">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[44px] h-[44px] rounded-full flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        currentPage === page
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30 focus:ring-blue-500"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 focus:ring-blue-500"
                      }`}
                      aria-label={`Go to page ${page}`}
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="min-w-[44px] h-[44px] rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 transition-all duration-300 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Next page"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M9 19l7-7-7-7" />
                  </svg>
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="text-center py-32" role="status" aria-live="polite">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-blue-50 mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <h3 className="text-slate-900 mb-3 text-2xl font-bold">No communities found</h3>
            <p className="text-slate-600 mb-8 text-base max-w-md mx-auto leading-relaxed">
              Try adjusting your search or filters to find the right community for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/community/create">
                <button className="px-7 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 font-semibold hover:scale-105 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Create Community
                </button>
              </Link>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
                className="px-7 py-3 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 hover:border-blue-300 transition-all duration-300 font-semibold min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Clear all filters and show all communities"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
