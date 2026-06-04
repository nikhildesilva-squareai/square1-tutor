import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callAI, BudgetExceededError } from "@/lib/ai/budget";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const contextSchema = z.object({
  courseTitle: z.string(),
  currentLessonTitle: z.string().nullable(),
  weakTopics: z.array(z.string()),
}).optional();

const schema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  context: contextSchema,
});

function buildSystemPrompt(
  studentName: string,
  context?: { courseTitle: string; currentLessonTitle: string | null; weakTopics: string[] },
): string {
  let prompt = `You are the Square1 AI Tutor for ${studentName}.`;

  if (context) {
    prompt += `\nThey are studying ${context.courseTitle}`;
    if (context.currentLessonTitle) {
      prompt += `, currently on "${context.currentLessonTitle}"`;
    }
    prompt += ".";
    if (context.weakTopics.length > 0) {
      prompt += `\nTheir assessment showed weaknesses in: ${context.weakTopics.join(", ")}.`;
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
- Keep responses concise and scannable (use bullet points, code blocks where appropriate)
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
    const { messages, context } = schema.parse(body);

    // Get student for budget tracking
    const { data: student } = await supabase
      .from("students")
      .select("id, name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const studentName = student.name ?? user.email?.split("@")[0] ?? "Student";
    const systemPrompt = buildSystemPrompt(studentName, context);

    const result = await callAI(student.id, {
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 1024,
    });

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
