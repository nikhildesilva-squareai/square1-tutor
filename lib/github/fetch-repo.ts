// ═══════════════════════════════════════════════════════════════════════════════
// GitHub Repo Fetcher — reads actual student code for AI project review
//
// Uses GitHub's public REST API (no auth required for public repos).
// If GITHUB_TOKEN is set, it's used for higher rate limits (5,000/hr vs 60/hr).
//
// Flow:
// 1. Parse the GitHub URL to extract owner/repo
// 2. Fetch the repo's file tree (recursive)
// 3. Prioritise files: README, package.json, main source files, tests
// 4. Fetch file contents up to TOKEN_BUDGET_CHARS
// 5. Return structured data for the AI reviewer
// ═══════════════════════════════════════════════════════════════════════════════

/** Maximum total characters of source code to send to AI */
const MAX_CONTENT_CHARS = 48_000; // ~12K tokens → fits comfortably in context

/** Maximum single file size to fetch (skip huge files) */
const MAX_FILE_SIZE = 15_000;

/** File extensions we care about for code review */
const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go", ".rs", ".rb",
  ".c", ".cpp", ".cs", ".swift", ".kt", ".scala", ".vue", ".svelte",
  ".html", ".css", ".scss", ".sql", ".prisma", ".graphql",
]);

/** Files we always want to read (case-insensitive match) */
const PRIORITY_FILES = [
  "readme.md", "readme", "readme.txt",
  "package.json", "requirements.txt", "pyproject.toml", "cargo.toml",
  "go.mod", "pom.xml", "build.gradle",
  "dockerfile", "docker-compose.yml", "docker-compose.yaml",
  ".env.example",
];

/** Directories to skip entirely */
const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build", "out", ".vercel",
  "__pycache__", ".cache", "coverage", ".turbo", "vendor", "target",
  ".idea", ".vscode", ".husky",
]);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RepoFile {
  path: string;
  content: string;
  size: number;
}

export interface RepoAnalysis {
  owner: string;
  repo: string;
  fileTree: string[];          // All file paths in the repo
  files: RepoFile[];           // Files we fetched content for
  hasReadme: boolean;
  hasTests: boolean;
  hasPackageJson: boolean;
  hasDockerfile: boolean;
  detectedStack: string[];     // Inferred from file extensions & config
  totalFiles: number;
  fetchedChars: number;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Square1AI-ProjectReviewer",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Parse a GitHub URL into owner/repo.
 * Handles: github.com/owner/repo, github.com/owner/repo.git,
 *          github.com/owner/repo/tree/main/...
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("github.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, ""),
    };
  } catch {
    return null;
  }
}

/**
 * Determine file priority for review (lower = higher priority).
 */
function filePriority(path: string): number {
  const lower = path.toLowerCase();
  const name = lower.split("/").pop() ?? "";

  // Priority files first
  if (PRIORITY_FILES.includes(name)) return 0;

  // Test files
  if (lower.includes("test") || lower.includes("spec") || lower.includes("__tests__")) return 1;

  // Source files in src/ or app/ or lib/
  if (lower.startsWith("src/") || lower.startsWith("app/") || lower.startsWith("lib/") || lower.startsWith("pages/")) return 2;

  // Root-level source files
  const depth = path.split("/").length;
  if (depth <= 2) return 3;

  // Components, hooks, utils
  if (lower.includes("component") || lower.includes("hook") || lower.includes("util")) return 4;

  // Everything else
  return 5;
}

function shouldSkipDir(path: string): boolean {
  return path.split("/").some(segment => SKIP_DIRS.has(segment));
}

function isCodeFile(path: string): boolean {
  const ext = "." + (path.split(".").pop()?.toLowerCase() ?? "");
  return CODE_EXTENSIONS.has(ext);
}

function isConfigFile(path: string): boolean {
  const name = path.toLowerCase().split("/").pop() ?? "";
  return PRIORITY_FILES.includes(name);
}

/**
 * Detect tech stack from file tree and package.json.
 */
