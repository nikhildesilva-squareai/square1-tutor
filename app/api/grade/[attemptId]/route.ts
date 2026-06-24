import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { callAI, BudgetExceededError } from "@/lib/ai/budget";
import { rateLimitAI } from "@/lib/rate-limit";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Question {
  id: string;
  number: number;
  type: "mcq" | "short_answer" | "code";
  stem_md: string;
  options: string[] | null;
  correct_answer: string | null;
  mark_scheme_md: string | null;
  marks: number;
  topic_tags: string[];
  language: string | null;
}

interface Response {
  question_id: string;
  selected_option: string | null;
  response_text: string | null;
  code_response: string | null;
}

interface TopicAccum {
  correct: number;
  total: number;
  questionCount: number;
}

interface QuestionResult {
  id: string;
  number: number;
  stem: string;
  type: string;
  topicTag: string;
  marksAwarded: number;
  marksTotal: number;
  feedback: string | null;
  correct: boolean;
  correctAnswer: string | null;
  studentAnswer: string | null;
  improvedCode: string | null;
  breakdown: Array<{ criterion: string; awarded: number; reasoning: string }> | null;
  topicUnderstanding: string | null;
}

interface Grade {
  marks: number;
  feedback: string;
  breakdown: Array<{ criterion: string; awarded: number; reasoning: string }> | null;
  topicUnderstanding: string | null;
  improvedCode: string | null;
}

