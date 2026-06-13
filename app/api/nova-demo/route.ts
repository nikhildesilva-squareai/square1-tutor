import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

// ═══════════════════════════════════════════════════════════════════════════════
// Public, no-login Nova demo — lets a visitor feel the tutor before signing up.
//
// This endpoint spends money on every call, so it is defended in layers:
//   1. Per-IP burst limit       (10 / 5 min)         — stops scripted hammering
//   2. Per-IP daily limit        (30 / day)          — stops one IP draining it
//   3. Global daily backstop     (5000 / day)        — hard ceiling on total cost
//   4. Conversation cap          (max 6 user turns)  — converts to signup
//   5. Cheap model + low tokens  (Haiku, 350 max)    — ~$0.003 per reply
//
// The daily counters are in-memory, so on a multi-instance deploy the real
// ceiling is (instances × cap). That's an acceptable backstop at this scale;
// move the counters to Redis/Supabase if the demo ever needs a hard global cap.
// ═══════════════════════════════════════════════════════════════════════════════

const MODEL = "claude-haiku-4-5-20251001";
const MAX_USER_TURNS = 6;
const MAX_TOKENS = 350;
const PER_IP_DAILY = 30;
const GLOBAL_DAILY = 5000;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const schema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_USER_TURNS * 2),
});

// ─── In-memory daily counters (reset when the day-key changes) ────────────────
let dayKey = "";
let globalCount = 0;
const perIpCount = new Map<string, number>();

function rollDay() {
  // Day key derived from the request clock; cheap and good enough for a backstop.
  const key = new Date().toISOString().slice(0, 10);
  if (key !== dayKey) {
    dayKey = key;
    globalCount = 0;
    perIpCount.clear();
  }
}

function getIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

const SYSTEM_PROMPT = `You are Nova, the AI tutor for Square 1 AI — an AI-powered platform that takes people from where they are now to a deployed portfolio and a tech job.

This is a free public demo, so the visitor is NOT logged in and you don't know their history yet.

Your job in this demo: show them what a great tutor feels like in 2-3 messages.
- Be warm, sharp, and genuinely helpful — answer their actual question well.
- If they share code with a bug, diagnose it and explain the fix clearly.
- Teach by guiding: give the insight and a concrete example, not just a one-word answer.
- Use markdown: short paragraphs, bullet points, fenced code blocks with language tags.
- Keep replies tight — under 180 words unless they explicitly ask for depth.
- Stay on topic: coding, debugging, CS concepts, AI/ML, careers in tech.
- If they go off-topic, gently steer back to what you can help them learn.

Don't oversell or mention pricing — just be so useful that they want more. The platform handles the signup prompt; you focus on being the best 3 minutes of tutoring they've had.`;

export async function POST(request: Request) {
  try {
    rollDay();
    const ip = getIp(request);

    // 1. Per-IP burst limit
    const burst = rateLimit(`nova-demo-burst:${ip}`, 10, 5 * 60 * 1000);
    if (!burst.success) return burst.response;

    // 2 + 3. Daily caps
    if (globalCount >= GLOBAL_DAILY) {
      return NextResponse.json(
        { error: "Nova's demo is taking a breather — sign up to keep going.", capped: "global" },
        { status: 429 },
      );
    }
    const ipToday = perIpCount.get(ip) ?? 0;
    if (ipToday >= PER_IP_DAILY) {
      return NextResponse.json(
        { error: "You've reached the demo limit for today. Sign up free to keep chatting with Nova.", capped: "ip" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { messages } = schema.parse(body);

    // 4. Conversation cap — once they've had a real taste, send them to signup
    const userTurns = messages.filter((m) => m.role === "user").length;
    if (userTurns > MAX_USER_TURNS) {
      return NextResponse.json(
        {
          reply: "This is where the free demo wraps up — but I'm just getting started. Take the free assessment and I'll tutor you on *your* actual code and your specific weak spots.",
          capped: "conversation",
        },
        { status: 200 },
      );
    }

    // Count this call against the daily ceilings before spending money on it
    globalCount++;
    perIpCount.set(ip, ipToday + 1);

    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply = response.content[0]?.type === "text" ? response.content[0].text : "";
    const remaining = Math.max(0, MAX_USER_TURNS - userTurns);
    return NextResponse.json({ reply, remaining });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[nova-demo]", err);
    return NextResponse.json(
      { error: "Nova hit a snag. Try again in a moment." },
      { status: 500 },
    );
  }
}
