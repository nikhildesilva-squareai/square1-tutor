import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Square 1 AI is building the future of tech education — AI-powered assessment, personalised learning, and real-world projects.",
  openGraph: {
    title: "About — Square 1 AI",
    description: "AI-powered tech education. Personalised learning plans, real deployed projects, and AI tutoring.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
