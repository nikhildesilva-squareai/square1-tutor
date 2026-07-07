import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";
import { InboxClient } from "./InboxClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support inbox · Square 1 AI" };

// Team-only support inbox. Unlike the /admin panel (local-only), this IS
// available in production so the founder can answer students from anywhere —
// gated strictly by the ADMIN_EMAILS allow-list.
export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  return <InboxClient />;
}
