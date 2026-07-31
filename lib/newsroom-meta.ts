// ═══════════════════════════════════════════════════════════════════════════════
// Newsroom metadata — topics, regions, types and pure helpers. NO server
// imports here: this module is shared with client components (the review desk),
// so it must never pull in next/headers via the Supabase server client.
// Server-side read paths live in lib/newsroom.ts, which re-exports all of this.
// ═══════════════════════════════════════════════════════════════════════════════

export const NEWS_TOPICS = {
  "ai":           { label: "AI" },
  "cybersecurity":{ label: "Cybersecurity" },
  "cloud":        { label: "Cloud" },
  "quantum":      { label: "Quantum" },
  "ml":           { label: "Machine Learning" },
  "data-science": { label: "Data Science" },
  "data-centres": { label: "Data Centres" },
  "industry":     { label: "Industry" },
} as const;
export type NewsTopic = keyof typeof NEWS_TOPICS;

export const NEWS_REGIONS = {
  // "Worldwide", not "Global" — the filter row also has an "All editions"
  // control, and "All / Global" read as the same thing to a reader.
  "global":        { label: "Worldwide",     short: "Worldwide" },
  "anz":           { label: "Australia & NZ", short: "AU/NZ" },
  "north-america": { label: "North America", short: "N. America" },
  "europe":        { label: "Europe & UK",   short: "Europe" },
  "africa":        { label: "Africa",        short: "Africa" },
  "asia":          { label: "Asia",          short: "Asia" },
  "middle-east":   { label: "Middle East",   short: "Mid-East" },
} as const;
export type NewsRegion = keyof typeof NEWS_REGIONS;

export interface NewsSource {
  outlet: string;   // "Reuters"
  title: string;    // the referenced piece's own headline
  url: string;
}

/** Optional teaching diagram. Structure only — never statistics, so it cannot
 * fabricate figures. See components/newsroom/ConceptDiagram.tsx. */
export interface ArticleDiagram {
  type: "flow" | "compare" | "layers";
  title: string;
  items: { label: string; detail?: string }[];
}

const DIAGRAM_TYPES = new Set(["flow", "compare", "layers"]);

/** Validate + clamp a diagram from the model or the DB. Returns null unless the
 * shape is fully well-formed — a malformed diagram renders nothing rather than
 * a broken figure. */
export function parseDiagram(raw: unknown): ArticleDiagram | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const type = typeof d.type === "string" && DIAGRAM_TYPES.has(d.type) ? d.type : null;
  if (!type) return null;

  const items = (Array.isArray(d.items) ? d.items : [])
    .map((it) => {
      const o = (it ?? {}) as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label.trim().slice(0, 60) : "";
      const detail = typeof o.detail === "string" ? o.detail.trim().slice(0, 160) : undefined;
      return label ? { label, ...(detail ? { detail } : {}) } : null;
    })
    .filter(Boolean)
    .slice(0, 5) as { label: string; detail?: string }[];

  // flow needs a sequence, compare needs exactly two sides, layers needs a stack.
  const min = type === "compare" ? 2 : 3;
  if (items.length < min) return null;
  if (type === "compare" && items.length > 2) items.length = 2;

  return {
    type: type as ArticleDiagram["type"],
    title: typeof d.title === "string" ? d.title.trim().slice(0, 80) : "How it works",
    items,
  };
}

export interface NewsArticle {
  id: string;
  slug: string;
  headline: string;
  dek: string | null;
  body_md: string;
  topic: NewsTopic;
  region: NewsRegion;
  sources: NewsSource[];
  course_slugs: string[];
  diagram: ArticleDiagram | null;
  status: "draft" | "published" | "rejected";
  published_at: string | null;
  created_at: string;
}

export function isNewsTopic(v: string | undefined): v is NewsTopic {
  return !!v && v in NEWS_TOPICS;
}
export function isNewsRegion(v: string | undefined): v is NewsRegion {
  return !!v && v in NEWS_REGIONS;
}

/** Rough reading time from the markdown source. */
export function newsReadingMinutes(md: string): number {
  const words = md.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