function detectStack(fileTree: string[], packageJsonContent?: string): string[] {
  const stack: Set<string> = new Set();

  // From file extensions
  const extCounts = new Map<string, number>();
  for (const f of fileTree) {
    const ext = "." + (f.split(".").pop()?.toLowerCase() ?? "");
    extCounts.set(ext, (extCounts.get(ext) ?? 0) + 1);
  }

  if (extCounts.has(".ts") || extCounts.has(".tsx")) stack.add("TypeScript");
  if (extCounts.has(".js") || extCounts.has(".jsx")) stack.add("JavaScript");
  if (extCounts.has(".py")) stack.add("Python");
  if (extCounts.has(".java")) stack.add("Java");
  if (extCounts.has(".go")) stack.add("Go");
  if (extCounts.has(".rs")) stack.add("Rust");
  if (extCounts.has(".vue")) stack.add("Vue");
  if (extCounts.has(".svelte")) stack.add("Svelte");

  // From file tree patterns
  if (fileTree.some(f => f.includes("next.config"))) stack.add("Next.js");
  if (fileTree.some(f => f.includes("vite.config"))) stack.add("Vite");
  if (fileTree.some(f => f.includes("tailwind.config"))) stack.add("Tailwind CSS");
  if (fileTree.some(f => f.includes("prisma/schema"))) stack.add("Prisma");
  if (fileTree.some(f => f.toLowerCase().includes("dockerfile"))) stack.add("Docker");
  if (fileTree.some(f => f.includes("supabase"))) stack.add("Supabase");

  // From package.json
  if (packageJsonContent) {
    try {
      const pkg = JSON.parse(packageJsonContent);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps.react) stack.add("React");
      if (allDeps.next) stack.add("Next.js");
      if (allDeps.express) stack.add("Express");
      if (allDeps.fastify) stack.add("Fastify");
      if (allDeps.tailwindcss) stack.add("Tailwind CSS");
      if (allDeps["@supabase/supabase-js"]) stack.add("Supabase");
      if (allDeps.prisma || allDeps["@prisma/client"]) stack.add("Prisma");
      if (allDeps.mongoose || allDeps.mongodb) stack.add("MongoDB");
      if (allDeps["@anthropic-ai/sdk"]) stack.add("Claude AI");
      if (allDeps.openai) stack.add("OpenAI");
      if (allDeps.langchain) stack.add("LangChain");
      if (allDeps.tensorflow || allDeps["@tensorflow/tfjs"]) stack.add("TensorFlow");
      if (allDeps.torch || allDeps.pytorch) stack.add("PyTorch");
      if (allDeps.jest || allDeps.vitest || allDeps.mocha) stack.add("Testing");
      if (allDeps.stripe || allDeps["@stripe/stripe-js"]) stack.add("Stripe");
    } catch { /* ignore parse errors */ }
  }

  return Array.from(stack);
}

// ─── Main fetch function ─────────────────────────────────────────────────────

/**
 * Fetch and analyse a public GitHub repository.
 * Returns structured data including actual source code for AI review.
 */
export async function fetchRepo(githubUrl: string): Promise<RepoAnalysis> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    return {
      owner: "", repo: "", fileTree: [], files: [],
      hasReadme: false, hasTests: false, hasPackageJson: false, hasDockerfile: false,
      detectedStack: [], totalFiles: 0, fetchedChars: 0,
      error: "Invalid GitHub URL format",
    };
  }

  const { owner, repo } = parsed;
  const headers = githubHeaders();

  // ── Step 1: Fetch file tree ────────────────────────────────────────────────
  let fileTree: { path: string; size: number; type: string }[] = [];
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      { headers, next: { revalidate: 0 } }
    );

    if (treeRes.status === 404) {
      return {
        owner, repo, fileTree: [], files: [],
        hasReadme: false, hasTests: false, hasPackageJson: false, hasDockerfile: false,
        detectedStack: [], totalFiles: 0, fetchedChars: 0,
        error: "Repository not found or is private. Make sure it's a public repo.",
      };
    }

    if (!treeRes.ok) {
      return {
        owner, repo, fileTree: [], files: [],
        hasReadme: false, hasTests: false, hasPackageJson: false, hasDockerfile: false,
        detectedStack: [], totalFiles: 0, fetchedChars: 0,
        error: `GitHub API error: ${treeRes.status} ${treeRes.statusText}`,
      };
    }

    const treeData = await treeRes.json();
    fileTree = (treeData.tree ?? [])
      .filter((item: { type: string }) => item.type === "blob")
      .map((item: { path: string; size: number; type: string }) => ({
        path: item.path,
        size: item.size ?? 0,
        type: item.type,
      }));
  } catch (err) {
    return {
      owner, repo, fileTree: [], files: [],
      hasReadme: false, hasTests: false, hasPackageJson: false, hasDockerfile: false,
      detectedStack: [], totalFiles: 0, fetchedChars: 0,
      error: `Failed to fetch repo tree: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }

  const allPaths = fileTree.map(f => f.path);

  // ── Step 2: Filter and prioritise files to fetch ───────────────────────────
  const fetchCandidates = fileTree
    .filter(f => !shouldSkipDir(f.path))
    .filter(f => f.size <= MAX_FILE_SIZE)
    .filter(f => isCodeFile(f.path) || isConfigFile(f.path))
    .sort((a, b) => filePriority(a.path) - filePriority(b.path));

  // ── Step 3: Fetch file contents up to budget ──────────────────────────────
  const files: RepoFile[] = [];
  let totalChars = 0;

  for (const candidate of fetchCandidates) {
    if (totalChars >= MAX_CONTENT_CHARS) break;

    try {
      const contentRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${candidate.path}`,
        { headers, next: { revalidate: 0 } }
      );

      if (!contentRes.ok) continue;

      const contentData = await contentRes.json();

      // GitHub returns base64 encoded content
      let content: string;
      if (contentData.encoding === "base64" && contentData.content) {
        content = Buffer.from(contentData.content, "base64").toString("utf-8");
      } else {
        continue; // Skip non-text files
      }

      // Trim if adding this file would exceed budget
      const remainingBudget = MAX_CONTENT_CHARS - totalChars;
      if (content.length > remainingBudget) {
        content = content.substring(0, remainingBudget) + "\n\n// ... [truncated — file too large for review budget]";
      }

      files.push({
        path: candidate.path,
        content,
        size: content.length,
      });

      totalChars += content.length;
    } catch {
      // Skip files that fail to fetch
      continue;
    }
  }

  // ── Step 4: Analyse ────────────────────────────────────────────────────────
  const lowerPaths = allPaths.map(p => p.toLowerCase());
  const hasReadme = lowerPaths.some(p => p.includes("readme"));
  const hasTests = lowerPaths.some(p =>
    p.includes("test") || p.includes("spec") || p.includes("__tests__")
  );
  const hasPackageJson = lowerPaths.includes("package.json");
  const hasDockerfile = lowerPaths.some(p => p.includes("dockerfile"));

  const packageJsonFile = files.find(f => f.path.toLowerCase() === "package.json");
  const detectedStack = detectStack(allPaths, packageJsonFile?.content);

  return {
    owner,
    repo,
    fileTree: allPaths,
    files,
    hasReadme,
    hasTests,
    hasPackageJson,
    hasDockerfile,
    detectedStack,
    totalFiles: allPaths.length,
    fetchedChars: totalChars,
  };
}

