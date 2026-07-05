export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-surface border-b border-border px-4 sm:px-6 py-4 shrink-0 animate-pulse">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-alt shrink-0" />
          <div className="space-y-1.5">
            <div className="h-4 w-24 bg-surface-alt rounded" />
            <div className="h-3 w-48 bg-surface-alt rounded" />
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <svg className="w-6 h-6 text-brand animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    </div>
  );
}
