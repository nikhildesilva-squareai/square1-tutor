"use client";
import { useEffect } from "react";
import { SUBJECT_KEY } from "./SubjectCapture";

// Runs once after sign-in: if the visitor picked a subject on the diagnostic
// (stashed in localStorage before they authenticated), send it to the profile
// so it lands on their student record + auth metadata. Clears the stash on
// success so it only fires once. Best-effort — never blocks the page.
export function SubjectSync() {
  useEffect(() => {
    let subject: string | null = null;
    try {
      subject = localStorage.getItem(SUBJECT_KEY);
    } catch {
      return;
    }
    if (!subject) return;

    fetch("/api/profile/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject }),
    })
      .then((r) => {
        if (r.ok) {
          try {
            localStorage.removeItem(SUBJECT_KEY);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* offline / transient — leave the stash for next load */
      });
  }, []);
  return null;
}
