// ═══════════════════════════════════════════════════════════════════════════════
// The test auth rig: a REAL Supabase session for a test user, as browser cookies.
//
// WHY THIS SHAPE, AND WHAT WAS REJECTED
//
// Sign-in in this app is email OTP or Google (app/(auth)/login/page.tsx). Neither
// can be driven by a test:
//   • Google needs a real Google account and a consent screen.
//   • Email OTP needs the mailbox. The admin API CAN mint the six-digit code
//     (generateLink returns `email_otp`), but reaching the field where it is
//     typed means first clicking "send code", which fires Supabase's built-in
//     mailer at a domain that does not exist and burns the project's shared
//     hourly email quota. A test suite that consumes a production rate limit is
//     a test suite that fails on the fourth run.
//
// So the rig authenticates OUT OF BAND and hands the browser the result:
//
//   1. auth.admin.createUser  — a real auth.users row, email pre-confirmed.
//   2. auth.admin.generateLink({ type: "magiclink" }) — a real, single-use OTP.
//      Nothing is emailed: generateLink only mints.
//   3. createServerClient(...).auth.verifyOtp({ token_hash }) — the SAME
//      @supabase/ssr client the app itself uses, given a Map for a cookie jar.
//      Supabase validates the token and issues a real JWT + refresh token, and
//      @supabase/ssr writes them into the jar in its own wire format (the
//      `base64-` prefix, the `sb-<ref>-auth-token` name, the chunking rules).
//   4. Those cookies go into the Playwright context.
//
// The important property: step 3 is the library, not an imitation of it. The
// cookie the browser carries is byte-for-byte what the app's own browser client
// would have written, and proxy.ts / lib/supabase/server.ts read it through
// their own createServerClient and validate the JWT against Supabase on every
// request. Nothing here weakens or bypasses the app's auth — it only skips the
// mail round-trip, which is the one part of the path a machine cannot do.
//
// What the rig does NOT get for free is the side effect of app/api/auth/callback
// (the `students` upsert). seedBootcampFixture() creates that row explicitly, so
// the state the tests run against is the state a real sign-in would have left.
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { required } from "./env";

export interface SessionCookie {
  name: string;
  value: string;
}

/** Service-role client. Only ever used by the rig, never by the app under test. */
export function adminClient(): SupabaseClient {
  return createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Create (or reuse) a test auth user and return its id.
 *
 * `email_confirm: true` matches what an OTP sign-in produces — an unconfirmed
 * user cannot verify an OTP at all.
 */
export async function ensureAuthUser(email: string): Promise<string> {
  const admin = adminClient();
  const existing = await findAuthUserByEmail(admin, email);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { e2e: true },
  });
  if (error || !data.user) throw new Error(`createUser(${email}) failed: ${error?.message}`);
  return data.user.id;
}

export async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  // listUsers is the only lookup-by-email the admin API offers. The project has
  // a few dozen users, so one page is plenty; the loop is there so it stays
  // correct if that stops being true.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

/**
 * Mint a real signed-in session for `email` and return it as browser cookies.
 *
 * The user must already exist (ensureAuthUser).
 */
export async function mintSessionCookies(email: string): Promise<SessionCookie[]> {
  const admin = adminClient();

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkErr || !link?.properties?.hashed_token) {
    throw new Error(`generateLink(${email}) failed: ${linkErr?.message}`);
  }

  const jar = new Map<string, string>();
  const client = createServerClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
        setAll: (toSet) => {
          for (const { name, value } of toSet) jar.set(name, value);
        },
      },
    },
  );

  const { data, error } = await client.auth.verifyOtp({
    type: "email",
    token_hash: link.properties.hashed_token,
  });
  if (error || !data.session) {
    throw new Error(`verifyOtp(${email}) failed: ${error?.message}`);
  }
  if (jar.size === 0) {
    throw new Error(
      `verifyOtp(${email}) produced no cookies — @supabase/ssr changed its storage contract`,
    );
  }

  return [...jar.entries()].map(([name, value]) => ({ name, value }));
}
