import { createAdminClient } from "@/lib/supabase/admin";

// ═══════════════════════════════════════════════════════════════════════════════
// Daily SEO / AEO / GEO regression monitor.
//
// Scope is deliberate: this checks the things that BREAK SILENTLY and cost real
// traffic — a deploy that drops JSON-LD, a robots change that blocks GPTBot, the
// sitemap collapsing, soft-404s creeping back. It does not touch content.
// Keyword gaps and competitor moves change on a scale of weeks; a daily job that
// rewrote copy would just churn a live marketing site.
//
// Everything here is measured against the real production site over HTTP, not
// inferred from the repo — the repo has been right and production wrong twice
// (the dynamicParams soft-404, and prod schema running ahead of prod code).
//
// Detect and alert only. Nothing self-heals; a human decides every fix.
// ═══════════════════════════════════════════════════════════════════════════════

const BASE = "https://www.square1ai.com";

// Answer-engine crawlers. If any of these stops getting a 200 the site quietly
// drops out of AI answers, with nothing in analytics to show for it.
const AI_CRAWLERS = [
  { name: "GPTBot", ua: "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)" },
  { name: "OAI-SearchBot", ua: "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)" },
  { name: "ClaudeBot", ua: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)" },
  { name: "PerplexityBot", ua: "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)" },
  { name: "Google-Extended", ua: "Mozilla/5.0 (compatible; Google-Extended/1.0)" },
];

export type Check = { name: string; ok: boolean; detail: string };
export type SeoHealth = {
  ok: boolean;
  failures: number;
  checks: Check[];
  metrics: Record<string, number>;
  regressions: string[];
};

async function fetchText(path: string, ua?: string) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    cache: "no-store",
    headers: ua ? { "User-Agent": ua } : undefined,
  });
  return { status: res.status, text: res.ok ? await res.text() : "" };
}

