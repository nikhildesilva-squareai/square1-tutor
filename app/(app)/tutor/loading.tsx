export default function Loading() {
  return (
    <div className="flex h-full max-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand/20 to-violet-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-brand animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
        <p className="text-sm text-ink-muted">Loading Nova…</p>
      </div>
    </div>
  );
}
