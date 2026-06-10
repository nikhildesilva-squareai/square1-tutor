/**
 * Client-side event tracking for Google Analytics 4.
 *
 * Usage:
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("sign_up", { method: "google" });
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}

// ─── Pre-defined events for Square 1 AI ──────────────────────────────────────

export const analytics = {
  // Auth
  signUp: (method: string) => trackEvent("sign_up", { method }),
  login: (method: string) => trackEvent("login", { method }),

  // Funnel
  courseViewed: (courseSlug: string) =>
    trackEvent("course_viewed", { course: courseSlug }),
  assessmentStarted: (courseSlug: string) =>
    trackEvent("assessment_started", { course: courseSlug }),
  assessmentCompleted: (courseSlug: string, level: string) =>
    trackEvent("assessment_completed", { course: courseSlug, level }),
  planViewed: (courseSlug: string) =>
    trackEvent("plan_viewed", { course: courseSlug }),
  checkoutStarted: (courseSlug: string, tier: string) =>
    trackEvent("checkout_started", { course: courseSlug, tier }),
  paymentCompleted: (courseSlug: string, amount: number) =>
    trackEvent("purchase", { course: courseSlug, value: amount, currency: "USD" }),
  enrolled: (courseSlug: string) =>
    trackEvent("enrolled", { course: courseSlug }),

  // Learning
  lessonStarted: (lessonId: string) =>
    trackEvent("lesson_started", { lesson_id: lessonId }),
  lessonCompleted: (lessonId: string) =>
    trackEvent("lesson_completed", { lesson_id: lessonId }),
  quizCompleted: (score: number, maxScore: number) =>
    trackEvent("quiz_completed", { score, max_score: maxScore }),
  projectSubmitted: (projectId: string) =>
    trackEvent("project_submitted", { project_id: projectId }),

  // Engagement
  tutorChatSent: () => trackEvent("tutor_chat_sent"),
  noteCreated: () => trackEvent("note_created"),
};
