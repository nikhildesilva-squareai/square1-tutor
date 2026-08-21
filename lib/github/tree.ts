// One-call repo tree listing, for the starter diff in the gate review queue.
//
// WHY THIS EXISTS ALONGSIDE fetch-repo.ts. fetchRepo() downloads file CONTENT
// for the AI reviewer — dozens of API calls and a few hundred KB per repo. The
// reviewer queue needs a different thing: which files did this student actually
// touch, across every row on the page, rendered in under a second.
//
// git's object model gives that away for free. The `git/trees?recursive=1`
// endpoint returns every path with its blob SHA, and a blob SHA is a hash of the
// CONTENT — so an identical SHA in two unrelated repositories means the file is
// byte-for-byte identical. Two calls (starter + submission), zero downloads, and
// a complete added/modified/removed picture. The comparison itself is pure and
// lives in lib/bootcamp/review.ts.

import { parseGitHubUrl } from "./fetch-repo";
import type { TreeEntry } from "@/lib/bootcamp";

const API = "https://api.github.com";

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Square1AI-GateReview",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export interface RepoTree {
  owner: string;
  repo: string;
  entries: TreeEntry[];
  /** True when GitHub capped the listing. A partial tree makes the diff a
   *  lower bound, and the UI must say so rather than imply completeness. */
  truncated: boolean;
  error?: string;
}

const EMPTY = (error: string): RepoTree => ({
  owner: "", repo: "", entries: [], truncated: false, error,
});

/**
 * Every blob in a repo's default branch, with its content hash.
 *
 * Never throws: the desk queue renders many of these and a rate-limited or
 * deleted repo must degrade to "diff unavailable" on one row, not take the
 * reviewer's whole page down.
 */
export async function fetchRepoTree(githubUrl: string): Promise<RepoTree> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) return EMPTY("Not a GitHub URL");
  const { owner, repo } = parsed;

  try {
    const repoRes = await fetch(`${API}/repos/${owner}/${repo}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!repoRes.ok) {
      return { ...EMPTY(`Repository unreachable (${repoRes.status})`), owner, repo };
    }
    const meta = (await repoRes.json()) as { default_branch?: string };
    const branch = meta.default_branch || "main";

    const treeRes = await fetch(
      `${API}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      { headers: headers(), cache: "no-store" },
    );
    if (!treeRes.ok) {
      return { ...EMPTY(`Tree unreadable (${treeRes.status})`), owner, repo };
    }
    const body = (await treeRes.json()) as {
      tree?: { path: string; type: string; sha: string }[];
      truncated?: boolean;
    };

    const entries: TreeEntry[] = (body.tree ?? [])
      .filter((n) => n.type === "blob")
      .map((n) => ({ path: n.path, sha: n.sha }));

    return { owner, repo, entries, truncated: !!body.truncated };
  } catch (err) {
    return EMPTY(err instanceof Error ? err.message : "Tree fetch failed");
  }
}
