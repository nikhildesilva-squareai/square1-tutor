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

/** Optional teaching diagram. See components/newsroom/ConceptDiagram.tsx.
 *
 * flow / compare / layers carry STRUCTURE only — no statistics, so they cannot
 * fabricate a figure. They are the right visual for the large majority of
 * stories, whose value is a mechanism rather than a number.
 *
 * "stat" is the exception: a small bar chart for the minority of stories that
 * report real, attributable figures. It carries a mandatory `sourceNote`
 * naming who published the numbers, because a chart is the easiest place on
 * the page to launder an invented statistic into something that looks
 * measured. If the figures are not in the source, the answer is one of the
 * other three types. */
export interface ArticleDiagram {
  type: "flow" | "compare" | "layers" | "stat";
  title: string;
  items: { label: string; detail?: string; value?: number; display?: string }[];
  /** stat only — who reported these figures. Rendered under the chart. */
  sourceNote?: string;
  /** stat only — unit shown next to the axis label, e.g. "%" or "$bn". */
  unit?: string;
}

const DIAGRAM_TYPES = new Set(["flow", "compare", "layers", "stat"]);

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
      // stat only: the plotted magnitude, plus the figure as it should read to a
      // human ("89%", "$143bn"). display is kept verbatim rather than formatted
      // from value, so a reported figure is never silently rounded or restyled.
      const value = typeof o.value === "number" && isFinite(o.value) ? o.value : undefined;
      const display = typeof o.display === "string" ? o.display.trim().slice(0, 24) : undefined;
      return label ? { label, ...(detail ? { detail } : {}), ...(value !== undefined ? { value } : {}), ...(display ? { display } : {}) } : null;
    })
    .filter(Boolean)
    .slice(0, 5) as ArticleDiagram["items"];

  // flow needs a sequence, compare needs exactly two sides, layers needs a stack.
  const min = type === "compare" ? 2 : type === "stat" ? 2 : 3;
  if (items.length < min) return null;
  if (type === "compare" && items.length > 2) items.length = 2;

  const title = typeof d.title === "string" ? d.title.trim().slice(0, 80) : "How it works";

  if (type === "stat") {
    // Every bar must carry a real magnitude, and the chart must say who
    // reported it. Either missing means we cannot stand the figures up, so the
    // whole diagram is dropped rather than rendered unattributed.
    const plotted = items.filter((i) => typeof i.value === "number" && i.value >= 0);
    if (plotted.length < 2) return null;
    const sourceNote = typeof d.sourceNote === "string" ? d.sourceNote.trim().slice(0, 160) : "";
    if (!sourceNote) return null;
    return {
      type: "stat",
      title,
      items: plotted,
      sourceNote,
      ...(typeof d.unit === "string" ? { unit: d.unit.trim().slice(0, 12) } : {}),
    };
  }

  return { type: type as ArticleDiagram["type"], title, items };
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
