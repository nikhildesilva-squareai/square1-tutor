import { Resend } from "resend";

// Initialize Resend — reads RESEND_API_KEY from env automatically
let resend: Resend | null = null;

export function getResend(): Resend {
  if (!resend) {
    const key = process.env["RESEND_API_KEY"];
    if (!key) throw new Error("RESEND_API_KEY not set");
    resend = new Resend(key);
  }
  return resend;
}

const FROM = "Square 1 AI <tech@square1ai.com>";

/* ─── Corporate lead notification (to the founder) ───────────────────────────
 * square1ai.com is verified in Resend (2026-07-06, Tokyo region), so leads send
 * from the real domain. Delivery destination comes from LEAD_NOTIFY_EMAIL —
 * keep that pointed at a monitored inbox (the @square1ai.com mailboxes can't
 * receive while Google Workspace is suspended). */
const LEAD_FROM = "Square 1 Leads <tech@square1ai.com>";
const LEAD_NOTIFY_TO = process.env["LEAD_NOTIFY_EMAIL"] ?? "nikhil.desilva@square1ai.com";

// Replies to outbound product email should reach a monitored inbox, not the
// suspended @square1ai.com mailboxes. Reuses LEAD_NOTIFY_EMAIL when set.
const REPLY_TO = process.env["LEAD_NOTIFY_EMAIL"];

export async function sendBusinessLeadNotification(lead: {
  name: string;
  company: string;
  email: string;
  teamSize?: string | null;
  message?: string | null;
}) {
  const r = getResend();
  return r.emails.send({
    from: LEAD_FROM,
    to: LEAD_NOTIFY_TO,
    replyTo: lead.email,
    subject: `🚀 New team lead: ${lead.company}${lead.teamSize ? ` (${lead.teamSize})` : ""}`,
    html: `
      <meta charset="utf-8">
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;">
        <h1 style="color:#0F172A;font-size:20px;font-weight:800;margin:0 0 4px;">New "For Teams" enquiry</h1>
        <p style="color:#64748B;font-size:13px;margin:0 0 20px;">Someone just requested team pricing on /business.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#94A3B8;width:110px;">Name</td><td style="padding:8px 0;color:#0F172A;font-weight:600;">${lead.name}</td></tr>
          <tr><td style="padding:8px 0;color:#94A3B8;">Company</td><td style="padding:8px 0;color:#0F172A;font-weight:600;">${lead.company}</td></tr>
          <tr><td style="padding:8px 0;color:#94A3B8;">Email</td><td style="padding:8px 0;"><a href="mailto:${lead.email}" style="color:#0056CE;">${lead.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#94A3B8;">Team size</td><td style="padding:8px 0;color:#0F172A;font-weight:600;">${lead.teamSize ?? "—"}</td></tr>
          ${lead.message ? `<tr><td style="padding:8px 0;color:#94A3B8;vertical-align:top;">Message</td><td style="padding:8px 0;color:#334155;">${lead.message}</td></tr>` : ""}
        </table>
        <p style="margin-top:20px;font-size:13px;color:#64748B;">Reply directly to this email to reach them.</p>
      </div>
    `,
  });
}

/* ─── Support message alert (student → team, to the founder's inbox) ─────────
 * Fires when a student writes in the in-app Messages thread. The founder reads
 * + replies from the in-app inbox (/inbox); this is the "you've got a message"
 * ping so nothing is missed. replyTo is the student so a Gmail reply also works
 * as a fallback. */
export async function sendSupportMessageAlert(opts: {
  studentName: string;
  studentEmail: string;
  body: string;
}) {
  const r = getResend();
  const safeBody = opts.body.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return r.emails.send({
    from: LEAD_FROM,
    to: LEAD_NOTIFY_TO,
    replyTo: opts.studentEmail,
    subject: `💬 New message from ${opts.studentName}`,
    html: `
      <meta charset="utf-8">
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;">
        <h1 style="color:#0F172A;font-size:20px;font-weight:800;margin:0 0 4px;">New message in your inbox</h1>
        <p style="color:#64748B;font-size:13px;margin:0 0 20px;">${opts.studentName} (${opts.studentEmail}) wrote to the team.</p>
        <blockquote style="margin:0 0 20px;padding:14px 18px;border-left:3px solid #0056CE;background:#F8FAFC;border-radius:0 10px 10px 0;color:#334155;font-size:14px;white-space:pre-wrap;">${safeBody}</blockquote>
        <a href="https://square1-tutor.vercel.app/inbox" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:11px 26px;border-radius:10px;">Reply in the inbox →</a>
        <p style="margin-top:18px;font-size:12px;color:#94A3B8;">Or just reply to this email to reach ${opts.studentName} directly.</p>
      </div>
    `,
  });
}

