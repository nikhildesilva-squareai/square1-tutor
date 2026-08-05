import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { JsonLd } from "@/components/seo/JsonLd";
import { createClient } from "@/lib/supabase/server";
import { getRole, ROLES } from "@/lib/roles-directory";
import { getSubject } from "@/lib/diagnostic";

const BASE = "https://www.square1ai.com";

export const revalidate = 3600;

// The role set is fixed and known at build time, so prerender all of them —
// crawlers never wait on a cold render.
export function generateStaticParams() {
  return ROLES.map((r) => ({ slug: r.slug }));
}

// Any slug outside that set returns a REAL 404 rather than rendering the
// not-found page with a 200. A soft-404 tells an answer engine the URL is
// valid content; this is the same failure the proxy denylist fixed sitewide.
export const dynamicParams = false;

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) return {};
  return {
    title: `${role.title} — What the Role Involves and How to Train for It`,
    description: role.summary.slice(0, 300),
    alternates: { canonical: `${BASE}/roles/${role.slug}` },
    openGraph: {
      title: `${role.title} — Square 1 AI`,
      description: role.summary.slice(0, 300),
      url: `${BASE}/roles/${role.slug}`,
    },
  };
}

type CourseInfo = {
  slug: string;
  title: string;
  totalLessons: number | null;
  totalProjects: number | null;
  modules: string[];
};

export default async function RolePage({ params }: PageProps) {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) notFound();

  // "Skills you'll build" comes from real module titles, never from prose
  // written here — the page cannot advertise a skill the curriculum lacks.
  const supabase = await createClient();
  const courses: CourseInfo[] = [];
  for (const courseSlug of role.courseSlugs) {
    const { data: course } = await supabase
      .from("courses")
      .select("id, slug, title, total_lessons, total_projects")
      .eq("slug", courseSlug)
      .is("parent_course_id", null)
      .maybeSingle();
    if (!course) continue;
    const { data: mods } = await supabase
      .from("modules")
      .select("title, order_index")
      .eq("course_id", course.id)
      .order("order_index", { ascending: true });
    courses.push({
      slug: course.slug,
      title: course.title,
      totalLessons: course.total_lessons,
      totalProjects: course.total_projects,
      modules: (mods ?? []).map((m) => m.title as string),
    });
  }

  const allModules = [...new Set(courses.flatMap((c) => c.modules))];

  // Occupation is the correct type for "what is this job" queries. estimatedSalary
  // is emitted ONLY when a sourced figure exists — see RoleSalary in
  // lib/roles-directory.ts for why an unsourced number is never published.
  const occupationLd = {
    "@context": "https://schema.org",
    "@type": "Occupation",
    "@id": `${BASE}/roles/${role.slug}#occupation`,
    name: role.title,
    url: `${BASE}/roles/${role.slug}`,
    description: role.summary,
    alternateName: role.alsoKnownAs,
    responsibilities: role.responsibilities,
    ...(allModules.length ? { skills: allModules.join(", ") } : {}),
    ...(role.salary
      ? {
          estimatedSalary: {
            "@type": "MonetaryAmountDistribution",
            name: `${role.salary.source.name} (${role.salary.source.year}), ${role.salary.region}`,
            currency: role.salary.currency,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Roles", item: `${BASE}/roles` },
      { "@type": "ListItem", position: 3, name: role.title, item: `${BASE}/roles/${role.slug}` },
    ],
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <JsonLd data={occupationLd} />
      <JsonLd data={breadcrumbLd} />

      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/login" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
          Sign in
        </Link>
      </header>

      <main id="main" className="flex-1 px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <Link href="/roles" className="font-semibold text-[#0056CE] hover:underline">
              Roles
            </Link>
            <span className="mx-2" aria-hidden>/</span>
            <span>{role.title}</span>
          </nav>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {role.title}
          </h1>
          <p className="mt-1.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {role.lane === "career" ? "Technical role · involves code" : "Existing role · no code"}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-slate-700">{role.summary}</p>

          {role.alsoKnownAs.length > 0 && (
            <p className="mt-4 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Also advertised as:</span>{" "}
              {role.alsoKnownAs.join(", ")}.
            </p>
          )}

          {/* ── What the job involves ───────────────────────────────────── */}
          <section className="mt-10">
            <h2 className="text-xl font-bold text-slate-900">What the job involves</h2>
            <ul className="mt-4 space-y-2.5">
              {role.responsibilities.map((r) => (
                <li key={r} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0056CE]" aria-hidden />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Skills, straight from the curriculum ────────────────────── */}
          {allModules.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-slate-900">Skills this role needs</h2>
              <p className="mt-2 text-sm text-slate-600">
                These are the actual modules taught on the {courses.length === 1 ? "track" : "tracks"}{" "}
                that train for this role — not a generic skills list.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {allModules.map((m) => (
                  <li
                    key={m}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── How to train for it ─────────────────────────────────────── */}
          {courses.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-slate-900">How to train for it</h2>
              <div className="mt-4 space-y-3">
                {courses.map((c) => {
                  const subject = getSubject(c.slug);
                  const size = [
                    c.totalLessons ? `${c.totalLessons} lessons` : null,
                    c.totalProjects ? `${c.totalProjects} projects` : null,
                  ].filter(Boolean).join(" · ");
                  return (
                    <Link
                      key={c.slug}
                      href={`/diagnostic/${c.slug}`}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#CCE1FF] hover:shadow-lg"
                    >
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                        {size && <p className="mt-1 text-sm text-slate-600">{size}</p>}
                        {subject && (
                          <p className="mt-1.5 text-sm font-semibold text-[#0056CE]">
                            Start with the free 3-minute skill check
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-[#0056CE] transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-12">
            <div className="rounded-2xl bg-[#0056CE] px-6 py-8 sm:px-8">
              <h2 className="text-xl font-bold text-white">
                Find out where you stand as {/^[AEIOU]/.test(role.title) ? "an" : "a"} {role.title}
              </h2>
              <p className="mt-1.5 text-sm text-white/85">
                Five questions, about three minutes, no account required.
              </p>
              <Link
                href={role.courseSlugs[0] ? `/diagnostic/${role.courseSlugs[0]}` : "/diagnostic"}
                className="group mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#0056CE] shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Take the free skill check
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
