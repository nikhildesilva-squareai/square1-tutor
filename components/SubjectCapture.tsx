"use client";
import { useEffect } from "react";

// Records the subject a visitor chose on the (public, pre-signup) diagnostic, so
// it can be attached to their profile after they authenticate. Mirrors how the
// auth callback captures country — but the subject is only known client-side,
// pre-auth, so we stash it in localStorage and sync it in once they're signed in
// (see SubjectSync + /api/profile/interest). No PII; just the chosen track.
export const SUBJECT_KEY = "sq1_subject";

export function SubjectCapture({ subject }: { subject: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(SUBJECT_KEY, subject);
    } catch {
      /* storage blocked (private mode) — non-critical */
    }
  }, [subject]);
  return null;
}
