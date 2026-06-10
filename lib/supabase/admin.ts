import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client with SERVICE ROLE key — bypasses RLS.
 * ONLY use in server-side admin code behind auth + admin email check.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY env var.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY — add it to .env.local from your Supabase Dashboard > Settings > API"
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Check if an email is in the admin allow list.
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  // Fallback: if no ADMIN_EMAILS is set, deny all
  if (adminEmails.length === 0) return false;
  return adminEmails.includes(email.toLowerCase());
}
