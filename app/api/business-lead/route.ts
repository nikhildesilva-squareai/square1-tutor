import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1).max(120),
  company: z.string().min(1).max(160),
  email: z.string().email().max(160),
  teamSize: z.string().max(40).optional(),
  message: z.string().max(2000).optional(),
});

function getIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * POST /api/business-lead — public corporate lead capture.
 * Stores to business_leads via the service-role client (no anon DB access).
 * Rate-limited per IP to deter spam.
 */
export async function POST(request: Request) {
  try {
    const burst = rateLimit(`business-lead:${getIp(request)}`, 5, 10 * 60 * 1000);
    if (!burst.success) return burst.response;

    const body = schema.parse(await request.json());

    let supabase;
    try {
      supabase = createAdminClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }

    const { error } = await supabase.from("business_leads").insert({
      name: body.name,
      company: body.company,
      email: body.email.toLowerCase(),
      team_size: body.teamSize ?? null,
      message: body.message ?? null,
    });

    if (error) {
      console.error("[business-lead]", error);
      return NextResponse.json({ error: "Could not submit — please try again" }, { status: 500 });
    }

    // Notify the founder (non-blocking — never fail the form if email is down)
    try {
      const { sendBusinessLeadNotification } = await import("@/lib/email/resend");
      await sendBusinessLeadNotification({
        name: body.name,
        company: body.company,
        email: body.email,
        teamSize: body.teamSize,
        message: body.message,
      });
    } catch (e) {
      console.warn("[business-lead] notification email failed (RESEND_API_KEY / domain?)", e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Please fill in the required fields" }, { status: 400 });
    }
    console.error("[business-lead]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
