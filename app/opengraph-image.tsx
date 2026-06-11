import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Square 1 AI — AI-Powered Tech Education";
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

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #0056CE, #3B82F6)",
            marginBottom: 32,
            fontSize: 36,
            fontWeight: 800,
            color: "white",
          }}
        >
          S1
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            marginBottom: 12,
            display: "flex",
          }}
        >
          Square 1 AI
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: 40,
            display: "flex",
          }}
        >
          Learn it. Build it. Ship it.
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {["AI Assessment", "Personalised Plans", "Real Projects", "AI Tutor"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 24px",
                borderRadius: 100,
                background: "rgba(0, 86, 206, 0.2)",
                border: "1px solid rgba(0, 86, 206, 0.4)",
                color: "#93C5FD",
                fontSize: 16,
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
