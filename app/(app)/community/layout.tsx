import { redirect } from "next/navigation";
import { COMMUNITY_ENABLED } from "@/lib/flags";

// Community is hidden for the initial launch. This guard makes every /community
// route (discover, feed, create, [slug], manage) redirect away while disabled,
// so a stray link or typed URL can't reach the half-shown section. Flip
// COMMUNITY_ENABLED in lib/flags.ts to bring it back.
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  if (!COMMUNITY_ENABLED) redirect("/dashboard");
  return <>{children}</>;
}
