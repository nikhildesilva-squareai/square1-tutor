import { Check } from "lucide-react";
import { FOUNDING_PRICE } from "@/lib/founding";
import { PrimaryCta } from "@/components/ui/primary-cta";

// ═══════════════════════════════════════════════════════════════════════════════
// Honest Proof — founder note + founding student offer.
// Deliberately contains ZERO testimonials: Square 1 is new and we don't invent
// social proof. Real student stories go here once real students earn them —
// with verifiable portfolios attached.
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDING_PERKS = [
  {
    title: FOUNDING_PRICE ? `Founding pricing — ${FOUNDING_PRICE}, locked` : "Founding pricing, locked",
    desc:  "Whatever you pay now is your price for life — it never goes up on you.",
    accent: "#3388FF",
  },
  {
    title: "A direct line to the founder",
    desc:  "Feedback, stuck points, ideas — they land in my inbox, not a ticket queue.",
    accent: "#0EA5E9",
  },
  {
    title: "Shape the platform",
    desc:  "Early students decide what gets built next. Your gaps set the roadmap.",
    accent: "#3388FF",
  },
];

export function SocialProofSection({ courseCount = 9 }: { courseCount?: number }) {
  return (
    <section
      className="relative overflow-hidden pt-20 sm:pt-28 lg:pt-32 pb-14 sm:pb-16 px-4 sm:px-6 lg:px-8"
      style={{
        background: `
          radial-gradient(ellipse 900px 500px at 20% 30%, rgba(0,86,206,0.08), transparent 60%),
          radial-gradient(ellipse 800px 500px at 80% 70%, rgba(14,165,233,0.06), transparent 60%),
          linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
        `,
      }}
    >
      {/* Drifting blob */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-25 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.18) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Straight Talk
          </span>
          <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
            style={{ fontSize: "clamp(36px, 6vw, 80px)" }}>
            No fake testimonials.{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Just the product.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            Square 1 is brand new. We could invent glowing reviews — plenty of
            landing pages do. Here&apos;s our deal with you instead.
          </p>
        </div>

        {/* Founder note + founding offer — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-stretch">

          {/* LEFT — founder note */}
          <div
            className="relative rounded-3xl border overflow-hidden p-8 sm:p-10 lg:p-12"
            style={{
              background: `
                linear-gradient(135deg, rgba(0,86,206,0.06) 0%, #FFFFFF 50%, rgba(0,86,206,0.03) 100%),
                radial-gradient(circle at top right, rgba(0,86,206,0.06), transparent 60%)
              `,
              borderColor: "rgba(0,86,206,0.18)",
              boxShadow: "0 16px 48px rgba(0,86,206,0.10), 0 0 0 1px rgba(0,86,206,0.05) inset",
            }}
          >
            <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-slate-500 mb-6">
              A note from the founder
            </p>

            <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
              <p>
                I built Square 1 because of the thing that kept killing my own learning:
                <span className="font-semibold text-slate-900"> nobody ever looked at my work.</span>{" "}
                Courses gave me videos. Tutorials gave me copy-paste. Nothing told me
                whether <em>my</em> code was good, or what to fix.
              </p>
              <p>
                So every claim on this page is about what the product does — an AI that
                grades your assessment, reviews every line of code you submit, and tutors
                you on <em>your</em> gaps. You can verify all of it in the free assessment
                before paying a cent.
              </p>
              <p>
                Student success stories will appear here when real students earn them —
                with their public portfolios attached so you can check the receipts.
                Until then, the product has to speak for itself.{" "}
                <span className="font-semibold text-slate-900">I think it does.</span>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/70 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-black text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #3388FF, #0056CE)" }}>
                ND
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Nikhil De Silva</p>
                <p className="text-xs text-slate-500">Founder, Square 1 AI</p>
              </div>
            </div>
          </div>

          {/* RIGHT — founding student offer */}
          <div
            className="relative rounded-3xl border overflow-hidden p-8 flex flex-col"
            style={{
              background: "linear-gradient(180deg, #0B1626 0%, #050B14 100%)",
              borderColor: "rgba(255,255,255,0.10)",
              boxShadow: "0 16px 48px rgba(5,11,20,0.35)",
            }}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-40"
              style={{ background: "radial-gradient(circle, rgba(51,136,255,0.35) 0%, transparent 70%)", filter: "blur(24px)" }} />

            <div className="relative flex items-center gap-2 mb-2">
              <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-slate-500">
                Founding students
              </p>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.30)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
                Cohort 01 · open now
              </span>
            </div>
            <h3 className="relative text-2xl font-black text-white leading-tight mb-6">
              Get in before the
              <br />
              success stories do.
            </h3>

            <div className="relative space-y-5 flex-1">
              {FOUNDING_PERKS.map((p) => (
                <div key={p.title} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${p.accent}18`, border: `1px solid ${p.accent}35` }}>
                    <Check size={12} strokeWidth={3} style={{ color: p.accent }} aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{p.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="relative mt-8 text-[11px] text-slate-500 leading-relaxed">
              Being early is a trade: you get more access and a locked price; we get the
              feedback that makes this the best place to learn. The price only goes up as
              we grow — founding rates won&apos;t come back. Fair?
            </p>
          </div>
        </div>

        {/* Bottom — factual stats row */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
          {[
            { value: "10+",  label: "projects per student" },
            { value: String(courseCount), label: "career paths" },
            { value: "45",   label: "minutes per day" },
            { value: "100%", label: "code, zero videos" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-black tabular-nums text-slate-900 leading-none"
                style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.04em" }}>
                {s.value}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 sm:mt-14 flex flex-col items-center gap-4">
          <PrimaryCta href="/diagnostic">
            Get your free skill report
          </PrimaryCta>
          <p className="text-xs text-slate-500">Free · 3 minutes · No credit card</p>
        </div>
      </div>
    </section>
  );
}
