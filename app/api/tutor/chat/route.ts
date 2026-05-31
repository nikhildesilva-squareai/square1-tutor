import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const schema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
});

const SYSTEM_PROMPT = `You are Square 1 AI Tutor — an expert, encouraging tech educator helping students learn programming, software development, and computer science.

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
- Never just give the answer to homework/project problems — guide with hints
- Stay on topic: tech learning, coding, debugging, CS concepts`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messages } = schema.parse(body);

    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[tutor/chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
