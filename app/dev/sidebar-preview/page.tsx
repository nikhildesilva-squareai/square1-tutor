"use client";

// Dev-only preview of the app sidebar — lets us check nav/footer proportions
// on short viewports without logging in. Returns 404 in production.

import { notFound } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";

export default function SidebarPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="h-screen flex bg-surface-soft">
      <SidebarNav userEmail="nikhil.desilv@gmail.com" userId="dev-fixture" />
      <div className="flex-1 flex items-center justify-center text-sm text-ink-muted">
        main content area
      </div>
    </div>
  );
}
