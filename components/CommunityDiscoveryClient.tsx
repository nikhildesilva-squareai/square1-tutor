"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Users } from "lucide-react";

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

// Decorative cover/avatar gradients, cycled by index for variety (these are
// visual only — no data is implied by them).
const COVERS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#0ea5e9,#2563eb)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#14b8a6,#0ea5e9)",
  "linear-gradient(135deg,#8b5cf6,#6366f1)",
  "linear-gradient(135deg,#f43f5e,#ec4899)",
  "linear-gradient(135deg,#3b82f6,#1e3a8a)",
  "linear-gradient(135deg,#22c55e,#14b8a6)",
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
  icon_url?: string | null;
  cover_url?: string | null;
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

  const itemsPerPage = 12;

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
    count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k members` : `${count} ${count === 1 ? "member" : "members"}`;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCommunities = communities.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(communities.length / itemsPerPage);

  return (
    <div>
      {/* ── Hero (full-bleed, dark) ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a1a3f]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(110% 140% at 50% -30%, rgba(59,130,246,0.35), transparent 60%), linear-gradient(180deg, #0a1a3f, #0a132e)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "22px 22px", maskImage: "radial-gradient(80% 80% at 50% 0, #000, transparent 75%)", WebkitMaskImage: "radial-gradient(80% 80% at 50% 0, #000, transparent 75%)" }}
        />

        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Discover communities</h1>
          <p className="mt-3 text-lg text-white/70">
            or{" "}
            <Link href="/community/create" className="font-semibold text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white">
              create your own
            </Link>
          </p>

          <div className="relative mx-auto mt-8 max-w-xl">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
            <label htmlFor="community-search" className="sr-only">Search communities</label>
            <input
              id="community-search"
              type="text"
              placeholder="Search for anything"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 w-full rounded-full border border-white/10 bg-white pr-5 text-base text-ink shadow-lg outline-none transition-shadow placeholder:text-ink-muted focus:ring-4 focus:ring-white/20"
              style={{ paddingLeft: "3.25rem" }}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* ── Category pills ────────────────────────────────────────── */}
        <div className="-mx-1 mb-8 flex gap-2.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Community category filters">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={active}
                className={
                  active
                    ? "shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors"
                    : "shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error-bg p-4 text-error">{error}</div>
        )}

        {/* ── Grid ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="aspect-[16/10] animate-pulse bg-surface-alt" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-surface-alt" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-surface-alt" />
                </div>
              </div>
            ))}
          </div>
        ) : communities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedCommunities.map((community, index) => {
                const cover = COVERS[(startIndex + index) % COVERS.length];
                const letter = community.name.charAt(0).toUpperCase();
                return (
                  <Link
                    key={community.id}
                    href={`/community/${community.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_0_rgba(21,47,84,0.04)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-border-mid/40 hover:shadow-card-hover"
                  >
                    {/* Cover */}
                    <div className="relative aspect-[16/10] overflow-hidden" style={{ background: cover }}>
                      {community.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={community.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <span className="pointer-events-none absolute -bottom-4 right-4 select-none text-[96px] font-black leading-none text-white/20">
                          {letter}
                        </span>
                      )}
                      {community.is_private && (
                        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          Private
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center gap-2.5">
                        {community.icon_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={community.icon_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-surface" />
                        ) : (
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-surface"
                            style={{ background: cover }}
                          >
                            {letter}
                          </span>
                        )}
                        <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink group-hover:text-brand">
                          {community.name}
                        </h3>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[13px]">
                        <span className="inline-flex items-center gap-1.5 text-ink-muted">
                          <Users className="h-3.5 w-3.5" />
                          {formatMemberCount(community.memberCount || 0)}
                        </span>
                        <span className="font-semibold text-emerald-600">Free</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex h-10 min-w-[40px] items-center justify-center rounded-full border border-border bg-surface text-ink-secondary transition-colors hover:bg-surface-alt disabled:opacity-30"
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
                        ? "flex h-10 min-w-[40px] items-center justify-center rounded-full bg-ink font-semibold text-white"
                        : "flex h-10 min-w-[40px] items-center justify-center rounded-full border border-border bg-surface font-semibold text-ink-secondary transition-colors hover:bg-surface-alt"
                    }
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-10 min-w-[40px] items-center justify-center rounded-full border border-border bg-surface text-ink-secondary transition-colors hover:bg-surface-alt disabled:opacity-30"
                  aria-label="Next page"
                >
                  ›
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-soft px-6 py-16 text-center">
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
    </div>
  );
}