/* ─── Welcome Email ──────────────────────────────────────────────────────── */
export async function sendWelcomeEmail(to: string, name: string) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Square 1 AI",
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://square1-tutor.vercel.app/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">Welcome, ${name}!</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">Your journey to a tech career starts now.</p>
        </div>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h3 style="color:#0F172A;font-size:16px;font-weight:700;margin:0 0 12px;">What happens next?</h3>
          <div style="margin-bottom:12px;">
            <span style="display:inline-block;width:24px;height:24px;background:#0056CE;color:white;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:8px;">1</span>
            <span style="color:#334155;font-size:14px;">Pick a course from our 12 tech subjects</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="display:inline-block;width:24px;height:24px;background:#0056CE;color:white;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:8px;">2</span>
            <span style="color:#334155;font-size:14px;">Take the free AI-graded skill assessment</span>
          </div>
          <div>
            <span style="display:inline-block;width:24px;height:24px;background:#0056CE;color:white;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:8px;">3</span>
            <span style="color:#334155;font-size:14px;">Get your personalised learning plan</span>
          </div>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="https://square1-tutor.vercel.app/dashboard" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Go to Dashboard
          </a>
        </div>

        <p style="color:#94A3B8;font-size:12px;text-align:center;">
          Square 1 AI · tech@square1ai.com
        </p>
      </div>
    `,
  });
}

/* ─── Streak Reminder ────────────────────────────────────────────────────── */
export async function sendStreakReminder(to: string, name: string, streakDays: number, lessonTitle: string) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    subject: streakDays > 0 ? `Keep your ${streakDays}-day streak alive!` : "Time to learn something new",
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://square1-tutor.vercel.app/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">
            ${streakDays > 0 ? `${streakDays}-day streak!` : "Hey " + name + "!"}
          </h1>
          <p style="color:#64748B;font-size:14px;margin:0;">
            ${streakDays > 0 ? "Don't break it — one lesson keeps it going." : "Your next lesson is waiting for you."}
          </p>
        </div>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin:0 0 8px;">Next up</p>
          <p style="color:#0F172A;font-size:16px;font-weight:700;margin:0;">${lessonTitle}</p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="https://square1-tutor.vercel.app/dashboard" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Continue Learning
          </a>
        </div>

        <p style="color:#94A3B8;font-size:11px;text-align:center;">
          <a href="https://square1-tutor.vercel.app/settings" style="color:#94A3B8;">Unsubscribe</a> · Square 1 AI
        </p>
      </div>
    `,
  });
}

/* ─── Assessment Nudge — signed up but never took the assessment ─────────── */
export async function sendAssessmentNudge(to: string, name: string) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    subject: "Your free skill report is waiting",
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://square1-tutor.vercel.app/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">Hey ${name} — one step left</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">You created your account but haven't taken the free assessment yet.</p>
        </div>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h3 style="color:#0F172A;font-size:16px;font-weight:700;margin:0 0 8px;">30 minutes. Here's what you get:</h3>
          <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;">
            A topic-by-topic skill report graded by AI — your strengths, your gaps,
            and exactly what stands between you and the role you want. Free, no card needed.
          </p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="https://square1-tutor.vercel.app/courses" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Take the free assessment
          </a>
        </div>

        <p style="color:#94A3B8;font-size:11px;text-align:center;">
          <a href="https://square1-tutor.vercel.app/settings" style="color:#94A3B8;">Unsubscribe</a> · Square 1 AI
        </p>
      </div>
    `,
  });
}

/* ─── Activation nudge — signed up, but hasn't started a single lesson ────────
 * The highest-leverage lifecycle email: most signups stall before their first
 * lesson. Points straight at "start learning" (no assessment gate) to match the
 * dashboard's lesson-first CTA. */
export async function sendActivationNudge(to: string, name: string) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    subject: `${name}, your first lesson takes 5 minutes`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://square1-tutor.vercel.app/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">Ready when you are, ${name} 👋</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">You created your account — now the good part. Your first lesson is waiting.</p>
        </div>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h3 style="color:#0F172A;font-size:16px;font-weight:700;margin:0 0 8px;">5 minutes. No test. No setup.</h3>
          <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;">
            Jump straight into a real, interactive lesson — you read a bit, then write
            and run code right there in the page. It's the fastest way to feel what
            learning here is actually like. No credit card, no assessment first.
          </p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="https://square1-tutor.vercel.app/dashboard" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Start your first lesson →
          </a>
        </div>

        <p style="color:#94A3B8;font-size:11px;text-align:center;">
          <a href="https://square1-tutor.vercel.app/settings" style="color:#94A3B8;">Unsubscribe</a> · Square 1 AI
        </p>
      </div>
    `,
  });
}

