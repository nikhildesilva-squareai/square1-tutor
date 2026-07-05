export default function Loading() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-surface-alt" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-surface-alt rounded-lg" />
          <div className="h-4 w-64 bg-surface-alt rounded-lg" />
        </div>
      </div>
      <div className="rounded-2xl bg-surface-alt h-48 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-surface rounded-xl border border-border p-5 h-40" />
        <div className="bg-surface rounded-xl border border-border p-5 h-40" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-5 h-28" />
        ))}
      </div>
    </div>
  );
}
