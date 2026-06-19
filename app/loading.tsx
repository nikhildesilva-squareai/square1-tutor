import { Logo } from "@/components/ui/logo";

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "#050B14" }}>
      <Logo variant="light" size="lg" />
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </main>
  );
}