export async function runSeoHealth(): Promise<SeoHealth> {
  const checks: Check[] = [];
  const metrics: Record<string, number> = {};
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  // ── Crawlability ────────────────────────────────────────────────────────
  try {
    const robots = await fetchText("/robots.txt");
    add("robots.txt", robots.status === 200 && robots.text.includes("Sitemap:"),
      `HTTP ${robots.status}${robots.text.includes("Sitemap:") ? ", sitemap declared" : ", NO sitemap line"}`);
    // A blanket disallow would deindex the site. Cheap to check, catastrophic to miss.
    const blanket = /User-Agent:\s*\*[\s\S]*?Disallow:\s*\/\s*$/im.test(robots.text);
    add("robots.txt not blanket-disallow", !blanket, blanket ? "DISALLOW / FOR ALL AGENTS" : "allows crawling");
  } catch (e) {
    add("robots.txt", false, `fetch failed: ${(e as Error).message}`);
  }

  try {
    const sm = await fetchText("/sitemap.xml");
    const count = (sm.text.match(/<loc>/g) ?? []).length;
    metrics.sitemapUrls = count;
    add("sitemap.xml", sm.status === 200 && count > 0, `HTTP ${sm.status}, ${count} URLs`);
  } catch (e) {
    add("sitemap.xml", false, `fetch failed: ${(e as Error).message}`);
  }

  try {
    const llms = await fetchText("/llms.txt");
    const urls = (llms.text.match(/https:\/\/www\.square1ai\.com/g) ?? []).length;
    metrics.llmsTxtUrls = urls;
    add("llms.txt", llms.status === 200 && urls > 0, `HTTP ${llms.status}, ${urls} URLs`);
  } catch (e) {
    add("llms.txt", false, `fetch failed: ${(e as Error).message}`);
  }

  // Everything below is one round of parallel fetches. Serially this is ~17
  // requests against production, which would eat a large slice of the cron's
  // 60s budget and starve the newsroom ingest and email jobs that share it.
  const schemaTargets: { path: string; required: string[] }[] = [
    { path: "/", required: ["EducationalOrganization", "WebSite", "FAQPage"] },
    { path: "/diagnostic/data-science", required: ["Course", "CourseInstance", "FAQPage"] },
    { path: "/roles/ai-engineer", required: ["Occupation", "BreadcrumbList"] },
  ];
  const soft404s = ["/definitely-not-a-real-page-xyz", "/roles/not-a-real-role", "/diagnostic/not-a-real-subject"];
  const publicRoutes = ["/", "/roles", "/courses", "/diagnostic/data-science", "/try/data-science", "/tools"];

  const [crawlerRes, notFoundRes, routeRes, schemaRes] = await Promise.all([
    Promise.all(AI_CRAWLERS.map(async (c) => {
      try { return { c, status: (await fetchText("/", c.ua)).status, err: "" }; }
      catch (e) { return { c, status: 0, err: (e as Error).message }; }
    })),
    Promise.all(soft404s.map(async (p) => {
      try { return { p, status: (await fetchText(p)).status, err: "" }; }
      catch (e) { return { p, status: 0, err: (e as Error).message }; }
    })),
    Promise.all(publicRoutes.map(async (p) => {
      try { return { p, status: (await fetchText(p)).status, err: "" }; }
      catch (e) { return { p, status: 0, err: (e as Error).message }; }
    })),
    Promise.all(schemaTargets.map(async (t) => {
      try {
        const r = await fetchText(t.path);
        const found = new Set((r.text.match(/"@type":"([A-Za-z]+)"/g) ?? []).map((m) => m.split('"')[3]));
        return { t, missing: t.required.filter((x) => !found.has(x)), err: "" };
      } catch (e) { return { t, missing: t.required, err: (e as Error).message }; }
    })),
  ]);

  // ── Answer-engine crawler access ────────────────────────────────────────
  // If any of these stops getting a 200 the site quietly drops out of AI
  // answers, with nothing in analytics to show for it.
  let blocked = 0;
  for (const r of crawlerRes) {
    const ok = r.status === 200;
    if (!ok) blocked++;
    add(`crawler: ${r.c.name}`, ok, r.err ? `fetch failed: ${r.err}` : `HTTP ${r.status}`);
  }
  metrics.crawlersBlocked = blocked;

  // ── Soft-404 canary ─────────────────────────────────────────────────────
  // The failure that started all of this: unknown paths answering 200 tells an
  // answer engine every junk URL is real content.
  for (const r of notFoundRes) {
    add(`404: ${r.p}`, r.status === 404, r.err ? `fetch failed: ${r.err}` : `HTTP ${r.status}`);
  }

  // ── Key public routes still reachable ───────────────────────────────────
  for (const r of routeRes) {
    add(`200: ${r.p}`, r.status === 200, r.err ? `fetch failed: ${r.err}` : `HTTP ${r.status}`);
  }

  // ── Structured data still emitted ───────────────────────────────────────
  // Schema is the easiest thing to lose in a refactor and the hardest to notice.
  let schemaMissing = 0;
  for (const r of schemaRes) {
    schemaMissing += r.missing.length;
    add(`schema: ${r.t.path}`, r.missing.length === 0 && !r.err,
      r.err ? `fetch failed: ${r.err}`
        : r.missing.length ? `MISSING ${r.missing.join(", ")}`
        : `${r.t.required.join(", ")} present`);
  }
  metrics.schemaMissing = schemaMissing;

  // ── Content hygiene from the DB ─────────────────────────────────────────
  // A published newsroom story with no sources undermines the one thing that
  // makes the newsroom citable.
  try {
    const { count } = await createAdminClient()
      .from("news_articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .or("sources.is.null,sources.eq.[]");
    metrics.newsWithoutSources = count ?? 0;
    add("newsroom sources", (count ?? 0) === 0, `${count ?? 0} published stories without sources`);
  } catch (e) {
    add("newsroom sources", false, `query failed: ${(e as Error).message}`);
  }

  const failures = checks.filter((c) => !c.ok).length;

  // ── Regressions vs the previous run ─────────────────────────────────────
  // A check that was passing yesterday and fails today is the signal worth
  // waking someone for. A count that dropped sharply is the other.
  const regressions: string[] = [];
  try {
    const { data: prev } = await createAdminClient()
      .from("seo_health").select("checks, metrics")
      .order("ran_at", { ascending: false }).limit(1).maybeSingle();

    if (prev) {
      const was = new Map((prev.checks as Check[]).map((c) => [c.name, c.ok]));
      for (const c of checks) {
        if (!c.ok && was.get(c.name) === true) regressions.push(`${c.name}: ${c.detail}`);
      }
      const pm = (prev.metrics ?? {}) as Record<string, number>;
      for (const key of ["sitemapUrls", "llmsTxtUrls"]) {
        const before = pm[key], now = metrics[key];
        if (typeof before === "number" && typeof now === "number" && before > 0 && now < before * 0.9) {
          regressions.push(`${key} fell ${before} → ${now}`);
        }
      }
    }
  } catch {
    /* first run, or the table is unreachable — not a regression */
  }

  return { ok: failures === 0, failures, checks, metrics, regressions };
}

/** Persist a run. Never throws — the cron must not fail over its own logging. */
export async function recordSeoHealth(h: SeoHealth, alerted: boolean) {
  try {
    await createAdminClient().from("seo_health").insert({
      ok: h.ok, failures: h.failures, checks: h.checks,
      metrics: h.metrics, regressions: h.regressions, alerted,
    });
  } catch (e) {
    console.error("[seo-health] record failed:", e);
  }
}
