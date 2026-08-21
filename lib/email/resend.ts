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
        <a href="https://www.square1ai.com/inbox" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:11px 26px;border-radius:10px;">Reply in the inbox →</a>
        <p style="margin-top:18px;font-size:12px;color:#94A3B8;">Or just reply to this email to reach ${opts.studentName} directly.</p>
      </div>
    `,
  });
}

/* ─── Welcome Email ──────────────────────────────────────────────────────── */
/**
 * Day-0 welcome. When the signup came from a diagnostic track we know their
 * course, so the CTA deep-links straight into Lesson 1 (the activation moment)
 * instead of a generic dashboard. Falls back to the dashboard CTA otherwise.
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  opts?: { courseTitle?: string; lessonUrl?: string },
) {
  const r = getResend();
  const lessonMode = Boolean(opts?.lessonUrl);
  const ctaHref = opts?.lessonUrl ?? "https://www.square1ai.com/dashboard";
  const ctaLabel = lessonMode ? "Start your first lesson (5 min) →" : "Go to Dashboard";
  const steps = lessonMode
    ? [
        `Start your first ${opts?.courseTitle ?? ""} lesson — it takes about 5 minutes`.replace(/\s+/g, " "),
        "Every lesson ends with quick checks, so you know it stuck",
        "Nova, your AI tutor, is one click away whenever you're stuck",
      ]
    : [
        "Pick a course from our tech subjects",
        "Take the free AI-graded skill assessment",
        "Get your personalised learning plan",
      ];
  return r.emails.send({
    from: FROM,
    to,
    subject: lessonMode
      ? `${name}, your first lesson is ready (takes ~5 min)`
      : "Welcome to Square 1 AI",
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">Welcome, ${name}!</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">${lessonMode ? `Your ${opts?.courseTitle ?? "course"} journey starts with one short lesson.` : "Your journey to a tech career starts now."}</p>
        </div>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h3 style="color:#0F172A;font-size:16px;font-weight:700;margin:0 0 12px;">What happens next?</h3>
          ${steps
            .map(
              (s, i) => `
          <div style="${i < steps.length - 1 ? "margin-bottom:12px;" : ""}">
            <span style="display:inline-block;width:24px;height:24px;background:#0056CE;color:white;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:8px;">${i + 1}</span>
            <span style="color:#334155;font-size:14px;">${s}</span>
          </div>`,
            )
            .join("")}
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="${ctaHref}" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            ${ctaLabel}
          </a>
        </div>

        <p style="color:#94A3B8;font-size:12px;text-align:center;">
          Square 1 AI · tech@square1ai.com
        </p>
      </div>
    `,
  });
}

/* ─── Diagnostic report (lead capture — no account required) ─────────────── */
/**
 * Sends a visitor their skill-check report link from the results page. The
 * results are fully URL-encoded, so the link reproduces the exact report.
 * This is the re-entry point for people not ready to sign up on the spot.
 */
