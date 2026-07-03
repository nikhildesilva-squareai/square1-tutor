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
      <div className="relative w-screen -mx-[calc((100vw-100%)/2)] bg-gradient-to-r from-blue-900 to-blue-800 py-20 px-4 mb-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-2">Discover communities</h1>
          <p className="text-xl text-blue-100">
            or{" "}
            <button className="text-blue-200 hover:text-white underline">
              create your own
            </button>
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search for anything"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-16 pr-6 py-4 rounded-lg bg-white border border-neutral-200 text-neutral-900 placeholder-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center lg:justify-start">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-neutral-900 text-white"
                  : "bg-white border border-neutral-200 text-neutral-900 hover:border-neutral-300"
              }`}
            >
              {cat}
            </button>
          ))}
          <button className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
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
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-neutral-200">
                      {/* Image Container */}
                      <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 aspect-square overflow-hidden">
                        {community.thumbnail_url ? (
                          <img
                            src={community.thumbnail_url}
                            alt={community.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600" />
                        )}

                        {/* Rank Badge */}
                        <div className="absolute top-3 left-3 bg-sky-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                          #{startIndex + index + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Community Name and Info */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-neutral-200" />
                            <h3 className="font-semibold text-neutral-900 line-clamp-1">
                              {community.name}
                            </h3>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-neutral-600 line-clamp-3 mb-4 leading-relaxed">
                          {community.description ||
                            "Join this community to connect with peers and collaborate."}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
                        <span className="text-sm text-neutral-600">
                          {formatMemberCount(community.memberCount || 0)}
                        </span>
                        <span className="font-semibold text-neutral-900">
                          {formatPrice(community.monthlyPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all ${
                      currentPage === page
                        ? "bg-neutral-900 text-white border border-neutral-900"
                        : "bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50"
                >
                  <svg
                    width="16"
                    height="16"
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
          <div className="text-center py-12">
            <p className="text-neutral-600 mb-4">No communities found</p>
            <button className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
              Create the first one
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
