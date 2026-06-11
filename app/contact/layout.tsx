import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Square 1 AI team. Questions about courses, partnerships, or support.",
  openGraph: {
    title: "Contact — Square 1 AI",
    description: "Get in touch with the Square 1 AI team for courses, partnerships, or support.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
