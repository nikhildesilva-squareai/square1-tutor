import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Square 1 AI — the AI tutor that gets you hired. Build 10+ deployed projects. First 100 students free.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #050B14 0%, #0A1628 50%, #0F1F3A 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(0, 86, 206, 0.15)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -40,
            left: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(0, 86, 206, 0.1)",
            display: "flex",
          }}
        />

        {/* Logo mark — geometry from the official lockup */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #4482E5, #075BCC)",
            marginBottom: 32,
          }}
        >
          <svg width="46" height="46" viewBox="0 0 75 75">
            <g fill="#FFFFFF">
              <rect x="0" y="0" width="75" height="8" />
              <rect x="0" y="0" width="8" height="75" />
              <rect x="67" y="0" width="8" height="24" />
              <rect x="0" y="67" width="45" height="8" />
            </g>
          </svg>
        </div>

        {/* Headline — the launch pitch, not the brand slogan */}
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            color: "white",
            marginBottom: 16,
            display: "flex",
            textAlign: "center",
            letterSpacing: "-1px",
            maxWidth: 940,
          }}
        >
          The AI tutor that gets you hired.
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.72)",
            marginBottom: 40,
            display: "flex",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Build 10+ deployed projects — every line of your code reviewed by AI.
        </div>

        {/* Launch badge + proof pills */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            style={{
              padding: "12px 28px",
              borderRadius: 100,
              background: "rgba(52, 211, 153, 0.16)",
              border: "2px solid rgba(52, 211, 153, 0.5)",
              color: "#34D399",
              fontSize: 20,
              fontWeight: 800,
              display: "flex",
            }}
          >
            First 100 students free
          </div>
          {["10 subjects", "AI code review", "Verified portfolio"].map((label) => (
            <div
              key={label}
              style={{
                padding: "12px 24px",
                borderRadius: 100,
                background: "rgba(0, 86, 206, 0.2)",
                border: "1px solid rgba(0, 86, 206, 0.4)",
                color: "#93C5FD",
                fontSize: 18,
                fontWeight: 600,
                display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.4)",
            display: "flex",
          }}
        >
          square1-tutor.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