// ─── Format for AI prompt ────────────────────────────────────────────────────

/**
 * Format the repo analysis into a string for the AI review prompt.
 */
export function formatRepoForReview(analysis: RepoAnalysis): string {
  if (analysis.error) {
    return `⚠️ Could not fetch repo: ${analysis.error}\n\nReview based on project requirements and student notes only.`;
  }

  const sections: string[] = [];

  // Overview
  sections.push(`## Repository: ${analysis.owner}/${analysis.repo}`);
  sections.push(`Total files: ${analysis.totalFiles}`);
  sections.push(`Detected stack: ${analysis.detectedStack.join(", ") || "Unknown"}`);
  sections.push(`Has README: ${analysis.hasReadme ? "✅" : "❌"}`);
  sections.push(`Has tests: ${analysis.hasTests ? "✅" : "❌"}`);
  sections.push(`Has package.json: ${analysis.hasPackageJson ? "✅" : "❌"}`);
  sections.push(`Has Dockerfile: ${analysis.hasDockerfile ? "✅" : "❌"}`);

  // File tree (abbreviated)
  const treePreview = analysis.fileTree
    .filter(p => !p.includes("node_modules") && !p.includes(".git/"))
    .slice(0, 60);
  sections.push(`\n## File Tree (${analysis.totalFiles} files, showing top ${treePreview.length}):`);
  sections.push(treePreview.join("\n"));
  if (analysis.fileTree.length > 60) {
    sections.push(`... and ${analysis.fileTree.length - 60} more files`);
  }

  // Source code
  sections.push(`\n## Source Code (${analysis.files.length} files, ${analysis.fetchedChars.toLocaleString()} chars):`);
  for (const file of analysis.files) {
    sections.push(`\n### ${file.path} (${file.size} chars)`);
    sections.push("```");
    sections.push(file.content);
    sections.push("```");
  }

  return sections.join("\n");
}

// ─── Snippet extraction for code comments ────────────────────────────────────

export interface EnrichedCodeComment {
  file: string;
  line?: number;
  comment: string;
  severity: "info" | "warning" | "error";
  snippet?: {
    startLine: number;
    lines: { num: number; text: string; highlighted: boolean }[];
  };
  githubUrl?: string;
}

/**
 * Enrich AI-generated code comments with actual code snippets from the fetched repo.
 * Shows ±3 lines of context around the referenced line.
 */
export function enrichCodeComments(
  comments: { file: string; line?: number; comment: string; severity: "info" | "warning" | "error" }[],
  repo: RepoAnalysis,
): EnrichedCodeComment[] {
  const CONTEXT_LINES = 3;

  return comments.map((c) => {
    const enriched: EnrichedCodeComment = { ...c };

    // Build GitHub link
    if (repo.owner && repo.repo) {
      const lineFragment = c.line ? `#L${c.line}` : "";
      enriched.githubUrl = `https://github.com/${repo.owner}/${repo.repo}/blob/HEAD/${c.file}${lineFragment}`;
    }

    // Find the file in fetched content
    const file = repo.files.find(f => f.path === c.file);
    if (!file || !c.line) return enriched;

    const allLines = file.content.split("\n");
    const targetLine = c.line; // 1-indexed

    if (targetLine < 1 || targetLine > allLines.length) return enriched;

    const startLine = Math.max(1, targetLine - CONTEXT_LINES);
    const endLine = Math.min(allLines.length, targetLine + CONTEXT_LINES);

    const lines: { num: number; text: string; highlighted: boolean }[] = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push({
        num: i,
        text: allLines[i - 1], // Convert to 0-indexed
        highlighted: i === targetLine,
      });
    }

    enriched.snippet = { startLine, lines };
    return enriched;
  });
}
