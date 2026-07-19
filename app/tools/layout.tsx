import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tools for Your Work — Curated by Role",
  description:
    "A hand-picked directory of AI tools for real jobs — marketing, sales, finance, HR, ops. For each: what it does, when to use it, and when not to. Free, no signup.",
  openGraph: {
    title: "AI Tools for Your Work — Square 1 AI",
    description:
      "Curated AI tools by role, with honest guidance on when to use each — and when not to. No affiliate links.",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