export async function sendDiagnosticReport(
  to: string,
  opts: {
    subjectTitle: string;
    score: number;
    total: number;
    band: string;
    weakTopics: string[];
    resultsUrl: string;
    lessonUrl: string;
  },
) {
  const r = getResend();
  const gaps = opts.weakTopics.length
    ? `<p style="color:#334155;font-size:14px;margin:0 0 4px;"><strong>Where to focus first:</strong> ${opts.weakTopics.join(" · ")}</p>`
    : "";
  return r.emails.send({
    from: FROM,
    to,
    subject: `Your ${opts.subjectTitle} skill report — ${opts.band} (${opts.score}/${opts.total})`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:28px;">
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:22px;font-weight:800;margin:0 0 6px;">Your ${opts.subjectTitle} skill snapshot</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">You scored <strong style="color:#0F172A;">${opts.score}/${opts.total}</strong> — ${opts.band}.</p>
        </div>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:24px;">
          ${gaps}
          <p style="color:#64748B;font-size:13px;margin:${opts.weakTopics.length ? "10px" : "0"} 0 0;">Your full report — topic-by-topic breakdown, strengths, and your course path — is one click away.</p>
        </div>
        <div style="text-align:center;margin-bottom:14px;">
          <a href="${opts.resultsUrl}" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Open my full report →
          </a>
        </div>
        <p style="text-align:center;margin:0 0 28px;">
          <a href="${opts.lessonUrl}" style="color:#0056CE;font-size:13px;font-weight:600;text-decoration:none;">…or start Lesson 1 free — no signup, ~5 minutes</a>
        </p>
        <p style="color:#94A3B8;font-size:12px;text-align:center;">
          Square 1 AI · tech@square1ai.com · You requested this report on square1ai.com.
        </p>
      </div>
    `,
  });
}

/* ─── Lead follow-up (day-1, one-and-done) ───────────────────────────────── */
/**
 * The single follow-up to a results-page lead who never signed up: their
 * report link + the 5-minute free lesson. Deliberately one email only — the
 * footer says so, and diagnostic_leads.followup_sent_at makes re-sends
 * impossible. Not a drip sequence.
 */
export async function sendLeadFollowup(
  to: string,
  opts: { subjectTitle: string; resultsUrl: string; lessonUrl: string },
) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    subject: `Your ${opts.subjectTitle} report is still here — and Lesson 1 takes ~5 minutes`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <h1 style="color:#0F172A;font-size:20px;font-weight:800;margin:0 0 8px;">Still thinking it over?</h1>
        <p style="color:#64748B;font-size:14px;margin:0 0 20px;">
          Yesterday you checked your ${opts.subjectTitle} skills. Your report hasn't gone anywhere —
          and the fastest way to close the gaps it found is the first lesson, which is free,
          needs no account, and takes about 5 minutes.
        </p>
        <div style="text-align:center;margin-bottom:14px;">
          <a href="${opts.lessonUrl}" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Start Lesson 1 free →
          </a>
        </div>
        <p style="text-align:center;margin:0 0 28px;">
          <a href="${opts.resultsUrl}" style="color:#0056CE;font-size:13px;font-weight:600;text-decoration:none;">Re-open my skill report</a>
        </p>
        <p style="color:#94A3B8;font-size:12px;text-align:center;">
          Square 1 AI · tech@square1ai.com<br/>
          You asked for your report on square1ai.com. This is the only follow-up we'll send.
        </p>
      </div>
    `,
  });
}

/* ─── Lesson link bridge (phone → computer) ──────────────────────────────── */
/** One-tap "email me this lesson" from the mobile lesson player, so code
 *  exercises can be finished on a computer without losing the place. */
