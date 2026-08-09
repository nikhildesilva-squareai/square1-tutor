// CI-based objective verification for project kits whose proof is "the kit's
// contract tests pass" (Full Stack). The paste-and-score model in objective.ts
// cannot verify a test run, so this checks GitHub directly:
//
//   1. The kit's protected files (contract tests, jest config, CI workflow) in
//      the student repo are byte-identical to the starter's (git blob SHAs are
//      content-addressed, so equal SHA === equal content).
//   2. The latest completed "Contract Tests" workflow run on the default branch
//      concluded "success" AND ran against the branch's current HEAD commit —
//      a green run on stale code doesn't count.
//
// Together: the student's current code passes the unmodified test suite under
// the unmodified workflow. Uses GITHUB_TOKEN when set (same convention as
// lib/github/fetch-repo.ts) — required in production for rate-limit headroom.

import type { GradingConfig } from "./objective";
import type { ObjectiveResult } from "./objective";

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Square1AI-CiVerifier",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

function parseRepo(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

async function gh(path: string): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetch(`https://api.github.com${path}`, { headers: headers(), next: { revalidate: 0 } });
  let json: unknown = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { ok: res.ok, status: res.status, json };
}

async function treeShas(owner: string, repo: string): Promise<Map<string, string> | null> {
  const r = await gh(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);
  if (!r.ok) return null;
  const tree = (r.json as { tree?: { path: string; sha: string; type: string }[] })?.tree ?? [];
  return new Map(tree.filter((t) => t.type === "blob").map((t) => [t.path, t.sha]));
}

export async function verifyCiActions(githubUrl: string, cfg: GradingConfig): Promise<ObjectiveResult> {
  const fail = (error: string, detail: Record<string, unknown> = {}): ObjectiveResult => ({
    applicable: true, score: 0, passed: false, metric: "ci_actions", detail, error,
  });

  const starter = cfg.starter_repo;
  const workflowFile = cfg.workflow_file ?? "contract-tests.yml";
  if (!starter) return fail("This project's CI verification is misconfigured (no starter_repo). Please report this.");

  const student = parseRepo(githubUrl);
  const starterRef = parseRepo(`https://github.com/${starter}`);
  if (!student || !starterRef) return fail("Could not parse the GitHub repository URL.");
  if (student.owner === starterRef.owner && student.repo === starterRef.repo) {
    return fail("Submit YOUR repository (generated from the starter template), not the starter itself.");
  }

  // Protected paths: the workflow file is always protected — a green run under
  // a modified workflow proves nothing.
  const workflowPath = `.github/workflows/${workflowFile}`;
  const protectedPaths = Array.from(new Set([...(cfg.protected_paths ?? []), workflowPath]));

  // ── Check 1: protected files unmodified vs the starter ──
  const [studentTree, starterTree] = await Promise.all([
    treeShas(student.owner, student.repo),
    treeShas(starterRef.owner, starterRef.repo),
  ]);
  if (!studentTree) return fail("Could not read your repository. Is it public?");
  if (!starterTree) return fail("Could not read the starter repository to compare against. Please try again shortly.");

  const missing: string[] = [];
  const modified: string[] = [];
  for (const p of protectedPaths) {
    const want = starterTree.get(p);
    if (!want) continue; // path absent from starter — nothing to protect
    const got = studentTree.get(p);
    if (!got) missing.push(p);
    else if (got !== want) modified.push(p);
  }
  const filesUnmodified = missing.length === 0 && modified.length === 0;

  // ── Check 2: latest workflow run green on the current HEAD ──
  const repoMeta = await gh(`/repos/${student.owner}/${student.repo}`);
  const defaultBranch = (repoMeta.json as { default_branch?: string })?.default_branch ?? "main";
  const headCommit = await gh(`/repos/${student.owner}/${student.repo}/commits/${defaultBranch}`);
  const headSha = (headCommit.json as { sha?: string })?.sha ?? null;

  const runsRes = await gh(
    `/repos/${student.owner}/${student.repo}/actions/runs?branch=${encodeURIComponent(defaultBranch)}&per_page=30`
  );
  const allRuns = (runsRes.json as { workflow_runs?: { path?: string; status: string; conclusion: string | null; head_sha: string; html_url: string; created_at: string }[] })?.workflow_runs ?? [];
  const runs = allRuns.filter((r) => (r.path ?? "").endsWith(workflowFile));
  const latest = runs.find((r) => r.status === "completed") ?? null;

  let ciGreenOnHead = false;
  let ciNote = "";
  if (!latest) {
    ciNote = runs.length
      ? "Your Contract Tests workflow has not finished a run yet — wait for it to complete and resubmit."
      : "No Contract Tests workflow runs found. Push a commit (the workflow runs automatically) or trigger it from the Actions tab, then resubmit.";
  } else if (latest.conclusion !== "success") {
    ciNote = "Your latest Contract Tests run did not pass. Make the kit's tests pass, push, and resubmit.";
  } else if (headSha && latest.head_sha !== headSha) {
    ciNote = "Your latest commit has no green Contract Tests run yet — wait for CI on your newest push, then resubmit.";
  } else {
    ciGreenOnHead = true;
  }

  const checksPassed = (filesUnmodified ? 1 : 0) + (ciGreenOnHead ? 1 : 0);
  const score = checksPassed / 2;
  const passed = filesUnmodified && ciGreenOnHead;

  return {
    applicable: true,
    score,
    passed,
    metric: "ci_actions",
    detail: {
      files_unmodified: filesUnmodified,
      protected_missing: missing,
      protected_modified: modified,
      ci_green_on_head: ciGreenOnHead,
      latest_run_url: latest?.html_url ?? null,
      default_branch: defaultBranch,
    },
    error: passed
      ? undefined
      : [
          !filesUnmodified && `Protected kit files must stay unmodified — ${[...missing.map((p) => `${p} (missing)`), ...modified.map((p) => `${p} (changed)`)].join(", ")}. Restore them from the starter.`,
          !ciGreenOnHead && ciNote,
        ].filter(Boolean).join(" "),
  };
}
