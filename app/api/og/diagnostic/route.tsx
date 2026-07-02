import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const SUBJECT_ICONS: Record<string, string> = {
  "generative-ai": "\u{1F916}",
  "machine-learning": "\u{1F9E0}",
  "fullstack-development": "\u{1F680}",
  "cybersecurity": "\u{1F510}",
  "data-science": "\u{1F4CA}",
  "artificial-intelligence": "⚡",
  "computer-vision": "\u{1F441}️",
  "llm-agent-architect": "\u{1F6E0}️",
  "ai-product-management": "\u{1F4CB}",
};

const SUBJECT_TITLES: Record<string, string> = {
  "generative-ai": "Generative AI",
  "machine-learning": "Machine Learning",
  "fullstack-development": "Full Stack Dev",
  "cybersecurity": "Cybersecurity",
  "data-science": "Data Science",
  "artificial-intelligence": "Artificial Intelligence",
  "computer-vision": "Computer Vision",
  "llm-agent-architect": "LLM Agent Architect",
  "ai-product-management": "AI Product Management",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const subject = searchParams.get("subject");
  const score = Number(searchParams.get("score") ?? "0");
  const total = Number(searchParams.get("total") ?? "5");
  const level = searchParams.get("level") ?? "Beginner";

  if (!subject || !SUBJECT_TITLES[subject]) {
    return new Response("Missing or invalid subject", { status: 400 });
  }

  const title = SUBJECT_TITLES[subject];
  const icon = SUBJECT_ICONS[subject] ?? "";
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const levelColor =
    level === "Advanced" ? "#19A65F" : level === "Intermediate" ? "#E5B217" : "#D93636";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 50%, #F4F8FF 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: "#0056CE",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            S1
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#1E293B" }}>Square 1 AI</span>
        </div>

        {/* Subject */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 40 }}>{icon}</span>
          <span style={{ fontSize: 36, fontWeight: 800, color: "#1E293B" }}>{title}</span>
        </div>

        {/* Score */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 96, fontWeight: 900, color: "#0056CE", lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 40, fontWeight: 700, color: "#94A3B8" }}>/{total}</span>
        </div>

        {/* Level badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 28px",
            borderRadius: 999,
            background: levelColor,
            color: "white",
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 32,
          }}
        >
          {level} Level
        </div>

        {/* CTA */}
        <span style={{ fontSize: 18, color: "#64748B", fontWeight: 600 }}>
          Take yours free at square1ai.com/diagnostic/{subject}
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
