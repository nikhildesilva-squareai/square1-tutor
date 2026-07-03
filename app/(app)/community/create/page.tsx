import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CommunityCreationClient } from "@/components/CommunityCreationClient";

export const metadata = {
  title: "Create Community · Square 1 AI",
  description: "Create a new community on Square 1 AI",
};

export default async function CreateCommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <CommunityCreationClient />;
}