/* ─── Weekly Progress Digest ─────────────────────────────────────────────── */
export async function sendWeeklyDigest(to: string, name: string, stats: {
  lessonsCompleted: number;
  streak: number;
  projectsDone: number;
  overallPct: number;
}) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    subject: `Your weekly progress: ${stats.lessonsCompleted} lessons this week`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://square1-tutor.vercel.app/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">Weekly Progress</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">Here's how you did this week, ${name}.</p>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:24px;">
          <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;text-align:center;">
            <p style="color:#0F172A;font-size:24px;font-weight:900;margin:0;">${stats.lessonsCompleted}</p>
            <p style="color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0;">Lessons</p>
          </div>
          <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;text-align:center;">
            <p style="color:#0F172A;font-size:24px;font-weight:900;margin:0;">${stats.streak}</p>
            <p style="color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0;">Day Streak</p>
          </div>
          <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;text-align:center;">
            <p style="color:#0056CE;font-size:24px;font-weight:900;margin:0;">${stats.overallPct}%</p>
            <p style="color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0;">Complete</p>
          </div>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="https://square1-tutor.vercel.app/progress" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            View Full Progress
          </a>
        </div>

        <p style="color:#94A3B8;font-size:11px;text-align:center;">
          <a href="https://square1-tutor.vercel.app/settings" style="color:#94A3B8;">Unsubscribe</a> · Square 1 AI
        </p>
      </div>
    `,
  });
}

/* ─── Team invite (B2B) — a manager adds a worker to their team ──────────── */
export async function sendTeamInvite(to: string, teamName: string, inviteUrl: string) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    subject: `${teamName} invited you to upskill on Square 1 AI`,
    html: `
      <meta charset="utf-8">
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://square1-tutor.vercel.app/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">${teamName} added you to their team</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">You've got a free seat on Square 1 AI — an AI tutor that grades your real code.</p>
        </div>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;">
            Pick your track, take a quick skill check, then start building real, deployable projects —
            with an AI tutor reviewing every line. Your work is yours to keep; your manager just sees your progress.
          </p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="${inviteUrl}" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Claim your seat
          </a>
        </div>

        <p style="color:#94A3B8;font-size:12px;text-align:center;">Square 1 AI · tech@square1ai.com</p>
      </div>
    `,
  });
}

/* ─── Seat-activation nudge (to the manager) — seats bought but sitting idle ── */
export async function sendSeatActivationNudge(to: string, teamName: string, activated: number, total: number, inviteUrl: string) {
  const r = getResend();
  const left = Math.max(0, total - activated);
  return r.emails.send({
    from: FROM,
    to,
    subject: `${activated}/${total} seats active on ${teamName} — ${left} still to go`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://square1-tutor.vercel.app/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">${left} of your seats are still empty</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">${activated} of ${total} people on ${teamName} have started. Get the rest going in a click.</p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="${inviteUrl}" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Invite the rest of your team
          </a>
        </div>

        <p style="color:#94A3B8;font-size:12px;text-align:center;">Square 1 AI · tech@square1ai.com</p>
      </div>
    `,
  });
}

/* ─── Invite reminder — one nudge for a seat still unclaimed after 3 days ──── */
export async function sendInviteReminder(to: string, teamName: string, inviteUrl: string) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    subject: `Your ${teamName} seat on Square 1 AI is still waiting`,
    html: `
      <meta charset="utf-8">
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://square1-tutor.vercel.app/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">Your seat is still open</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">${teamName} reserved you a spot on Square 1 AI a few days ago — it takes about a minute to claim.</p>
        </div>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;">
            Pick a track, and start building real projects with an AI tutor reviewing every line
            of your code. Your work stays yours — your manager just sees your progress.
          </p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="${inviteUrl}" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Claim your seat
          </a>
        </div>

        <p style="color:#94A3B8;font-size:12px;text-align:center;">Square 1 AI · tech@square1ai.com</p>
      </div>
    `,
  });
}

