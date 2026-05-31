import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: student } = await supabase
    .from("students")
    .select("id, name, email, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const joinedDate = student?.created_at
    ? new Date(student.created_at).toLocaleDateString("en-AU", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-ink-muted mt-1 text-sm">Manage your account preferences.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center text-xl font-bold text-white">
              {(student?.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                {student?.name ?? "Not set"}
              </p>
              <p className="text-xs text-ink-muted">{user.email}</p>
              <p className="text-xs text-ink-muted mt-0.5">Member since {joinedDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
                Display name
              </label>
              <input
                type="text"
                defaultValue={student?.name ?? ""}
                disabled
                placeholder="Coming soon — name editing"
                className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-border bg-surface-alt text-ink-muted text-sm"
              />
              <p className="text-xs text-ink-muted mt-1">Name editing coming soon.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={user.email ?? ""}
                disabled
                className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-border bg-surface-alt text-ink-muted text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">Notification preferences coming soon.</p>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-error/20">
        <CardHeader>
          <CardTitle className="text-error">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted mb-4">
            To delete your account or export your data, please contact{" "}
            <a href="mailto:support@square1.ai" className="text-brand hover:underline">
              support@square1.ai
            </a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
