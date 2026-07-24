import { Marquee } from "@/components/ui/marquee";

// ═══════════════════════════════════════════════════════════════════════════════
// Tool strip — a slim marquee of the tools the curriculum actually trains on
// (product fact: every logo here appears in live course exercises/projects).
// Sits between the hero and the lane map: answers "will I learn real tools?"
// before the course fan-out makes the same case in detail. Icons render in
// full brand color (user call 2026-07-24 — grayscale looked flat).
// Logos: svgl.app via the 21st.dev logo library, served from /public/logos.
// ═══════════════════════════════════════════════════════════════════════════════

const TOOLS = [
  { name: "Python",        src: "/logos/python.svg" },
  { name: "OpenAI",        src: "/logos/openai.svg" },
  { name: "Claude",        src: "/logos/claude.svg" },
  { name: "Gemini",        src: "/logos/gemini.svg" },
  { name: "GitHub Copilot", src: "/logos/copilot.svg" },
  { name: "Hugging Face",  src: "/logos/huggingface.svg" },
  { name: "LangChain",     src: "/logos/langchain.svg" },
  { name: "GitHub",        src: "/logos/github.svg" },
  { name: "React",         src: "/logos/react.svg" },
  { name: "Next.js",       src: "/logos/nextjs.svg" },
  { name: "TypeScript",    src: "/logos/typescript.svg" },
  { name: "Supabase",      src: "/logos/supabase.svg" },
];

export function ToolsMarquee() {
  return (
    <section aria-label="Tools you train on" className="relative py-7 sm:py-9 bg-white border-y border-slate-100">
      <p className="text-center text-[10px] sm:text-[11px] tracking-[0.3em] uppercase text-slate-400 font-bold mb-4 px-6">
        Train hands-on with the tools in the job ad
      </p>
      <div className="relative max-w-5xl mx-auto overflow-hidden">
        <Marquee pauseOnHover className="[--duration:38s] [--gap:2.75rem] p-0 py-1">
          {TOOLS.map((t) => (
            <span
              key={t.name}
              className="flex items-center gap-2.5 shrink-0 opacity-90 transition-opacity duration-200 hover:opacity-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.src} alt="" className="h-6 w-6 object-contain" loading="lazy" />
              <span className="text-[13px] font-semibold text-slate-600 whitespace-nowrap">{t.name}</span>
            </span>
          ))}
        </Marquee>
        {/* Edge fades so the loop has no hard seam */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-white to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-white to-transparent" />
      </div>
    </section>
  );
}
