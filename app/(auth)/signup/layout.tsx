import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Square 1 AI account. Get assessed, get a personalised learning plan, and start building.",
  openGraph: {
    title: "Sign Up — Square 1 AI",
    description: "Create your account and start your AI-powered tech education journey.",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
