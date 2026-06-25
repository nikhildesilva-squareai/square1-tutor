// Objective, token-free grading of a student's submitted tool OUTPUT against a
// withheld answer key. Used by /api/projects/submit when projects.grading is set.
//
// No code execution / sandbox: the learner never received the answer key (it is
// stripped from the starter repo + dataset zip and lives only in projects.grading),
// so comparing their reported output to ground truth is a real completion check.

export type GradingMetric =
  | "set_f1"            // findings/IOCs/events as a set → F1 over canonical keys
  | "set_recall"        // same, but score = recall (did they catch the planted items)
  | "accuracy"          // per-item label match (id_field → label_field)
  | "exact"             // exact match of value(s) (e.g. recovered plaintext / shift)
  | "numeric_tolerance"; // numbers within a relative tolerance (e.g. risk scores)

export interface GradingConfig {
  metric: GradingMetric;
  threshold: number;          // 0..1 objective pass bar
  submit_format: string;      // human-readable: exactly what the student pastes
  answer_key: unknown;        // ground truth; shape depends on metric
  key_fields?: string[];      // set_* : fields that form the canonical comparable key
  id_field?: string;          // accuracy : field that matches student↔truth items
  label_field?: string;       // accuracy : field compared for correctness
  tolerance?: number;         // numeric_tolerance : relative tolerance (default 0.05)
}

export interface ObjectiveResult {
  applicable: boolean;
  score: number;              // 0..1
  passed: boolean;
  metric: string;
  detail: Record<string, unknown>;
  error?: string;
}

function get(obj: unknown, key: string): unknown {
  return obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined;
}

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function canonKey(item: unknown, fields?: string[]): string {
  if (item && typeof item === "object" && fields && fields.length) {
    return fields.map((f) => norm(get(item, f))).join("|");
  }
  return norm(item);
}

// Parse whatever the student pasted: JSON, a ```json fenced block, or plain lines.
function parseOutput(output: string): unknown {
  const t = output.trim();
  try { return JSON.parse(t); } catch { /* not raw json */ }
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) { try { return JSON.parse(fence[1]); } catch { /* not fenced json */ } }
  return t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function asArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    for (const k of ["findings", "results", "iocs", "items", "detections", "events", "rows", "predictions"]) {
      const inner = get(v, k);
      if (Array.isArray(inner)) return inner;
    }
  }
  return v == null ? [] : [v];
}

export function scoreObjective(cfg: GradingConfig, rawOutput: string): ObjectiveResult {
  if (!rawOutput || !rawOutput.trim()) {
    return { applicable: true, score: 0, passed: false, metric: cfg.metric, detail: {}, error: "No output submitted." };
  }
  const parsed = parseOutput(rawOutput);

  switch (cfg.metric) {
    case "set_f1":
    case "set_recall": {
      const truth = new Set(asArray(cfg.answer_key).map((i) => canonKey(i, cfg.key_fields)));
      const pred = new Set(asArray(parsed).map((i) => canonKey(i, cfg.key_fields)));
      let tp = 0;
      for (const p of pred) if (truth.has(p)) tp++;
      const recall = truth.size ? tp / truth.size : 0;
      const precision = pred.size ? tp / pred.size : 0;
      const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
      const score = cfg.metric === "set_recall" ? recall : f1;
      return {
        applicable: true, score, passed: score >= cfg.threshold, metric: cfg.metric,
        detail: { tp, fp: pred.size - tp, fn: truth.size - tp, precision: round(precision), recall: round(recall), f1: round(f1), truth_count: truth.size, predicted_count: pred.size },
      };
    }
    case "accuracy": {
      const idF = cfg.id_field ?? "id";
      const labF = cfg.label_field ?? "label";
      const truthMap = new Map(asArray(cfg.answer_key).map((i) => [norm(get(i, idF)), norm(get(i, labF))]));
      let correct = 0, graded = 0;
      for (const p of asArray(parsed)) {
        const id = norm(get(p, idF));
        if (truthMap.has(id)) { graded++; if (truthMap.get(id) === norm(get(p, labF))) correct++; }
      }
      const score = truthMap.size ? correct / truthMap.size : 0;
      return { applicable: true, score, passed: score >= cfg.threshold, metric: "accuracy", detail: { correct, graded, total: truthMap.size, accuracy: round(score) } };
    }
    case "exact": {
      const want = Array.isArray(cfg.answer_key) ? cfg.answer_key.map(norm) : [norm(cfg.answer_key)];
      const got = Array.isArray(parsed) ? parsed.map(norm) : [norm(parsed)];
      const matched = want.filter((w) => got.includes(w)).length;
      const score = want.length ? matched / want.length : 0;
      return { applicable: true, score, passed: score >= cfg.threshold, metric: "exact", detail: { matched, total: want.length } };
    }
    case "numeric_tolerance": {
      const tol = cfg.tolerance ?? 0.05;
      const want = asArray(cfg.answer_key).map((x) => Number(x));
      const got = asArray(parsed).map((x) => Number(x));
      let ok = 0;
      for (let i = 0; i < want.length; i++) {
        if (Number.isFinite(got[i]) && Math.abs(got[i] - want[i]) <= Math.abs(want[i]) * tol + 1e-9) ok++;
      }
      const score = want.length ? ok / want.length : 0;
      return { applicable: true, score, passed: score >= cfg.threshold, metric: "numeric_tolerance", detail: { ok, total: want.length, tolerance: tol } };
    }
    default:
      return { applicable: false, score: 0, passed: false, metric: String(cfg.metric), detail: {}, error: "Unknown metric." };
  }
}