export async function sendLessonLink(
  to: string,
  opts: { lessonTitle: string; courseTitle: string; url: string },
) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    subject: `Pick up where you left off: ${opts.lessonTitle}`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <h1 style="color:#0F172A;font-size:20px;font-weight:800;margin:0 0 8px;">Your lesson, ready on the big screen</h1>
        <p style="color:#64748B;font-size:14px;margin:0 0 20px;">
          You asked for a link to <strong style="color:#0F172A;">${opts.lessonTitle}</strong> (${opts.courseTitle}) —
          open it on your computer to write the code comfortably.
        </p>
        <a href="${opts.url}" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
          Open the lesson →
        </a>
        <p style="color:#94A3B8;font-size:12px;margin-top:28px;">
          Square 1 AI · tech@square1ai.com
        </p>
      </div>
    `,
  });
}

/* ─── Streak Reminder ────────────────────────────────────────────────────── */
export async function sendStreakReminder(
  to: string,
  name: string,
  streakDays: number,
  lessonTitle: string,
  lessonsDone = 0,
) {
  const r = getResend();
  // Only a live streak gets streak framing. With no streak we lead with what
  // they've already banked (lessons done) — progress can't be "broken", so it
  // motivates without the loss-aversion guilt trip. Callers guarantee
  // lessonsDone >= 1 (students with zero completions get the activation
  // sequence instead, never this email).
  const hasStreak = streakDays > 0;
  const headline = hasStreak
    ? `${streakDays}-day streak!`
    : lessonsDone > 0
      ? `${lessonsDone} ${lessonsDone === 1 ? "lesson" : "lessons"} done`
      : `Hey ${name}!`;
  const subline = hasStreak
    ? "Don't break it — one lesson keeps it going."
    : lessonsDone > 0
      ? "Pick up where you left off — the next one is short."
      : "Your next lesson is waiting for you.";
  return r.emails.send({
    from: FROM,
    to,
    subject: hasStreak
      ? `Keep your ${streakDays}-day streak alive!`
      : lessonsDone > 0
        ? `Pick up where you left off, ${name}`
        : "Time to learn something new",
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">
            ${headline}
          </h1>
          <p style="color:#64748B;font-size:14px;margin:0;">
            ${subline}
          </p>
        </div>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin:0 0 8px;">Next up</p>
          <p style="color:#0F172A;font-size:16px;font-weight:700;margin:0;">${lessonTitle}</p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="https://www.square1ai.com/dashboard" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Continue Learning
          </a>
        </div>

        <p style="color:#94A3B8;font-size:11px;text-align:center;">
          <a href="https://www.square1ai.com/settings" style="color:#94A3B8;">Unsubscribe</a> · Square 1 AI
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
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
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
          <a href="https://www.square1ai.com/courses" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Take the free assessment
          </a>
        </div>

        <p style="color:#94A3B8;font-size:11px;text-align:center;">
          <a href="https://www.square1ai.com/settings" style="color:#94A3B8;">Unsubscribe</a> · Square 1 AI
        </p>
      </div>
    `,
  });
}

/* ─── Activation nudge — signed up, but hasn't started a single lesson ────────
 * The highest-leverage lifecycle email: most signups stall before their first
 * lesson. Points straight at "start learning" (no assessment gate) to match the
 * dashboard's lesson-first CTA. */
/** A learner's measured gap, from their latest skill report. Null when the
 *  report is missing or holds no usable topics — then we send generic copy. */
export type ActivationGap = {
  courseTitle: string | null;
  courseSlug: string | null;
  topics: string;      // "web security, OWASP and network security"
  firstTopic: string;  // the single biggest gap
  score: number | null;
  maxScore: number | null;
};