/* ─── Member-joined alert (to the manager) — fires on first join ────────────── */
export async function sendMemberJoinedAlert(to: string, memberLabel: string, teamName: string, trackTitle: string) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    subject: `${memberLabel} joined ${teamName} — starting ${trackTitle}`,
    html: `
      <meta charset="utf-8">
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;">
        <h1 style="color:#0F172A;font-size:20px;font-weight:800;margin:0 0 4px;">A seat just got claimed</h1>
        <p style="color:#64748B;font-size:13px;margin:0 0 20px;">Progress starts showing on your dashboard as soon as they finish their first lesson.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#94A3B8;width:110px;">Member</td><td style="padding:8px 0;color:#0F172A;font-weight:600;">${memberLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#94A3B8;">Team</td><td style="padding:8px 0;color:#0F172A;font-weight:600;">${teamName}</td></tr>
          <tr><td style="padding:8px 0;color:#94A3B8;">Track</td><td style="padding:8px 0;color:#0F172A;font-weight:600;">${trackTitle}</td></tr>
        </table>
        <div style="margin-top:24px;">
          <a href="https://square1-tutor.vercel.app/business/dashboard" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:13px;text-decoration:none;padding:10px 24px;border-radius:10px;">
            Open manager portal
          </a>
        </div>
      </div>
    `,
  });
}

/* ─── Weekly manager digest (Mondays) — the team's week at a glance ─────────── */
export async function sendManagerDigest(
  to: string,
  teamName: string,
  stats: {
    seatsUsed: number;
    seats: number;
    pendingCount: number;
    activeThisWeek: number;
    avgCompletion: number;
    completedCount: number;
    deployedCount: number;
    teamReadiness: number | null;
    topWeak: { topic: string; count: number }[];
  },
  inviteUrl: string,
) {
  const r = getResend();
  const stat = (value: string, label: string) => `
    <td style="width:33%;padding:12px 8px;text-align:center;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">
      <div style="color:#0F172A;font-size:22px;font-weight:800;">${value}</div>
      <div style="color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">${label}</div>
    </td>`;
  const gaps = stats.topWeak.slice(0, 3).map((w) => w.topic).join(" · ");
  return r.emails.send({
    from: FROM,
    to,
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    subject: `${teamName}: your team's week on Square 1 AI`,
    html: `
      <meta charset="utf-8">
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;">
        <h1 style="color:#0F172A;font-size:20px;font-weight:800;margin:0 0 4px;">${teamName} — weekly summary</h1>
        <p style="color:#64748B;font-size:13px;margin:0 0 20px;">How your team tracked this week.</p>

        <table style="width:100%;border-collapse:separate;border-spacing:6px 0;margin-bottom:6px;"><tr>
          ${stat(`${stats.seatsUsed}/${stats.seats}`, "Seats used")}
          ${stat(String(stats.activeThisWeek), "Active this week")}
          ${stat(`${stats.avgCompletion}%`, "Avg completion")}
        </tr></table>
        <table style="width:100%;border-collapse:separate;border-spacing:6px 0;margin-bottom:20px;"><tr>
          ${stat(String(stats.completedCount), "Tracks completed")}
          ${stat(String(stats.deployedCount), "Projects deployed")}
          ${stat(stats.teamReadiness != null ? `${stats.teamReadiness}%` : "—", "Team readiness")}
        </tr></table>

        ${gaps ? `<p style="color:#334155;font-size:13px;margin:0 0 16px;"><strong style="color:#0F172A;">Biggest skill gaps:</strong> ${gaps}</p>` : ""}
        ${stats.pendingCount > 0 ? `<p style="color:#B45309;font-size:13px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:10px 12px;margin:0 0 16px;">${stats.pendingCount} invite${stats.pendingCount === 1 ? " is" : "s are"} still unclaimed — <a href="${inviteUrl}" style="color:#B45309;font-weight:700;">re-share the join link</a>.</p>` : ""}

        <div style="margin-top:8px;">
          <a href="https://square1-tutor.vercel.app/business/dashboard" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:13px;text-decoration:none;padding:10px 24px;border-radius:10px;">
            Open manager portal
          </a>
        </div>
        <p style="color:#94A3B8;font-size:12px;margin-top:24px;">Square 1 AI · sent every Monday · tech@square1ai.com</p>
      </div>
    `,
  });
}
