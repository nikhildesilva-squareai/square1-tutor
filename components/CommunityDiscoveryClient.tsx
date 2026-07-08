"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

// ─── Design tokens (from the Claude Design "Discover Communities" mock) ───────
const BORDER = "#E8EEF5";
const BORDER_STRONG = "#D8E2ED";
const INK = "#0F172A";
const SUB = "#64748B";
const BRAND = "#0056CE";
const CARD_SHADOW = "0 1px 2px 0 rgba(21,47,84,0.04)";

// Soft category badge tints, assigned deterministically per category name.
const BADGE_TINTS: Array<{ bg: string; fg: string }> = [
  { bg: "#CCE1FF", fg: "#0348A9" },
  { bg: "#D4F0FC", fg: "#0A7BAD" },
  { bg: "#E6F6EE", fg: "#19A65F" },
  { bg: "#EDEBFF", fg: "#6D5FE0" },
  { bg: "#FFF1E6", fg: "#C2410C" },
  { bg: "#F1F5F9", fg: "#475569" },
];
// Cover gradients, brand-aligned, assigned deterministically per community.
const COVERS: Array<[string, string]> = [
  ["#0056CE", "#01224F"],
  ["#1871ED", "#0348A9"],
  ["#0A7BAD", "#01224F"],
  ["#6D5FE0", "#0348A9"],
  ["#19A65F", "#01224F"],
  ["#0056CE", "#0A7BAD"],
];
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const badgeFor = (category: string) => BADGE_TINTS[hash(category) % BADGE_TINTS.length];
const coverFor = (id: string) => COVERS[hash(id) % COVERS.length];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const memberLabel = (count: number) =>
    count >= 1000 ? `${(count / 1000).toFixed(1)}k members` : `${count} member${count === 1 ? "" : "s"}`;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = communities.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(communities.length / itemsPerPage);

  const microLabel = "text-[13px] font-bold uppercase" as const;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100%" }}>
      <div className="mx-auto w-full px-6 lg:px-10 pt-8 pb-24" style={{ maxWidth: 1296 }}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          className="rounded-2xl px-6 py-10 sm:px-10 sm:py-12 mb-10"
          style={{ background: "linear-gradient(180deg,#F1F6FF 0%,#FFFFFF 70%)", border: `1px solid ${BORDER}` }}
        >
          <div className="flex flex-col items-center text-center gap-5 mx-auto" style={{ maxWidth: 720 }}>
            <span
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-bold uppercase whitespace-nowrap"
              style={{ background: "#FFFFFF", border: "1px solid #CCE1FF", color: BRAND, letterSpacing: "0.08em" }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 7-9 9-4-4-7 7" /><path d="M16 7h6v6" />
              </svg>
              Explore communities
            </span>

            <h2 className="font-bold tracking-tight" style={{ color: INK, fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.08, letterSpacing: "-0.02em" }}>
              Find your community
            </h2>
            <p style={{ color: SUB, fontSize: 18, lineHeight: 1.5, margin: 0 }}>
              Connect with like-minded people, share ideas, and grow together.
            </p>

            {/* Search + create */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full mt-2" style={{ maxWidth: 640 }}>
              <div className="relative flex-1" style={{ minWidth: 260 }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#94A3B8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                  className="absolute top-1/2 -translate-y-1/2" style={{ left: 16 }}>
                  <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, category, or keywords"
                  aria-label="Search communities"
                  className="w-full focus:outline-none"
                  style={{
                    height: 52, padding: "0 16px 0 46px", borderRadius: 10, border: `1px solid ${BORDER_STRONG}`,
                    background: "#FFFFFF", fontSize: 16, color: INK, boxShadow: CARD_SHADOW,
                  }}
                />
              </div>
              <button
                onClick={() => router.push("/community/create")}
                className="inline-flex items-center gap-2 justify-center font-medium text-white hover:brightness-105 transition"
                style={{
                  height: 52, padding: "0 24px", border: "none", borderRadius: 10,
                  background: "linear-gradient(180deg,#1871ED 0%,#1156B6 100%)",
                  boxShadow: "inset 0 -1px 4px 0 #0056CE, 0 1px 2px 0 rgba(21,47,84,0.04)", fontSize: 16,
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create community
              </button>
            </div>
          </div>
        </section>

        {/* ── Filter chips ─────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className={microLabel} style={{ color: SUB, letterSpacing: "0.08em", marginBottom: 16 }}>Filter by interest</div>
          <div className="flex flex-wrap gap-3" role="group" aria-label="Community category filters">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={active}
                  className="rounded-full text-sm font-medium transition whitespace-nowrap"
                  style={
                    active
                      ? { padding: "9px 18px", color: "#FFFFFF", border: "1px solid transparent", background: "linear-gradient(180deg,#1871ED 0%,#1156B6 100%)", boxShadow: "0 1px 2px 0 rgba(21,47,84,0.10)" }
                      : { padding: "9px 18px", color: "#475569", border: `1px solid ${BORDER_STRONG}`, background: "#FFFFFF" }
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Results meta ─────────────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="flex items-baseline gap-2 mb-5">
            <span style={{ fontSize: 16, fontWeight: 600, color: INK }}>{communities.length}</span>
            <span style={{ fontSize: 16, color: SUB }}>
              {communities.length === 1 ? "community" : "communities"}{selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg mb-6" style={{ background: "#FEECEC", border: "1px solid #F9C9C9", color: "#B42318" }}>{error}</div>
        )}

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, background: "#FFF" }}>
                <div style={{ height: 132, background: "#EEF2F7" }} />
                <div className="p-6 space-y-3">
                  <div className="h-4 rounded w-1/3" style={{ background: "#EEF2F7" }} />
                  <div className="h-5 rounded w-3/4" style={{ background: "#EEF2F7" }} />
                  <div className="h-4 rounded w-full" style={{ background: "#F1F5F9" }} />
                  <div className="h-10 rounded-lg" style={{ background: "#F1F5F9" }} />
                </div>
              </div>
            ))}
          </div>
        ) : communities.length > 0 ? (
          <>
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
              {paginated.map((c) => {
                const badge = badgeFor(c.category);
                const [g1, g2] = coverFor(c.id);
                const monogram = (c.name?.[0] ?? "S").toUpperCase();
                return (
                  <article
                    key={c.id}
                    onClick={() => router.push(`/community/${c.slug}`)}
                    className="group flex flex-col overflow-hidden cursor-pointer s1-comm-card"
                    style={{ background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: CARD_SHADOW }}
                  >
                    {/* Cover */}
                    <div className="relative overflow-hidden" style={{ height: 132, background: c.thumbnail_url ? undefined : `linear-gradient(135deg, ${g1}, ${g2})` }}>
                      {c.thumbnail_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                      {!c.thumbnail_url && (
                        <span className="absolute select-none font-bold" style={{ right: 20, bottom: -14, fontSize: 88, lineHeight: 1, color: "rgba(255,255,255,0.20)" }}>{monogram}</span>
                      )}
                      {/* Member badge */}
                      <span
                        className="absolute inline-flex items-center gap-1.5 text-white font-semibold"
                        style={{ top: 14, left: 16, padding: "5px 12px", borderRadius: 999, fontSize: 13, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.30)", backdropFilter: "blur(4px)" }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17.5" cy="6.5" r="2.6" /><path d="M21 18c0-2.6-1.8-4.5-4.2-4.5" />
                        </svg>
                        {memberLabel(c.memberCount || 0)}
                      </span>
                      {c.is_private && (
                        <span className="absolute inline-flex items-center gap-1.5 font-bold uppercase" style={{ top: 14, right: 16, padding: "5px 11px", borderRadius: 999, fontSize: 11, letterSpacing: "0.04em", background: "rgba(255,255,255,0.92)", color: "#334155" }}>
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                          Private
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex flex-col flex-1" style={{ padding: "20px 24px 24px" }}>
                      <span className="self-start font-bold uppercase" style={{ padding: "4px 10px", borderRadius: 6, background: badge.bg, color: badge.fg, fontSize: 11, letterSpacing: "0.06em", marginBottom: 12 }}>
                        {c.category}
                      </span>
                      <h3 className="font-bold" style={{ color: INK, fontSize: 20, lineHeight: 1.3, margin: "0 0 8px" }}>{c.name}</h3>
                      <p style={{ fontSize: 15, lineHeight: 1.5, color: SUB, margin: "0 0 20px" }}>
                        {c.description || "Join this community and connect with peers."}
                      </p>
                      <span
                        className="s1-comm-cta mt-auto w-full inline-flex items-center justify-center font-semibold transition"
                        style={{ height: 42, borderRadius: 8, border: `1px solid ${BORDER_STRONG}`, background: "#FFFFFF", color: BRAND, fontSize: 15 }}
                      >
                        View community
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-14" aria-label="Pagination">
                <PageBtn disabled={currentPage === 1} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} label="Previous">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" /></svg>
                </PageBtn>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const active = currentPage === page;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-current={active ? "page" : undefined}
                      className="rounded-full flex items-center justify-center font-semibold transition"
                      style={
                        active
                          ? { minWidth: 42, height: 42, color: "#FFF", background: "linear-gradient(180deg,#1871ED 0%,#1156B6 100%)", border: "1px solid transparent" }
                          : { minWidth: 42, height: 42, color: "#475569", background: "#FFF", border: `1px solid ${BORDER_STRONG}` }
                      }
                    >
                      {page}
                    </button>
                  );
                })}
                <PageBtn disabled={currentPage === totalPages} onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} label="Next">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 19l7-7-7-7" /></svg>
                </PageBtn>
              </nav>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center text-center gap-3" style={{ padding: "64px 24px", border: `1px dashed ${BORDER_STRONG}`, borderRadius: 12, background: "#F8FAFC" }}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <div className="font-bold" style={{ color: INK, fontSize: 18 }}>No communities found</div>
            <p style={{ fontSize: 15, color: SUB, margin: 0 }}>Try a different keyword or interest, or create your own community.</p>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <button onClick={() => router.push("/community/create")} className="text-white font-semibold" style={{ padding: "10px 22px", borderRadius: 999, background: "linear-gradient(180deg,#1871ED 0%,#1156B6 100%)", boxShadow: "inset 0 -1px 4px 0 #0056CE" }}>Create community</button>
              <button onClick={() => { setSearch(""); setSelectedCategory("All"); }} className="font-semibold" style={{ padding: "10px 22px", borderRadius: 999, background: "#FFF", border: `1px solid ${BORDER_STRONG}`, color: "#475569" }}>Clear filters</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .s1-comm-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
        .s1-comm-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -10px rgba(21,47,84,0.18); border-color: ${BORDER_STRONG}; }
        .s1-comm-card:hover .s1-comm-cta { background: #ECF8FE; border-color: #CCE1FF; }
        .s1-search:focus, input:focus { border-color: ${BRAND} !important; }
      `}</style>
    </div>
  );
}

function PageBtn({ children, disabled, onClick, label }: { children: React.ReactNode; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-full flex items-center justify-center transition disabled:opacity-30"
      style={{ minWidth: 42, height: 42, background: "#FFF", border: "1px solid #D8E2ED", color: "#475569" }}
    >
      {children}
    </button>
  );
}
