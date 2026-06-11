import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to Square 1 AI to continue your personalised learning journey.",
  openGraph: {
    title: "Log In — Square 1 AI",
    description: "Log in to continue your AI-powered learning journey.",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
