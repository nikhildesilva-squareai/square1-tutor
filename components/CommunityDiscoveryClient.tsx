"use client";

import { useEffect, useState } from "react";
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
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 8;

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
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Banner */}
      <div className="relative w-screen -mx-[calc((100vw-100%)/2)] bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 py-24 px-4 mb-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Discover communities
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 font-light mb-12">
            Find your community or{" "}
            <Link href="/community/create">
              <button className="text-blue-200 hover:text-white font-semibold underline decoration-2 underline-offset-2 transition-colors">
                create your own
              </button>
            </Link>
          </p>

          {/* Search Bar */}
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="relative">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search communities, topics, or interests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-md hover:shadow-lg transition-shadow"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Category Filters */}
        <div className="mb-14">
          <p className="text-sm font-semibold text-neutral-600 mb-4 uppercase tracking-wide">Browse by category</p>
          <div className="flex flex-wrap gap-2 lg:gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40"
                    : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
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
                <div className="aspect-square rounded-lg bg-neutral-200 mb-3" />
                <div className="h-4 rounded bg-neutral-200 w-3/4 mb-2" />
                <div className="h-3 rounded bg-neutral-200 w-full mb-2" />
                <div className="h-3 rounded bg-neutral-200 w-1/2" />
              </div>
            ))}
          </div>
        ) : communities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedCommunities.map((community, index) => (
                <Link key={community.id} href={`/community/${community.slug}`}>
                  <div className="group cursor-pointer h-full">
                    {/* Card */}
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 border border-neutral-200 hover:border-blue-300 flex flex-col h-full">
                      {/* Image Container */}
                      <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 aspect-square overflow-hidden">
                        {community.thumbnail_url ? (
                          <img
                            src={community.thumbnail_url}
                            alt={community.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-lg bg-white/20 backdrop-blur-sm" />
                          </div>
                        )}

                        {/* Rank Badge */}
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                          #{startIndex + index + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        {/* Community Name and Info */}
                        <div className="mb-3">
                          <h3 className="font-bold text-neutral-900 line-clamp-2 text-lg leading-snug mb-1">
                            {community.name}
                          </h3>
                          <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                            {community.category}
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-neutral-600 line-clamp-2 mb-4 leading-relaxed flex-1">
                          {community.description ||
                            "Join this vibrant community and connect with peers."}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-neutral-500">Members</span>
                          <span className="text-sm font-semibold text-neutral-900">
                            {formatMemberCount(community.memberCount || 0)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-neutral-500">Pricing</span>
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(community.monthlyPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-14">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-11 h-11 rounded-lg bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 transition-all duration-200"
                  aria-label="Previous page"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-11 h-11 rounded-lg flex items-center justify-center font-semibold transition-all duration-200 ${
                        currentPage === page
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                          : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
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
                  className="w-11 h-11 rounded-lg bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 transition-all duration-200"
                  aria-label="Next page"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 19l7-7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="text-neutral-600 mb-2 text-lg font-medium">No communities found</p>
            <p className="text-neutral-500 mb-6">Try adjusting your search or filters</p>
            <Link href="/community/create">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md">
                Create the first one
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
