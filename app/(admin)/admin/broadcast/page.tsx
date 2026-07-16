import { createAdminClient } from "@/lib/supabase/admin";
import { BroadcastComposer } from "./BroadcastComposer";

export const dynamic = "force-dynamic";

export default async function AdminBroadcastPage() {
  const admin = createAdminClient();
  const { count } = await admin.from("students").select("id", { count: "exact", head: true });
  const recipientCount = count ?? 0;

  return (
    <div className="min-h-full px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink tracking-tight">Broadcast</h1>
        <p className="text-sm text-ink-muted mt-1">
          Send a message to every student. It lands in each student&apos;s Messages inbox from the Square&nbsp;1 team.
        </p>
      </div>

      <BroadcastComposer recipientCount={recipientCount} />
    </div>
  );
}
