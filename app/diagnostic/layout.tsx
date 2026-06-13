import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free 3-Minute Skill Check",
  description:
    "Find out where you stand in 3 minutes — no signup. Pick a track, answer 5 questions, and get an instant skill snapshot plus your path to the role.",
  openGraph: {
    title: "Free 3-Minute Skill Check — Square 1 AI",
    description:
      "Pick a track, answer 5 questions, get an instant skill snapshot. No signup required.",
  },
};

export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return children;
}
