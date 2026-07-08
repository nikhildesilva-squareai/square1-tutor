"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Users, TrendingUp } from "lucide-react";

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

// On-system cover gradients, cycled by index for variety.
const COVERS = [
  "from-brand to-brand-dark",
  "from-brand-sky to-brand",
  "from-brand-light to-brand-deep",
  "from-brand to-brand-deep",
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

  const itemsPerPage = 8;

  // Keep the URL in sync with the active filters.
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    if (currentPage > 1) params.set("page", currentPage.toString());
    router.push(`?${params.toString()}`, { scroll: false });
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
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (search) params.append("search", search);
      const response = await fetch(`/api/communities?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch communities");
      const data = await response.json();
      setCommunities(data.communities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatMemberCount = (count: number): string =>
    count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k members` : `${count} members`;

  // Trending = the three largest communities in the current result set.
  const trendingIds = new Set(
    [...communities].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0)).slice(0, 3).map((c) => c.id)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCommunities = communities.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(communities.length / itemsPerPage);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-2xl border border-border bg-surface-tint px-6 py-14 sm:px-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-surface px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-brand">
            <TrendingUp className="h-3.5 w-3.5" /> Explore communities
          </span>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">Find your community</h2>
          <p className="text-lg text-ink-secondary">
            Connect with like-minded people, share ideas, and grow together.
          </p>

          <div className="mt-2 flex w-full max-w-xl flex-wrap items-center justify-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
              <label htmlFor="community-search" className="sr-only">
                Search communities
              </label>
              <input
                id="community-search"
                type="text"
                placeholder="Search by name, category, or keywords"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="s1-search h-[52px] w-full rounded-xl border border-border bg-surface pl-12 pr-4 text-base text-ink shadow-[0_1px_2px_0_rgba(21,47,84,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted focus:border-brand"
              />
            </div>
            <Link
              href="/community/create"
              className="inline-flex h-[52px] items-center gap-2 whitespace-nowrap rounded-xl bg-brand px-6 text-base font-medium text-white transition-colors hover:bg-brand-dark"
            >
              <Plus className="h-[18px] w-[18px]" /> Create community
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div>
        <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[0.08em] text-ink-muted">Filter by interest</h3>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Community category filters">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-full bg-brand px-5 py-2.5 text-[15px] font-medium text-white transition-colors"
                    : "rounded-full border border-border bg-surface px-5 py-2.5 text-[15px] font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result meta */}
      {!loading && !error && (
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-ink">{communities.length}</span>
          <span className="text-ink-muted">{communities.length === 1 ? "community" : "communities"}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-error/30 bg-error-bg p-4 text-error">{error}</div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="h-[132px] animate-pulse bg-surface-alt" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-1/3 animate-pulse rounded bg-surface-alt" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-surface-alt" />
                <div className="h-10 animate-pulse rounded bg-surface-alt" />
              </div>
            </div>
          ))}
        </div>
      ) : communities.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedCommunities.map((community, index) => (
              <article
                key={community.id}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_2px_0_rgba(21,47,84,0.04)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-[3px] hover:border-border-mid/40 hover:shadow-card-hover"
              >
                {/* Cover */}
                <div className={`relative h-[132px] overflow-hidden bg-gradient-to-br ${COVERS[index % COVERS.length]}`}>
                  <span className="pointer-events-none absolute -bottom-3.5 right-5 select-none text-[88px] font-bold leading-none text-white/20">
                    {community.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="absolute left-4 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[13px] font-semibold text-white backdrop-blur-sm">
                    <Users className="h-3.5 w-3.5" />
                    {formatMemberCount(community.memberCount || 0)}
                  </span>
                  {trendingIds.has(community.id) && (
                    <span className="absolute right-4 top-3.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#C2410C]">
                      <TrendingUp className="h-3 w-3" /> Trending
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5 sm:px-6 sm:pb-6">
                  <span className="mb-3 self-start rounded-md bg-surface-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
                    {community.category}
                  </span>
                  <h3 className="mb-2 text-xl font-bold leading-snug text-ink">{community.name}</h3>
                  <p className="mb-5 line-clamp-2 text-[15px] leading-relaxed text-ink-muted">
                    {community.description || "Join this community and connect with peers."}
                  </p>
                  <Link
                    href={`/community/${community.slug}`}
                    className="mt-auto flex h-[42px] items-center justify-center rounded-lg border border-border bg-surface text-[15px] font-semibold text-brand transition-colors hover:border-brand/30 hover:bg-surface-tint"
                  >
                    View community
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex h-11 min-w-[44px] items-center justify-center rounded-full border border-border bg-surface text-ink-secondary transition-colors hover:bg-surface-alt disabled:opacity-30"
                aria-label="Previous page"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                  className={
                    currentPage === page
                      ? "flex h-11 min-w-[44px] items-center justify-center rounded-full bg-brand font-semibold text-white"
                      : "flex h-11 min-w-[44px] items-center justify-center rounded-full border border-border bg-surface font-semibold text-ink-secondary transition-colors hover:bg-surface-alt"
                  }
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex h-11 min-w-[44px] items-center justify-center rounded-full border border-border bg-surface text-ink-secondary transition-colors hover:bg-surface-alt disabled:opacity-30"
                aria-label="Next page"
              >
                ›
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface-soft px-6 py-16 text-center">
          <Search className="h-10 w-10 text-ink-muted" />
          <h3 className="text-lg font-bold text-ink">No communities found</h3>
          <p className="text-[15px] text-ink-muted">Try a different keyword or interest, or create your own community.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/community/create" className="rounded-full bg-brand px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-dark">
              Create community
            </Link>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
              className="rounded-full border border-border bg-surface px-6 py-2.5 font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
