"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  studentId: string;
  studentName: string;
  userEmail: string;
  joinedDate: string;
  enrollments: Array<{
    id: string;
    assessment_level: string | null;
    enrolled_at: string;
    course: { title: string } | null;
  }>;
  emailOptOut: boolean;
}

export function SettingsClient({ studentId, studentName, userEmail, joinedDate, enrollments, emailOptOut }: Props) {
  const router = useRouter();
  const [name, setName] = useState(studentName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [emailsOn, setEmailsOn] = useState(!emailOptOut);
  const [togglingEmails, setTogglingEmails] = useState(false);

  async function handleToggleEmails() {
    if (togglingEmails) return;
    const next = !emailsOn;
    setEmailsOn(next);
    setTogglingEmails(true);
    try {
      const res = await fetch("/api/settings/email-prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optOut: !next }),
      });
      if (!res.ok) setEmailsOn(!next); // revert on failure
    } catch {
      setEmailsOn(!next);
    } finally {
      setTogglingEmails(false);
    }
  }

  async function handleSaveName() {
    if (!name.trim() || name === studentName) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/update-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-6">

      {/* ── Profile ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-5">Profile</p>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center text-white text-xl font-black shrink-0">
            {(name || userEmail || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-ink">{name || "No name set"}</p>
            <p className="text-xs text-ink-muted">{userEmail}</p>
            <p className="text-[10px] text-ink-muted mt-0.5">Member since {joinedDate}</p>
          </div>
        </div>

        {/* Name field */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1.5">Display Name</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 h-10 px-3.5 rounded-xl border border-border bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
              <button
                onClick={handleSaveName}
                disabled={saving || !name.trim() || name === studentName}
                className="h-10 px-5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2"
              >
                {saved ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    Saved
                  </>
                ) : saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1.5">Email Address</label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface-alt text-ink-muted text-sm"
            />
            <p className="text-[10px] text-ink-muted mt-1">Email is managed through your login method</p>
          </div>
        </div>
      </div>

      {/* ── Enrolled Courses ─────────────────────────────────────── */}
      {enrollments.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Enrolled Courses</p>
          <div className="space-y-2">
            {enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border">
                <div>
                  <p className="text-sm font-semibold text-ink">{e.course?.title ?? "Course"}</p>
                  <p className="text-[10px] text-ink-muted capitalize">
                    {e.assessment_level ?? "—"} · Enrolled {new Date(e.enrolled_at).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Preferences ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Preferences</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Email Notifications</p>
            <p className="text-xs text-ink-muted">Streak reminders, weekly progress reports, and learning nudges</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailsOn}
            onClick={handleToggleEmails}
            disabled={togglingEmails}
            className={`w-10 h-6 rounded-full relative transition-colors ${emailsOn ? "bg-brand" : "bg-border"} ${togglingEmails ? "opacity-60" : "cursor-pointer"}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${emailsOn ? "right-0.5" : "left-0.5"}`}
            />
          </button>
        </div>
      </div>

      {/* ── Support ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Support</p>
        <div className="space-y-2">
          <a href="mailto:tech@square1ai.com" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-brand/20 hover:bg-surface-soft transition-all group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink group-hover:text-brand transition-colors">Contact Support</p>
              <p className="text-[10px] text-ink-muted">tech@square1ai.com</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-ink-muted"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </a>
        </div>
      </div>

      {/* ── Account Actions ──────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-red-200 p-6">
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-4">Account</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Sign Out</p>
            <p className="text-xs text-ink-muted">Sign out of your account on this device</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="h-9 px-4 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-all"
          >
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
