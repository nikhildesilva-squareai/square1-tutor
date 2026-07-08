import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseGitHubUrl } from "@/lib/github/fetch-repo";

// A few common language dot colours (GitHub linguist-ish). Fallback is slate.
const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Vue: "#41b883",
};

/**
 * GET /api/github/repo-meta?url=<github repo url>
 * Lightweight repo card data (owner/name/description/language/stars/forks).
 * Uses the public GitHub REST API — NOT the heavy fetchRepo() used for grading.
 */
export async function GET(req: Request) {
  try {
    // Authenticated members only (this proxies an external API).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url") || "";
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: "Not a valid GitHub repo URL" }, { status: 400 });
    }

    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      headers,
      // Cache briefly to be kind to the rate limit.
      next: { revalidate: 300 },
    });

    if (res.status === 404) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: "Could not reach GitHub" }, { status: 502 });
    }

    const data = await res.json();
    const language: string | null = data.language ?? null;

    return NextResponse.json({
      repo: {
        owner: parsed.owner,
        name: parsed.repo,
        url: data.html_url ?? url,
        description: data.description ?? "",
        language: language ?? "",
        languageColor: language ? LANG_COLORS[language] ?? "#94A3B8" : "#94A3B8",
        stars: data.stargazers_count ?? 0,
        forks: data.forks_count ?? 0,
      },
    });
  } catch (error) {
    console.error("repo-meta error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
