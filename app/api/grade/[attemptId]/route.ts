import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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
}

interface QuestionResult {
  id: string;
  number: number;
  stem: string;
  type: string;
  marksAwarded: number;
  marksTotal: number;
  feedback: string | null;
  correct: boolean;
}

async function gradeWithAI(
  anthropic: Anthropic,
  questions: Question[],
  responses: Response[]
): Promise<Record<string, { marks: number; feedback: string }>> {
  const results: Record<string, { marks: number; feedback: string }> = {};

  const nonMCQ = questions.filter((q) => q.type !== "mcq");
  if (nonMCQ.length === 0) return results;

  const responseMap = new Map(responses.map((r) => [r.question_id, r]));

  const items = nonMCQ.map((q) => {
    const resp = responseMap.get(q.id);
    const answer = q.type === "code"
      ? (resp?.code_response ?? "")
      : (resp?.response_text ?? "");
    return `Q${q.number} [${q.type.toUpperCase()} | ${q.marks} marks]:
Question: ${q.stem_md}
${q.mark_scheme_md ? `Mark scheme: ${q.mark_scheme_md}` : ""}
Student answer: ${answer || "(no answer)"}`;
  }).join("\n\n---\n\n");

  const prompt = `You are an expert examiner grading a technical assessment. Grade each question below strictly but fairly.

For each question, provide:
1. marks: integer from 0 to the max marks
2. feedback: one concise sentence explaining what was good or where marks were lost

Return valid JSON only in this format:
{
  "grades": [
    { "questionNumber": 1, "marks": 2, "feedback": "..." },
    ...
  ]
}

Questions to grade:
${items}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as { grades: { questionNumber: number; marks: number; feedback: string }[] };

    for (const grade of parsed.grades) {
      const q = nonMCQ.find((q) => q.number === grade.questionNumber);
      if (q) {
        results[q.id] = {
          marks: Math.min(Math.max(0, Math.round(grade.marks)), q.marks),
          feedback: grade.feedback,
        };
      }
    }
  } catch {
    // fallback: give partial credit
    for (const q of nonMCQ) {
      const resp = responseMap.get(q.id);
      const hasAnswer = q.type === "code"
        ? (resp?.code_response ?? "").trim().length > 20
        : (resp?.response_text ?? "").trim().split(/\s+/).length > 10;
      results[q.id] = {
        marks: hasAnswer ? Math.floor(q.marks * 0.5) : 0,
        feedback: "Could not automatically grade — partial credit awarded where answer was provided.",
      };
    }
  }

  return results;
}

async function generateRecommendations(
  anthropic: Anthropic,
  level: string,
  topicMastery: Array<{ topic: string; percentage: number }>
): Promise<string> {
  const sorted = [...topicMastery].sort((a, b) => a.percentage - b.percentage);
  const weakTopics = sorted.slice(0, 3).map((t) => `${t.topic} (${t.percentage}%)`).join(", ");
  const strongTopics = sorted.reverse().slice(0, 3).map((t) => `${t.topic} (${t.percentage}%)`).join(", ");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `A student just completed a tech skill assessment and placed at ${level} level.

Their strongest areas: ${strongTopics || "none identified"}
Their weakest areas: ${weakTopics || "none identified"}

Write a personalised 3–4 paragraph learning recommendation in markdown. Be specific, encouraging, and actionable. Include:
1. A brief summary of their current level
2. What to focus on first (weakest areas)
3. How to leverage their strengths
4. A motivating closing line

Keep it concise — max 250 words.`,
    }],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

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

    // Check if already graded — return existing report
    const { data: existingAttempt } = await supabase
      .from("assessment_attempts")
      .select("id, status, paper_id, score, max_score, percentage, level_determined")
      .eq("id", attemptId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (!existingAttempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (existingAttempt.status === "graded") {
      // Return existing report
      const { data: existingReport } = await supabase
        .from("skill_reports")
        .select("*")
        .eq("attempt_id", attemptId)
        .maybeSingle();

      if (existingReport) {
        const { data: questionResults } = await supabase
          .from("assessment_responses")
          .select("question_id, selected_option, response_text, code_response, marks_awarded, ai_feedback")
          .eq("attempt_id", attemptId);

        const { data: questions } = await supabase
          .from("assessment_questions")
          .select("id, number, type, stem_md, marks")
          .eq("paper_id", existingAttempt.paper_id)
          .order("number", { ascending: true }) as { data: Question[] | null };

        const qResultMap = new Map((questionResults ?? []).map((r: {
          question_id: string;
          selected_option: string | null;
          response_text: string | null;
          code_response: string | null;
          marks_awarded: number | null;
          ai_feedback: string | null;
        }) => [r.question_id, r]));

        const qResults: QuestionResult[] = (questions ?? []).map((q) => {
          const r = qResultMap.get(q.id);
          const awarded = r?.marks_awarded ?? 0;
          return {
            id: q.id,
            number: q.number,
            stem: q.stem_md,
            type: q.type,
            marksAwarded: awarded,
            marksTotal: q.marks,
            feedback: r?.ai_feedback ?? null,
            correct: awarded >= q.marks,
          };
        });

        return NextResponse.json({
          reportId: existingReport.id,
          level: existingAttempt.level_determined,
          score: existingAttempt.score,
          maxScore: existingAttempt.max_score,
          percentage: existingAttempt.percentage,
          topicMastery: existingReport.topic_mastery ?? [],
          recommendationsMd: existingReport.recommendations_md ?? "",
          questionResults: qResults,
        });
      }
    }

    // Load questions
    const { data: questions, error: qErr } = await supabase
      .from("assessment_questions")
      .select("id, number, type, stem_md, options, correct_answer, mark_scheme_md, marks, topic_tags, language, starter_code")
      .eq("paper_id", existingAttempt.paper_id)
      .order("number", { ascending: true }) as { data: Question[] | null; error: unknown };

    if (qErr || !questions) {
      return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
    }

    // Load responses
    const { data: responses, error: rErr } = await supabase
      .from("assessment_responses")
      .select("question_id, selected_option, response_text, code_response")
      .eq("attempt_id", attemptId) as { data: Response[] | null; error: unknown };

    if (rErr) {
      return NextResponse.json({ error: "Failed to load responses" }, { status: 500 });
    }

    const responseMap = new Map((responses ?? []).map((r) => [r.question_id, r]));

    // Auto-grade MCQ
    const mcqGrades: Record<string, { marks: number; feedback: string | null }> = {};
    for (const q of questions.filter((q) => q.type === "mcq")) {
      const resp = responseMap.get(q.id);
      const selected = (resp?.selected_option ?? "").trim().toLowerCase();
      const correct = (q.correct_answer ?? "").trim().toLowerCase();
      const isCorrect = selected === correct;
      mcqGrades[q.id] = {
        marks: isCorrect ? q.marks : 0,
        feedback: isCorrect ? null : `Correct answer: ${q.correct_answer}`,
      };
    }

    // AI-grade non-MCQ
    const anthropic = new Anthropic();
    const aiGrades = await gradeWithAI(anthropic, questions, responses ?? []);

    const allGrades: Record<string, { marks: number; feedback: string | null }> = {
      ...mcqGrades,
      ...Object.fromEntries(
        Object.entries(aiGrades).map(([k, v]) => [k, { marks: v.marks, feedback: v.feedback }])
      ),
    };

    // Calculate scores
    let totalScore = 0;
    let totalMax = 0;
    const topicAccum: Record<string, TopicAccum> = {};

    const questionResults: QuestionResult[] = [];

    for (const q of questions) {
      const grade = allGrades[q.id] ?? { marks: 0, feedback: null };
      totalScore += grade.marks;
      totalMax += q.marks;

      for (const tag of q.topic_tags ?? []) {
        if (!topicAccum[tag]) topicAccum[tag] = { correct: 0, total: 0 };
        topicAccum[tag].correct += grade.marks;
        topicAccum[tag].total += q.marks;
      }

      questionResults.push({
        id: q.id,
        number: q.number,
        stem: q.stem_md,
        type: q.type,
        marksAwarded: grade.marks,
        marksTotal: q.marks,
        feedback: grade.feedback,
        correct: grade.marks >= q.marks,
      });
    }

    const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const level: "beginner" | "intermediate" | "advanced" =
      percentage >= 70 ? "advanced" : percentage >= 40 ? "intermediate" : "beginner";

    const topicMastery = Object.entries(topicAccum).map(([topic, { correct, total }]) => ({
      topic,
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    }));

    // Generate recommendations
    const recommendationsMd = await generateRecommendations(anthropic, level, topicMastery);

    // Find course_id from paper
    const { data: paper } = await supabase
      .from("assessment_papers")
      .select("course_id")
      .eq("id", existingAttempt.paper_id)
      .maybeSingle();

    // Save skill report
    const { data: report, error: reportErr } = await supabase
      .from("skill_reports")
      .insert({
        attempt_id: attemptId,
        student_id: student.id,
        course_id: paper?.course_id ?? null,
        level_determined: level,
        score: totalScore,
        max_score: totalMax,
        percentage,
        topic_mastery: topicMastery,
        recommendations_md: recommendationsMd,
      })
      .select("id")
      .single();

    if (reportErr || !report) {
      console.error("[grade] save report error:", reportErr);
      return NextResponse.json({ error: "Failed to save skill report" }, { status: 500 });
    }

    // Update responses with marks
    for (const q of questions) {
      const grade = allGrades[q.id];
      if (!grade) continue;
      await supabase
        .from("assessment_responses")
        .update({
          marks_awarded: grade.marks,
          ai_feedback: grade.feedback,
        })
        .eq("attempt_id", attemptId)
        .eq("question_id", q.id);
    }

    // Update attempt
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
      topicMastery,
      recommendationsMd,
      questionResults,
    });
  } catch (err) {
    console.error("[grade]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