/** Pull the first JSON array out of an LLM response. */
function extractJsonArray(text: string): unknown[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Heuristic fallback when the AI grade for a question is missing/unparseable. */
function fallbackGrade(q: Question, answer: string, isCode: boolean): Grade {
  const hasContent = isCode ? answer.trim().length > 20 : answer.trim().split(/\s+/).length > 10;
  return {
    marks: hasContent ? Math.floor(q.marks * 0.5) : 0,
    feedback: "Could not automatically grade this answer — partial credit awarded where a response was provided.",
    breakdown: null,
    topicUnderstanding: "partial",
    improvedCode: null,
  };
}

/* ── Batch-grade all short-answer questions in ONE AI call ─────────────────
 * Previously this was one Claude call PER question. On a low org rate limit
 * (e.g. 5 req/min) a 12-question paper instantly exceeded the limit and the
 * whole grade failed with a 429. Batching keeps the entire paper to ~3 calls. */
async function gradeShortAnswers(
  studentId: string,
  questions: Question[],
  responseMap: Map<string, Response>,
  subject: string,
): Promise<Map<string, Grade>> {
  const out = new Map<string, Grade>();
  if (questions.length === 0) return out;

  const block = questions.map((q) => {
    const ans = responseMap.get(q.id)?.response_text ?? "";
    return `[#${q.number}] (${q.marks} marks)
Question: ${q.stem_md}
${q.mark_scheme_md ? `Mark scheme: ${q.mark_scheme_md}` : "Mark scheme: (use expert judgement)"}
Student's answer: ${ans || "(no answer provided)"}`;
  }).join("\n\n---\n\n");

  const result = await callAI(studentId, {
    max_tokens: 6000,
    messages: [{
      role: "user",
      content: `You are an expert examiner for ${subject}. Grade each answer strictly against its mark scheme. Award marks only for points in the mark scheme; be fair but rigorous.

Return ONLY a JSON array — one object per question, in the same order — and nothing else:
[
  {
    "number": <the #number>,
    "marks_awarded": <integer, 0..max>,
    "max_marks": <max for that question>,
    "breakdown": [{ "criterion": "...", "awarded": 0 or 1, "reasoning": "..." }],
    "feedback": "1-2 sentences: what was right, what was missing, how to improve",
    "topic_understanding": "strong" | "partial" | "weak"
  }
]

Questions:
${block}`,
    }],
  });

  const parsed = extractJsonArray(result.text) ?? [];
  const byNumber = new Map<number, Record<string, unknown>>();
  for (const item of parsed) {
    if (item && typeof item === "object" && "number" in item) {
      byNumber.set(Number((item as { number: unknown }).number), item as Record<string, unknown>);
    }
  }

  for (const q of questions) {
    const r = byNumber.get(q.number);
    if (!r) {
      out.set(q.id, fallbackGrade(q, responseMap.get(q.id)?.response_text ?? "", false));
      continue;
    }
    out.set(q.id, {
      marks: Math.min(Math.max(0, Math.round(Number(r.marks_awarded ?? 0))), q.marks),
      feedback: typeof r.feedback === "string" ? r.feedback : "No feedback available.",
      breakdown: Array.isArray(r.breakdown) ? (r.breakdown as Grade["breakdown"]) : [],
      topicUnderstanding: typeof r.topic_understanding === "string" ? r.topic_understanding : "partial",
      improvedCode: null,
    });
  }
  return out;
}

/* ── Batch-grade all code questions in ONE AI call ─────────────────────────── */
async function gradeCodeAnswers(
  studentId: string,
  questions: Question[],
  responseMap: Map<string, Response>,
  subject: string,
): Promise<Map<string, Grade>> {
  const out = new Map<string, Grade>();
  if (questions.length === 0) return out;

  const block = questions.map((q) => {
    const code = responseMap.get(q.id)?.code_response ?? "";
    const lang = q.language ?? "Python";
    return `[#${q.number}] (${q.marks} marks, ${lang})
Question: ${q.stem_md}
${q.mark_scheme_md ? `Mark scheme: ${q.mark_scheme_md}` : ""}
Student's code:
\`\`\`
${code || "// No code submitted"}
\`\`\``;
  }).join("\n\n---\n\n");

  const result = await callAI(studentId, {
    max_tokens: 8000,
    messages: [{
      role: "user",
      content: `You are a senior engineer grading code submissions for ${subject}. For each, judge correctness, code quality, edge cases, and best practices.

Return ONLY a JSON array — one object per question, in the same order — and nothing else:
[
  {
    "number": <the #number>,
    "marks_awarded": <integer, 0..max>,
    "max_marks": <max for that question>,
    "breakdown": [{ "criterion": "Correctness|Code quality|Edge cases|Best practices", "awarded": <int>, "reasoning": "..." }],
    "feedback": "what's good, what needs fixing, and how",
    "improved_code": "a concise corrected version (key fix only, <= 25 lines)"
  }
]

Questions:
${block}`,
    }],
  });

  const parsed = extractJsonArray(result.text) ?? [];
  const byNumber = new Map<number, Record<string, unknown>>();
  for (const item of parsed) {
    if (item && typeof item === "object" && "number" in item) {
      byNumber.set(Number((item as { number: unknown }).number), item as Record<string, unknown>);
    }
  }

  for (const q of questions) {
    const r = byNumber.get(q.number);
    if (!r) {
      out.set(q.id, fallbackGrade(q, responseMap.get(q.id)?.code_response ?? "", true));
      continue;
    }
    const marks = Math.min(Math.max(0, Math.round(Number(r.marks_awarded ?? 0))), q.marks);
    out.set(q.id, {
      marks,
      feedback: typeof r.feedback === "string" ? r.feedback : "No feedback available.",
      breakdown: Array.isArray(r.breakdown) ? (r.breakdown as Grade["breakdown"]) : [],
      topicUnderstanding: marks >= q.marks * 0.7 ? "strong" : marks >= q.marks * 0.4 ? "partial" : "weak",
      improvedCode: typeof r.improved_code === "string" ? r.improved_code : null,
    });
  }
  return out;
}

/* ── Generate AI recommendations (single call) ─────────────────────────────── */
async function generateRecommendations(
  studentId: string,
  level: string,
  topicMastery: Array<{ topic: string; percentage: number }>,
  subject: string,
): Promise<string> {
  const sorted = [...topicMastery].sort((a, b) => a.percentage - b.percentage);
  const weakTopics = sorted.slice(0, 3).map((t) => `${t.topic} (${t.percentage}%)`).join(", ");
  const strongTopics = [...sorted].reverse().slice(0, 3).map((t) => `${t.topic} (${t.percentage}%)`).join(", ");

  const result = await callAI(studentId, {
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `A student just completed a skill assessment for ${subject} and placed at ${level} level.

Their strongest areas: ${strongTopics || "none identified"}
Their weakest areas: ${weakTopics || "none identified"}

Write a personalised learning strategy in this exact structure:

1. A brief paragraph summarising their current level
2. A numbered list of 3 specific modules to focus on, ordered by priority (weakest first), with why each matters
3. An estimated time to close all gaps (in months at 1 hour/day)

Keep it concise, specific, encouraging, and actionable. Max 200 words. Do NOT use markdown headers.`,
    }],
  });

  return result.text;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN HANDLER                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;

    if (!UUID_REGEX.test(attemptId)) {
      return NextResponse.json({ error: "Invalid attemptId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify student owns attempt
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Rate limit: 15 AI requests per minute
    const rl = rateLimitAI(student.id);
    if (!rl.success) return rl.response;

    // Load attempt
    const { data: existingAttempt } = await supabase
      .from("assessment_attempts")
      .select("id, status, paper_id, score, max_score, percentage, level_determined")
      .eq("id", attemptId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (!existingAttempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    /* ── Return existing report if already graded ──────────────────────── */
    if (existingAttempt.status === "graded") {
      const { data: existingReport } = await supabase
        .from("skill_reports")
        .select("*")
        .eq("attempt_id", attemptId)
        .maybeSingle();

      if (existingReport) {
        const { data: questionResults } = await supabase
          .from("assessment_responses")
          .select("question_id, selected_option, response_text, code_response, partial_credit, ai_feedback_md")
          .eq("attempt_id", attemptId);

        const { data: questions } = await supabase
          .from("assessment_questions")
          .select("id, number, type, stem_md, marks, correct_answer, mark_scheme_md, topic_tags, language, starter_code")
          .eq("paper_id", existingAttempt.paper_id)
          .order("number", { ascending: true }) as { data: Question[] | null };

        const qResultMap = new Map((questionResults ?? []).map((r: {
          question_id: string;
          selected_option: string | null;
          response_text: string | null;
          code_response: string | null;
          partial_credit: number | null;
          ai_feedback_md: string | null;
        }) => [r.question_id, r]));

        const qResults: QuestionResult[] = (questions ?? []).map((q) => {
          const r = qResultMap.get(q.id);
          const awarded = r?.partial_credit ?? 0;
          const studentAnswer = q.type === "mcq"
            ? r?.selected_option ?? null
            : q.type === "code"
            ? r?.code_response ?? null
            : r?.response_text ?? null;

          // Parse feedback JSON if possible (for breakdown data)
          let breakdown = null;
          let topicUnderstanding = null;
          let improvedCode = null;
          try {
            if (r?.ai_feedback_md) {
              const parsed = JSON.parse(r.ai_feedback_md);
              if (parsed.breakdown) breakdown = parsed.breakdown;
              if (parsed.topicUnderstanding) topicUnderstanding = parsed.topicUnderstanding;
              if (parsed.improvedCode) improvedCode = parsed.improvedCode;
            }
          } catch {
            // ai_feedback_md is plain text
          }

          return {
            id: q.id,
            number: q.number,
            stem: q.stem_md,
            type: q.type,
            topicTag: q.topic_tags?.[0] ?? "General",
            marksAwarded: awarded,
            marksTotal: q.marks,
            feedback: typeof r?.ai_feedback_md === "string" && !r.ai_feedback_md.startsWith("{")
              ? r.ai_feedback_md
              : breakdown ? null : r?.ai_feedback_md ?? null,
            correct: awarded >= q.marks,
            correctAnswer: q.correct_answer ?? q.mark_scheme_md ?? null,
            studentAnswer,
            improvedCode,
            breakdown,
            topicUnderstanding,
          };
        });

        // Parse feedback from stored JSON for existing results
        for (const qr of qResults) {
          const r = qResultMap.get(qr.id);
          if (r?.ai_feedback_md) {
            try {
              const parsed = JSON.parse(r.ai_feedback_md);
              if (parsed.feedback) qr.feedback = parsed.feedback;
              if (parsed.breakdown) qr.breakdown = parsed.breakdown;
              if (parsed.topicUnderstanding) qr.topicUnderstanding = parsed.topicUnderstanding;
              if (parsed.improvedCode) qr.improvedCode = parsed.improvedCode;
            } catch {
              qr.feedback = r.ai_feedback_md;
            }
          }
        }

        return NextResponse.json({
          reportId: existingReport.id,
          level: existingAttempt.level_determined,
          score: existingAttempt.score,
          maxScore: existingAttempt.max_score,
          percentage: existingAttempt.percentage,
          topicMastery: existingReport.topic_mastery_json ?? [],
          recommendationsMd: existingReport.recommendations_md ?? "",
          questionResults: qResults,
        });
      }
    }

    /* ── Load questions and responses ──────────────────────────────────── */
    const { data: questions, error: qErr } = await supabase
      .from("assessment_questions")
      .select("id, number, type, stem_md, options, correct_answer, mark_scheme_md, marks, topic_tags, language, starter_code")
      .eq("paper_id", existingAttempt.paper_id)
      .order("number", { ascending: true }) as { data: Question[] | null; error: unknown };

    if (qErr || !questions) {
      return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
    }

    const { data: responses, error: rErr } = await supabase
      .from("assessment_responses")
      .select("question_id, selected_option, response_text, code_response")
      .eq("attempt_id", attemptId) as { data: Response[] | null; error: unknown };

    if (rErr) {
      return NextResponse.json({ error: "Failed to load responses" }, { status: 500 });
    }

    const responseMap = new Map((responses ?? []).map((r) => [r.question_id, r]));

    // Get course name for context
    const { data: paper } = await supabase
      .from("assessment_papers")
      .select("course_id")
      .eq("id", existingAttempt.paper_id)
      .maybeSingle();

    let subject = "Technology";
    if (paper?.course_id) {
      const { data: course } = await supabase
        .from("courses")
        .select("title")
        .eq("id", paper.course_id)
        .maybeSingle();
      if (course?.title) subject = course.title;
    }

    /* ── Grade all questions ───────────────────────────────────────────── */
    const allGrades: Record<string, Grade> = {};

    // MCQ — auto-grade (no AI needed)
    for (const q of questions.filter((q) => q.type === "mcq")) {
      const resp = responseMap.get(q.id);
      const selected = (resp?.selected_option ?? "").trim().toLowerCase();
      const correct = (q.correct_answer ?? "").trim().toLowerCase();
      const isCorrect = selected === correct;
      allGrades[q.id] = {
        marks: isCorrect ? q.marks : 0,
        feedback: isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${q.correct_answer}`,
        breakdown: null,
        topicUnderstanding: isCorrect ? "strong" : "weak",
        improvedCode: null,
      };
    }

    // Free-response — TWO batched AI calls (all short answers in one, all code in
    // one) instead of one-per-question. Cuts a 20-question paper from ~13 AI calls
    // to 2, keeping us well under the org rate limit and avoiding the function
    // timeout. Each batch catches its own error and falls back per-question.
    const shortQs = questions.filter((q) => q.type === "short_answer");
    const codeQs = questions.filter((q) => q.type === "code");

    const [shortGrades, codeGrades] = await Promise.all([
      gradeShortAnswers(student.id, shortQs, responseMap, subject).catch((e) => {
        console.error("[grade] short-answer batch failed:", e);
        return new Map(shortQs.map((q) => [q.id, fallbackGrade(q, responseMap.get(q.id)?.response_text ?? "", false)]));
      }),
      gradeCodeAnswers(student.id, codeQs, responseMap, subject).catch((e) => {
        console.error("[grade] code batch failed:", e);
        return new Map(codeQs.map((q) => [q.id, fallbackGrade(q, responseMap.get(q.id)?.code_response ?? "", true)]));
      }),
    ]);

    for (const [id, g] of shortGrades) allGrades[id] = g;
    for (const [id, g] of codeGrades) allGrades[id] = g;

    /* ── Calculate scores and topic mastery ─────────────────────────────── */
    let totalScore = 0;
    let totalMax = 0;
    const topicAccum: Record<string, TopicAccum> = {};

    let mcqScore = 0, mcqMax = 0;
    let shortScore = 0, shortMax = 0;
    let codeScore = 0, codeMax = 0;

    const questionResults: QuestionResult[] = [];

    for (const q of questions) {
      const grade = allGrades[q.id] ?? { marks: 0, feedback: null, breakdown: null, topicUnderstanding: null, improvedCode: null };
      totalScore += grade.marks;
      totalMax += q.marks;

      if (q.type === "mcq") { mcqScore += grade.marks; mcqMax += q.marks; }
      else if (q.type === "short_answer") { shortScore += grade.marks; shortMax += q.marks; }
      else { codeScore += grade.marks; codeMax += q.marks; }

      for (const tag of q.topic_tags ?? []) {
        if (!topicAccum[tag]) topicAccum[tag] = { correct: 0, total: 0, questionCount: 0 };
        topicAccum[tag].correct += grade.marks;
        topicAccum[tag].total += q.marks;
        topicAccum[tag].questionCount += 1;
      }

      const resp = responseMap.get(q.id);
      const studentAnswer = q.type === "mcq"
        ? resp?.selected_option ?? null
        : q.type === "code"
        ? resp?.code_response ?? null
        : resp?.response_text ?? null;

      questionResults.push({
        id: q.id,
        number: q.number,
        stem: q.stem_md,
        type: q.type,
        topicTag: q.topic_tags?.[0] ?? "General",
        marksAwarded: grade.marks,
        marksTotal: q.marks,
        feedback: grade.feedback,
        correct: grade.marks >= q.marks,
        correctAnswer: q.correct_answer ?? q.mark_scheme_md ?? null,
        studentAnswer,
        improvedCode: grade.improvedCode,
        breakdown: grade.breakdown,
        topicUnderstanding: grade.topicUnderstanding,
      });
    }

    const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const level: "beginner" | "intermediate" | "advanced" =
      percentage >= 70 ? "advanced" : percentage >= 40 ? "intermediate" : "beginner";

    const topicMastery = Object.entries(topicAccum).map(([topic, { correct, total, questionCount }]) => ({
      topic,
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      questionCount,
    }));

    /* ── Generate AI recommendations (1 call) ──────────────────────────── */
    let recommendationsMd = "";
    try {
      recommendationsMd = await generateRecommendations(student.id, level, topicMastery, subject);
    } catch (e) {
      console.error("[grade] recommendations failed (non-fatal):", e);
      recommendationsMd = "Your personalised study plan will appear here shortly. Focus first on your lowest-scoring topics above.";
    }

    /* ── Save skill report ─────────────────────────────────────────────── */
    const weakTopics = Object.entries(topicAccum)
      .filter(([, v]) => v.total > 0 && (v.correct / v.total) < 0.5)
      .map(([k]) => k);
    const strongTopics = Object.entries(topicAccum)
      .filter(([, v]) => v.total > 0 && (v.correct / v.total) >= 0.7)
      .map(([k]) => k);

    const { data: report, error: reportErr } = await supabase
      .from("skill_reports")
      .insert({
        attempt_id: attemptId,
        student_id: student.id,
        course_id: paper?.course_id ?? null,
        level_determined: level,
        estimated_score: totalScore,
        max_score: totalMax,
        topic_mastery_json: topicMastery,
        weak_topics: weakTopics,
        strong_topics: strongTopics,
        recommendations_md: recommendationsMd,
      })
      .select("id")
      .single();

    if (reportErr || !report) {
      console.error("[grade] save report error:", reportErr);
      return NextResponse.json({ error: "Failed to save skill report" }, { status: 500 });
    }

    /* ── Update responses with marks + structured feedback (in parallel) ── */
    await Promise.all(
      questions.map((q) => {
        const grade = allGrades[q.id];
        if (!grade) return Promise.resolve();
        const feedbackData = JSON.stringify({
          feedback: grade.feedback,
          breakdown: grade.breakdown,
          topicUnderstanding: grade.topicUnderstanding,
          improvedCode: grade.improvedCode,
        });
        return supabase
          .from("assessment_responses")
          .update({
            is_correct: grade.marks > 0,
            partial_credit: grade.marks,
            ai_feedback_md: feedbackData,
            graded_at: new Date().toISOString(),
          })
          .eq("attempt_id", attemptId)
          .eq("question_id", q.id);
      }),
    );

    /* ── Update attempt status ─────────────────────────────────────────── */
    await supabase
      .from("assessment_attempts")
      .update({
        status: "graded",
        score: totalScore,
        max_score: totalMax,
        percentage,
        level_determined: level,
        graded_at: new Date().toISOString(),
      })
      .eq("id", attemptId);

    return NextResponse.json({
      reportId: report.id,
      level,
      score: totalScore,
      maxScore: totalMax,
      percentage,
      mcqScore,
      mcqMax,
      shortScore,
      shortMax,
      codeScore,
      codeMax,
      topicMastery,
      recommendationsMd,
      questionResults,
    });
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json(
        { error: err.message, reply: err.message },
        { status: 429 },
      );
    }
    // Anthropic rate limit / overload — surface an actionable, retryable message
    // instead of a generic 500 so the UI can tell the learner to try again.
    if (err instanceof Anthropic.RateLimitError || (err as { status?: number })?.status === 429) {
      return NextResponse.json(
        { error: "Our AI grader is briefly at capacity. Please wait a minute, then reopen your results to finish grading." },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError && (err.status === 529 || err.status === 503)) {
      return NextResponse.json(
        { error: "The AI grader is momentarily overloaded. Please try again in a minute." },
        { status: 503 },
      );
    }
    console.error("[grade]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
