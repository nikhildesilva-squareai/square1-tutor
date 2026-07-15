import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeCountryForm } from "@/components/WelcomeCountryForm";

// Required country step, reached from the (app) layout gate. Lives OUTSIDE the
// (app) route group so the gate can't redirect-loop on it. If the student already
// has a country, there's nothing to collect — send them on.
export default async function WelcomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("students")
    .select("country")
    .eq("user_id", user.id)
    .maybeSingle();

  if (student?.country) redirect("/dashboard");

  return <WelcomeCountryForm />;
}
