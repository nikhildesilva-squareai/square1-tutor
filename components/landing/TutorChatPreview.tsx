"use client";
import { useEffect, useRef, useState } from "react";

type Message = {
  role: "student" | "ai";
  text: string;
  isCode?: boolean;
  codeContent?: string;
};

const MESSAGES: Message[] = [
  {
    role: "student",
    text: "Why is my RAG pipeline returning wrong answers?",
  },
  {
    role: "ai",
    text: "I can see the issue — your chunk size is 2,000 tokens, which is causing context bleed between document sections. Here's what to fix:\n\n1. Reduce chunk size to 400 tokens with 50-token overlap\n2. Your similarity threshold of 0.5 is too low — bump to 0.75\n3. You're not filtering by document metadata — add source filtering\n\nWant me to show you the updated code?",
  },
  {
    role: "student",
    text: "Yes please",
  },
  {
    role: "ai",
    text: "Here's the fix:",
    isCode: true,
    codeContent: `text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,
    chunk_overlap=50,
)
results = vectorstore.similarity_search(
    query, k=5, score_threshold=0.75
)`,
  },
];

const EXTRA_AI_NOTE = "This should improve your answer accuracy by ~40%.";

export function TutorChatPreview() {
  const [visibleCount, setVisibleCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          obs.disconnect();
          // Reveal messages one by one with delays
          MESSAGES.forEach((_, i) => {
            timerRef.current = setTimeout(
              () => setVisibleCount((c) => Math.max(c, i + 1)),
              i * 900
            );
          });
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-surface-soft" ref={ref}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink">
            Meet Nova — your AI tutor
          </h2>
          <p className="mt-3 text-ink-muted text-lg">
            Not generic advice. Specific feedback on your actual work.
          </p>
        </div>

        <div
          className="rounded-2xl border border-border shadow-card overflow-hidden"
          style={{ background: "#0D1117" }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 border-b border-white/10 flex items-center gap-3"
            style={{ background: "#161B22" }}
          >
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-sm font-bold text-white">
              S1
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Nova</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
                  style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                />
                Online · Watching your code
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-4 min-h-[300px]">
            {MESSAGES.slice(0, visibleCount).map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
                style={{ animation: "fadeInUp 0.4s ease-out both" }}
              >
                {msg.role === "ai" && (
                  <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-[10px] font-bold text-white mr-2 mt-1 shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "student"
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-white/8 text-slate-200 rounded-bl-sm border border-white/10"
                  }`}
                  style={msg.role === "ai" ? { background: "rgba(255,255,255,0.06)" } : {}}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.isCode && msg.codeContent && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                      <div
                        className="flex items-center gap-2 px-3 py-2 border-b border-white/10"
                        style={{ background: "#0D1117" }}
                      >
                        <div className="flex gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">rag_pipeline.py</span>
                      </div>
                      <pre
                        className="p-3 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto"
                        style={{ background: "#0D1117" }}
                      >
                        {msg.codeContent}
                      </pre>
                    </div>
                  )}
                  {msg.isCode && (
                    <p className="mt-2 text-slate-300 text-xs">{EXTRA_AI_NOTE}</p>
                  )}
                </div>
              </div>
            ))}

            {visibleCount < MESSAGES.length && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-[10px] font-bold text-white mr-2 shrink-0">
                  AI
                </div>
                <div
                  className="px-4 py-3 rounded-2xl rounded-bl-sm border border-white/10 text-sm"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <span className="flex gap-1 items-center h-5">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"
                        style={{ animation: `pulse-dot 1.4s ease-in-out ${d * 0.2}s infinite` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
