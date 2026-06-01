"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("sq1_cookie_consent")) setVisible(true);
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem("sq1_cookie_consent", "essential");
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-surface border-t border-border shadow-[0_4px_24px_rgb(0_86_206_/_0.12)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-ink-secondary">
          🍪 We use <strong>essential cookies only</strong> to keep you signed in. No tracking, no
          ads, no third-party data sharing. GDPR compliant.{" "}
          <Link href="/privacy" className="text-brand underline">
            Privacy Policy
          </Link>
        </p>
        <button
          onClick={accept}
          className="shrink-0 px-5 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors"
        >
          Accept &amp; Continue
        </button>
      </div>
    </div>
  );
}