export async function sendActivationNudge(to: string, name: string, gap: ActivationGap | null = null) {
  const r = getResend();
  // When we know what they actually scored, speak to THAT — they already spent
  // three minutes telling us. Generic "time to learn something new" wastes the
  // one piece of personalisation we've earned.
  const subject = gap
    ? `${name}, one lesson closes your biggest gap: ${gap.firstTopic}`
    : `${name}, your first lesson takes 5 minutes`;
  const heroLine = gap && gap.courseTitle
    ? `You finished the ${gap.courseTitle} skill check — here's the gap to close first.`
    : "You created your account — now the good part. Your first lesson is waiting.";
  return r.emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">Ready when you are, ${name} 👋</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">${heroLine}</p>
        </div>
${gap ? `
        <div style="background:#EFF5FF;border:1px solid #D8E7FC;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#0056CE;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin:0 0 8px;">Your biggest gap</p>
          <p style="color:#0F172A;font-size:17px;font-weight:800;margin:0 0 6px;text-transform:capitalize;">${gap.firstTopic}</p>
          <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;">
            Your check flagged ${gap.topics}${gap.score != null && gap.maxScore != null ? ` (you scored ${gap.score} of ${gap.maxScore})` : ""}.
            The next lesson starts exactly there — no need to guess where to begin.
          </p>
        </div>` : ""}

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h3 style="color:#0F172A;font-size:16px;font-weight:700;margin:0 0 8px;">5 minutes. No test. No setup.</h3>
          <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;">
            Jump straight into a real, interactive lesson — you read a bit, then write
            and run code right there in the page. It's the fastest way to feel what
            learning here is actually like. No credit card, no assessment first.
          </p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="https://www.square1ai.com/dashboard" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            Start your first lesson →
          </a>
        </div>

        <p style="color:#94A3B8;font-size:11px;text-align:center;">
          <a href="https://www.square1ai.com/settings" style="color:#94A3B8;">Unsubscribe</a> · Square 1 AI
        </p>
      </div>
    `,
  });
}

/* ─── Weekly Progress Digest ─────────────────────────────────────────────── */
/* ─── Delta email — day 1 / day 3: "your gap map moved" (retention #9) ─────
   Sent only to students who STARTED (the activation nudge owns everyone
   else), so every number here is real movement they earned. Day 1 lands the
   proof-of-motion; day 3 lands the habit frame. The gap line names Nova's
   freshest memory so the email reads personal because it IS personal. */
export async function sendDeltaEmail(to: string, name: string, delta: {
  day: 1 | 3;
  lessonsDone: number;
  topicsLit: number;
  topGap: string | null;
}) {
  const r = getResend();
  const lessonWord = delta.lessonsDone === 1 ? "lesson" : "lessons";
  const subject = delta.day === 1
    ? `24 hours in — your gap map already moved`
    : `Three days in: ${delta.lessonsDone} ${lessonWord} banked`;
  const heading = delta.day === 1 ? "Your gap map moved." : "Look at the line.";
  const bodyLine = delta.day === 1
    ? `One day on Square 1 and there's already measured movement, ${name} — this is the map most people never start drawing.`
    : `Three days in, ${name}. Most people who sign up anywhere never get here — you have receipts.`;

  return r.emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:28px;">
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:24px;font-weight:800;margin:0 0 8px;">${heading}</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">${bodyLine}</p>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:20px;">
          <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;text-align:center;">
            <p style="color:#0F172A;font-size:24px;font-weight:900;margin:0;">${delta.lessonsDone}</p>
            <p style="color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0;">${lessonWord} banked</p>
          </div>
          ${delta.topicsLit > 0 ? `
          <div style="flex:1;background:linear-gradient(135deg,#EFF6FF,#F5F3FF);border:1px solid #DBEAFE;border-radius:12px;padding:16px;text-align:center;">
            <p style="color:#0056CE;font-size:24px;font-weight:900;margin:0;">${delta.topicsLit}</p>
            <p style="color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0;">topic${delta.topicsLit === 1 ? "" : "s"} lit 🧠</p>
          </div>` : ""}
        </div>

        ${delta.topGap ? `
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
          <p style="color:#92400E;font-size:13px;font-weight:700;margin:0;">Next gap on your map: ${delta.topGap}</p>
          <p style="color:#B45309;font-size:12px;margin:4px 0 0;">Nova remembers exactly where you left it — ten focused minutes usually closes it.</p>
        </div>` : ""}

        <div style="text-align:center;margin-bottom:28px;">
          <a href="https://www.square1ai.com/dashboard" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            ${delta.day === 1 ? "Keep the map moving" : "Open today's quest"}
          </a>
          <p style="color:#94A3B8;font-size:12px;margin:10px 0 0;">Today's quest is usually under 30 minutes — the review deck alone is 2.</p>
        </div>

        <p style="color:#94A3B8;font-size:11px;text-align:center;">
          <a href="https://www.square1ai.com/settings" style="color:#94A3B8;">Unsubscribe</a> · Square 1 AI
        </p>
      </div>
    `,
  });
}

export async function sendWeeklyDigest(to: string, name: string, stats: {
  lessonsCompleted: number;
  streak: number;
  projectsDone: number;
  overallPct: number;
  /** Exercises scored >=90% this week — "lobes lit" (UX review K3). 0 hides the line. */
  topicsLit?: number;
}) {
  const r = getResend();
  return r.emails.send({
    from: FROM,
    to,
    subject: `Your weekly progress: ${stats.lessonsCompleted} lessons this week`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
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

        ${(stats.topicsLit ?? 0) > 0 ? `
        <div style="background:linear-gradient(135deg,#EFF6FF,#F5F3FF);border:1px solid #DBEAFE;border-radius:12px;padding:14px 16px;margin-bottom:24px;text-align:center;">
          <p style="color:#0F172A;font-size:14px;font-weight:700;margin:0;">🧠 Your AI brain lit ${stats.topicsLit} new topic${stats.topicsLit === 1 ? "" : "s"} this week</p>
          <p style="color:#64748B;font-size:12px;margin:4px 0 0;">Every one earned by a 90%+ graded answer — see them glow on your progress page.</p>
        </div>` : ""}

        <div style="text-align:center;margin-bottom:32px;">
          <a href="https://www.square1ai.com/progress" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:12px;">
            View Full Progress
          </a>
        </div>

        <p style="color:#94A3B8;font-size:11px;text-align:center;">
          <a href="https://www.square1ai.com/settings" style="color:#94A3B8;">Unsubscribe</a> · Square 1 AI
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
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
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
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
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
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
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
          <a href="https://www.square1ai.com/business/dashboard" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:13px;text-decoration:none;padding:10px 24px;border-radius:10px;">
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
          <a href="https://www.square1ai.com/business/dashboard" style="display:inline-block;background:#0056CE;color:white;font-weight:700;font-size:13px;text-decoration:none;padding:10px 24px;border-radius:10px;">
            Open manager portal
          </a>
        </div>
        <p style="color:#94A3B8;font-size:12px;margin-top:24px;">Square 1 AI · sent every Monday · tech@square1ai.com</p>
      </div>
    `,
  });
}

