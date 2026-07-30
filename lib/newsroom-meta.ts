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
