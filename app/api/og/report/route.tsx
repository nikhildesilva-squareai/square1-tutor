import { ImageResponse } from "next/og";
import { getSharedReport } from "@/lib/report-share";

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/og/report?token=…&format=wide|square|portrait
//
// Share cards for a PUBLIC skill report (token required — private reports have
// no token, so nothing leaks). Three sizes:
//   wide      1200×630  — link unfurls (LinkedIn/X/FB/WhatsApp previews)
//   square    1080×1080 — feed posts
//   portrait  1080×1350 — Instagram/TikTok post card (also the share-sheet file)
// ═══════════════════════════════════════════════════════════════════════════════

const SIZES = {
  wide: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
} as const;

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#F87171",
  intermediate: "#FBBF24",
  advanced: "#34D399",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const format = (url.searchParams.get("format") ?? "wide") as keyof typeof SIZES;
  const size = SIZES[format] ?? SIZES.wide;

  const shared = await getSharedReport(token);
  if (!shared) return new Response("Not found", { status: 404 });

  const { report, courseTitle, firstName } = shared;
  const levelColor = LEVEL_COLORS[report.level] ?? "#3388FF";
  const domains = (report.domainMastery ?? []).slice(0, 4);
  const big = format !== "wide";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: big ? "72px 64px" : "56px 64px",
          background: "linear-gradient(135deg, #00183A 0%, #01224F 55%, #0056CE 140%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header: wordmark + course */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #3388FF, #0056CE)", color: "#FFF", fontSize: 22, fontWeight: 800 }}>
              S1
            </div>
            <div style={{ display: "flex", color: "#FFF", fontSize: 26, fontWeight: 800 }}>Square 1 AI</div>
          </div>
          <div style={{ display: "flex", color: "#7EA6D8", fontSize: 22, fontWeight: 600 }}>Verified Skill Report</div>
        </div>

        {/* Middle: name, score, level */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: big ? 20 : 12 }}>
          <div style={{ display: "flex", color: "#B5D4F4", fontSize: big ? 34 : 28, fontWeight: 600 }}>
            {firstName} · {courseTitle}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ display: "flex", color: "#FFF", fontSize: big ? 200 : 150, fontWeight: 800, letterSpacing: "-6px", lineHeight: 1 }}>
              {report.percentage}
            </div>
            <div style={{ display: "flex", color: "#7EA6D8", fontSize: big ? 64 : 48, fontWeight: 700 }}>%</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 32px", borderRadius: 999, background: `${levelColor}22`, border: `2px solid ${levelColor}77` }}>
            <div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, background: levelColor }} />
            <div style={{ display: "flex", color: levelColor, fontSize: big ? 30 : 24, fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px" }}>
              {report.level}
            </div>
          </div>
          {report.roleReadiness && (
            <div style={{ display: "flex", color: "#B5D4F4", fontSize: big ? 26 : 20 }}>{report.roleReadiness}</div>
          )}
        </div>

        {/* Domain bars */}
        {domains.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: big ? 16 : 10 }}>
            {domains.map((d) => (
              <div key={d.domain} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", width: big ? 300 : 260, color: "#B5D4F4", fontSize: big ? 24 : 19, fontWeight: 600 }}>
                  {d.domain}
                </div>
                <div style={{ display: "flex", flex: 1, height: big ? 16 : 12, borderRadius: 999, background: "rgba(255,255,255,0.12)" }}>
                  <div style={{ display: "flex", width: `${Math.max(d.percentage, 4)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #3388FF, #7EB3FF)" }} />
                </div>
                <div style={{ display: "flex", width: 70, color: "#FFF", fontSize: big ? 24 : 19, fontWeight: 800, justifyContent: "flex-end" }}>
                  {d.percentage}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}

        {/* Footer CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", color: "#7EA6D8", fontSize: big ? 24 : 20, fontWeight: 600 }}>
            Take your free skill check → square1-tutor.vercel.app
          </div>
          <div style={{ display: "flex", padding: "10px 22px", borderRadius: 999, background: "rgba(52,211,153,0.14)", border: "2px solid rgba(52,211,153,0.45)", color: "#34D399", fontSize: big ? 22 : 18, fontWeight: 700 }}>
            AI-graded
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
