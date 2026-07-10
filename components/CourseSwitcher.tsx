"use client";

import { useRouter } from "next/navigation";

interface CourseOption {
  slug: string;
  title: string;
  color: string;
}

export function CourseSwitcher({
  courses,
  activeSlug,
}: {
  courses: CourseOption[];
  activeSlug: string;
}) {
  const router = useRouter();

  if (courses.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {courses.map((c) => {
        const isActive = c.slug === activeSlug;
        return (
          <button
            key={c.slug}
            onClick={() => {
              router.push(`/dashboard?course=${c.slug}`);
            }}
            className={[
              "flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-xs font-semibold transition-all",
              isActive
                ? "bg-white/20 text-white shadow-sm ring-1 ring-white/10"
                : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/85",
            ].join(" ")}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: isActive ? "white" : c.color }}
            />
            {c.title}
          </button>
        );
      })}
    </div>
  );
}
