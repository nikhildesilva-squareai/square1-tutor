import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founding Beta — 2 Weeks Free",
  description:
    "Join the Square 1 AI founding beta — 100 free spots, 2 weeks, no card. Pick a track and start learning with an AI tutor that grades your real code.",
  openGraph: {
    title: "Square 1 AI — Founding Beta (2 weeks free)",
    description: "100 free founding spots. No card. An AI tutor that grades your real code.",
  },
};

export default function BetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
