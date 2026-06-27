import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callAI, BudgetExceededError } from "@/lib/ai/budget";
import { rateLimitAI } from "@/lib/rate-limit";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const contextSchema = z.object({
  courseTitle: z.string(),
  currentLessonTitle: z.string().nullable(),
  weakTopics: z.array(z.string()),
  lessonObjectives: z.array(z.string()).optional(),
  lessonContentSummary: z.string().optional(),
  currentWork: z.string().max(4000).optional(),
}).optional();

const schema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  context: contextSchema,
  conversationId: z.string().optional(),
});

function buildSystemPrompt(
  studentName: string,
  context?: { courseTitle: string; currentLessonTitle: string | null; weakTopics: string[]; lessonObjectives?: string[]; lessonContentSummary?: string; currentWork?: string },
): string {
  let prompt = `You are Nova, the AI tutor for ${studentName} on Square 1 AI.`;

  if (context) {
    prompt += `\nThey are studying ${context.courseTitle}`;
    if (context.currentLessonTitle) {
      prompt += `, currently on "${context.currentLessonTitle}"`;
    }
    prompt += ".";
    if (context.weakTopics.length > 0) {
      prompt += `\nTheir assessment showed weaknesses in: ${context.weakTopics.join(", ")}. Proactively connect explanations to these weak areas when relevant.`;
    }
    if (context.lessonObjectives && context.lessonObjectives.length > 0) {
      prompt += `\n\nCurrent lesson learning objectives:\n${context.lessonObjectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
    }
    if (context.lessonContentSummary) {
      prompt += `\n\nCurrent lesson content (reference this when the student asks about their lesson):\n${context.lessonContentSummary}`;
    }
    if (context.currentWork) {
      prompt += `\n\nThe student's current work in this lesson (their own code / answers so far — refer to it directly, point out specific issues, and guide them from where they are):\n${context.currentWork}`;
    }
  }

  prompt += `

Be specific. Reference their current lesson material when relevant.
If they ask about code, give concrete examples.
Keep responses concise (under 300 words unless they ask for detail).

Your persona:
- Warm, patient, and encouraging
- Expert-level technical knowledge but explains things clearly
- Uses concrete examples, analogies, and code snippets
- Celebrates progress and normalises struggle

Your rules:
- You render inside a NARROW chat side-panel. Do NOT use Markdown headings (#, ##, ###) or horizontal rules (---) -- they look wrong here. Structure with short **bold** lead-ins, short paragraphs, and bullet points instead.
- Keep responses concise and scannable
- Always use markdown formatting for code (fenced code blocks with language tags)
- If a student shares code with an error, diagnose and explain the fix step by step
- Ask clarifying questions if the problem is unclear
- Never just give the answer to homework/project problems -- guide with hints
- Stay on topic: tech learning, coding, debugging, CS concepts`;

  return prompt;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messages, context, conversationId } = schema.parse(body);

    // Get student for budget tracking
    const { data: student } = await supabase
      .from("students")
      .select("id, name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Rate limit: 15 AI requests per minute per student
    const rl = rateLimitAI(student.id);
    if (!rl.success) return rl.response;

    const studentName = student.name ?? user.email?.split("@")[0] ?? "Student";
    let systemPrompt = buildSystemPrompt(studentName, context);

    // ── RAG: ground Nova in the curriculum via lexical retrieval (best-effort).
    // If anything fails, Nova proceeds exactly as before — never blocks the chat.
    try {
      const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
      if (lastUser.trim().length > 2) {
        const { data: hits } = await supabase.rpc("search_curriculum", {
          q: lastUser.slice(0, 500),
          match_count: 5,
        });
        if (Array.isArray(hits) && hits.length > 0) {
          const block = (hits as Array<{ title?: string; course_slug?: string; snippet?: string }>)
            .map((h, i) => `[${i + 1}] ${h.title ?? "Course material"}${h.course_slug ? ` (${h.course_slug})` : ""}: ${(h.snippet ?? "").replace(/\s+/g, " ").trim()}`)
            .join("\n");
          systemPrompt += `\n\nRelevant Square 1 course material (ground your answer in this; name the lesson/project when you use it, and don't invent beyond what the curriculum says):\n${block}`;
        }
      }
    } catch (e) {
      console.error("[tutor/chat] rag (non-fatal)", e);
    }

    const result = await callAI(student.id, {
      feature: "tutor",
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 1024,
    });

    // Save messages to conversation (non-blocking)
    if (conversationId) {
      const lastUserMsg = messages[messages.length - 1];
      try {
        // Save user message
        await supabase.from("tutor_messages").insert({
          conversation_id: conversationId,
          student_id: student.id,
          role: "user",
          content: lastUserMsg.content,
        });
        // Save assistant reply
        await supabase.from("tutor_messages").insert({
          conversation_id: conversationId,
          student_id: student.id,
          role: "assistant",
          content: result.text,
        });
        // Update conversation metadata
        const title = messages.length <= 2
          ? lastUserMsg.content.slice(0, 60) + (lastUserMsg.content.length > 60 ? "..." : "")
          : undefined;
        await supabase.from("tutor_conversations").update({
          message_count: messages.length + 1,
          last_message_at: new Date().toISOString(),
          ...(title ? { title } : {}),
        }).eq("id", conversationId);
      } catch {
        // Non-blocking — don't fail the chat if saving fails
      }
    }

    return NextResponse.json({ reply: result.text });
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json(
        { error: err.message, reply: err.message },
        { status: 429 },
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[tutor/chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