/* ─── SEO/AEO health alert (to the founder) ──────────────────────────────────
 * Sent by the daily cron ONLY when a check that was passing yesterday fails
 * today, or a countable signal drops sharply. Silence means healthy — an alert
 * that arrives every morning stops being read, which defeats the point. */
export async function sendSeoHealthAlert(opts: {
  regressions: string[];
  failures: number;
  metrics: Record<string, number>;
}) {
  const rows = opts.regressions
    .map((r) => `<li style="margin:0 0 6px">${escapeHtml(r)}</li>`)
    .join("");
  const metricRows = Object.entries(opts.metrics)
    .map(([k, v]) => `<tr><td style="padding:3px 12px 3px 0;color:#64748B">${escapeHtml(k)}</td><td style="font-weight:600">${v}</td></tr>`)
    .join("");

  return getResend().emails.send({
    from: FROM,
    to: LEAD_NOTIFY_TO,
    subject: `SEO health: ${opts.regressions.length} regression${opts.regressions.length === 1 ? "" : "s"} on square1ai.com`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;color:#0F172A">
      <h2 style="margin:0 0 4px;font-size:18px">Something that was working yesterday is not working today</h2>
      <p style="margin:0 0 16px;color:#64748B;font-size:14px">
        ${opts.failures} failing check${opts.failures === 1 ? "" : "s"} in total. Only new breakage is listed below.
      </p>
      <ul style="margin:0 0 20px;padding-left:20px;font-size:14px">${rows}</ul>
      <h3 style="margin:0 0 6px;font-size:14px">Current signals</h3>
      <table style="font-size:13px;border-collapse:collapse">${metricRows}</table>
      <p style="margin:20px 0 0;font-size:12px;color:#94A3B8">
        Detected by /api/cron/daily. Nothing was changed automatically.
      </p>
    </div>`,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/* ─── Startup School: the weekly update ──────────────────────────────────────
 * The ritual is the product (docs/startup-school-roadmap.md §4), and a ritual
 * nobody is reminded about stops happening by week four. Two sends: Sunday
 * "due tomorrow", Monday "due today" for anyone who hasn't filed.
 *
 * The email is really one line — the number they committed to last week. All
 * venture-supplied strings are escaped; these are user-authored. */
export async function sendVentureUpdateReminder(params: {
  to: string;
  name: string;
  ventureName: string;
  metricLabel: string;
  /** Formatted number they committed to, or null if they set no target. */
  committedLabel: string | null;
  kind: "due_tomorrow" | "due_today";
}) {
  const r = getResend();
  const { to, name, ventureName, metricLabel, committedLabel, kind } = params;
  const dueToday = kind === "due_today";
  const venture = escapeHtml(ventureName);

  return r.emails.send({
    from: FROM,
    to,
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    subject: committedLabel
      ? `${venture}: you committed to ${escapeHtml(committedLabel)}`
      : dueToday ? `${venture}: this week's update is due today` : `${venture}: update due tomorrow`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:28px;">
          <img src="https://www.square1ai.com/logo-square1.png" alt="Square 1 AI" width="150" style="display:inline-block;margin-bottom:16px;max-width:150px;height:auto;" />
          <h1 style="color:#0F172A;font-size:22px;font-weight:800;margin:0 0 8px;">
            ${dueToday ? "Your update is due today" : "Update due tomorrow"}
          </h1>
          <p style="color:#64748B;font-size:14px;margin:0;">${escapeHtml(name)}, two minutes on ${venture}.</p>
        </div>
        ${committedLabel ? `
        <div style="border:1px solid #E2E8F0;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94A3B8;">You committed to</p>
          <p style="margin:0;font-size:28px;font-weight:800;color:#0F172A;">${escapeHtml(committedLabel)}</p>
          <p style="margin:6px 0 0;font-size:13px;color:#64748B;">${escapeHtml(metricLabel)}</p>
        </div>` : `
        <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 24px;">
          You didn't set a target last week, so there's nothing to score this one against.
          Set one when you file — an unscored week is a week that didn't count.
        </p>`}
        <div style="text-align:center;">
          <a href="https://www.square1ai.com/venture" style="display:inline-block;background:#0F172A;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;">
            File this week's update
          </a>
        </div>
        <p style="color:#94A3B8;font-size:12px;text-align:center;margin:20px 0 0;">
          Your partner reads it and replies before anyone else sees it.
        </p>
      </div>`,
  });
}

/* ─── Startup School: standing alert (internal) ──────────────────────────────
 * Goes to the operator, never to the founder. Missed updates are the earliest
 * signal a venture is drifting, and the intervention that works is a human
 * getting in touch — not another automated email at someone who has already
 * stopped opening them. */
export async function sendVentureStandingAlert(params: {
  ventureName: string;
  founderName: string;
  founderEmail: string;
  standing: "at_risk" | "probation";
  missedInARow: number;
}) {
  const r = getResend();
  const { ventureName, founderName, founderEmail, standing, missedInARow } = params;
  const urgent = standing === "probation";

  return r.emails.send({
    from: LEAD_FROM,
    to: LEAD_NOTIFY_TO,
    subject: `${urgent ? "[probation]" : "[at risk]"} ${ventureName} — ${missedInARow} weeks without an update`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#0F172A;">
          ${escapeHtml(ventureName)} is ${urgent ? "on probation" : "at risk"}
        </h2>
        <p style="margin:0 0 8px;font-size:14px;color:#334155;line-height:1.6;">
          ${escapeHtml(founderName)} (${escapeHtml(founderEmail)}) has missed
          <strong>${missedInARow}</strong> weekly updates in a row.
        </p>
        <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">
          ${urgent
            ? "Call them. Three missed weeks is the point where founders quietly leave the programme."
            : "Worth a message before it becomes three."}
        </p>
        <p style="margin:0;font-size:12px;color:#94A3B8;">
          Detected by /api/cron/daily. No email was sent to the founder.
        </p>
      </div>`,
  });
}
