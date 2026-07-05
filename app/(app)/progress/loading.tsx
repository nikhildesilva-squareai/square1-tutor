export default function Loading() {
  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-surface-alt" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-surface-alt rounded-lg" />
          <div className="h-4 w-56 bg-surface-alt rounded-lg" />
        </div>
      </div>
      <div className="bg-surface rounded-2xl border border-border p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-full bg-surface-alt" />
              <div className="h-3 w-16 bg-surface-alt rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5 h-40" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5 h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}
