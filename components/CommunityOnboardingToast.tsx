"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Shows an onboarding toast when user logs in and their community profile
 * is created for the first time.
 *
 * Shows: "Your community profile is ready! Explore communities."
 * With a CTA button to navigate to communities section.
 */
export function CommunityOnboardingToast() {
  const [showToast, setShowToast] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has just created a profile
    // We use localStorage to track if this is their first login
    const hasSeenOnboarding = localStorage.getItem("community_profile_onboarded");

    if (!hasSeenOnboarding && !dismissed) {
      // Show toast for first-time users
      setShowToast(true);
      // Mark as seen
      localStorage.setItem("community_profile_onboarded", "true");
    }
  }, [dismissed]);

  if (!showToast || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Toast container */}
      <div className="bg-gradient-to-r from-brand to-brand/90 rounded-xl shadow-lg shadow-brand/20 p-4 border border-brand/30">
        {/* Content */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="text-sm font-bold text-white mb-1">
              Your community profile is ready!
            </p>
            <p className="text-xs text-white/90 mb-3">
              Connect with other learners, share projects, and build together.
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <Link
                href="/community"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-brand font-semibold text-xs hover:bg-white/95 transition-colors"
              >
                Explore Communities
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {/* Dismiss */}
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
