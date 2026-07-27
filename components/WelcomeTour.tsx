"use client";

import { useState } from "react";
import { ProductTour, hasSeenTour } from "@/components/ProductTour";

// ═══════════════════════════════════════════════════════════════════════════════
// The whole-product walkthrough a new learner gets on their first dashboard
// visit. Its job is orientation, not feature enumeration: what this place is,
// what the daily loop looks like, and where each part of it lives.
//
// Sequenced as the learner's actual journey — learn a lesson, get graded, build
// a project, revise, ask Nova, show the proof — rather than as a tour of the
// menu in the order it happens to be rendered.
//
// The Study Hub has its own deeper tour on /notes; this one only says what it
// is and why it matters, so the two do not repeat each other.
// ═══════════════════════════════════════════════════════════════════════════════

export const WELCOME_TOUR_ID = "welcome";

export function WelcomeTour({ firstName }: { firstName?: string | null }) {
  const [signal, setSignal] = useState(0);
  const seen = typeof window !== "undefined" && hasSeenTour(WELCOME_TOUR_ID);

  return (
    <>
      <ProductTour
        id={WELCOME_TOUR_ID}
        startSignal={signal}
        steps={[
          {
            title: firstName ? `Welcome, ${firstName} — here is how this works` : "Welcome — here is how this works",
            body:
              "You learn by building, not watching. Every lesson ends in exercises, every module feeds a real project, and Nova grades what you produce. This takes about a minute to walk through.",
          },
          {
            target: "nav-dashboard",
            title: "Your dashboard is home base",
            body:
              "It always shows the one lesson to do next, plus your streak and progress. If you ever lose your place, come back here and press continue.",
          },
          {
            target: "nav-courses",
            title: "Courses hold your curriculum",
            body:
              "Each track opens with Module 0, which starts from absolute zero — your first program, variables, the terminal and Git — before any specialist material. No prior coding is assumed.",
          },
          {
            target: "nav-projects",
            title: "Projects are the proof",
            body:
              "Every track is built around real projects with a starter repo and a dataset. You build, Nova reviews it against a rubric, and it ships to your GitHub. This is what employers can actually open.",
          },
          {
            target: "nav-notes",
            title: "The Study Hub remembers for you",
            body:
              "Finish a lesson and its questions become flashcards here automatically, due the next day. Reviewing the due ones is the single highest-value habit on the platform. It has its own walkthrough when you open it.",
          },
          {
            target: "nav-progress",
            title: "Progress shows your real level",
            body:
              "A topic-by-topic skill report built from how you actually performed — strengths, gaps and where you sit against the role you are aiming at.",
          },
          {
            target: "nav-tutor",
            title: "Nova is there when you are stuck",
            body:
              "Your AI tutor knows the lesson you are on and the code you wrote. Ask it to explain rather than to solve — that is where the learning happens.",
          },
          {
            title: "That is the loop",
            body:
              "Do a lesson, answer the checks, review your flashcards, and build the project when you reach it. Start with the lesson on your dashboard — it takes about five minutes.",
          },
        ]}
      />

      {/* Quiet replay affordance — the tour is skippable, so it must be
          findable again afterwards. */}
      {seen && (
        <button
          onClick={() => setSignal((n) => n + 1)}
          className="text-xs font-semibold text-ink-muted hover:text-brand transition-colors inline-flex items-center gap-1.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.1 9a3 3 0 115 2.2c-.9.7-1.6 1.2-1.6 2.3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Replay the tour
        </button>
      )}
    </>
  );
}
