import { Star, GitFork, Users, Download, Play, ArrowDownToLine, ExternalLink } from "lucide-react";
import type {
  RepoAttachment,
  NotesAttachment,
  MediaAttachment,
  ProjectAttachment,
} from "@/lib/community/feed-types";

/** GitHub mark — lucide dropped brand icons, so it's inlined. */
export function GithubMark({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden className={className}>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.2-3.37-1.2-.46-1.18-1.11-1.49-1.11-1.49-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.35 9.35 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.79-4.58 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

export function RepoCard({ repo, collabCount }: { repo: RepoAttachment; collabCount: number }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-surface-soft p-4 sm:px-5">
      <div className="flex items-start gap-3">
        <GithubMark size={22} className="mt-0.5 shrink-0 text-ink" />
        <div className="min-w-0 flex-1">
          <div className="text-sm text-ink-muted">{repo.owner} /</div>
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[17px] text-brand hover:underline"
          >
            {repo.name}
          </a>
          {repo.description && (
            <p className="mt-1.5 mb-3 text-sm leading-relaxed text-ink-muted">{repo.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-ink-muted">
            {repo.language && (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-[11px] w-[11px] rounded-full"
                  style={{ background: repo.languageColor ?? "#94A3B8" }}
                />
                {repo.language}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-[15px] w-[15px]" /> {repo.stars ?? 0}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GitFork className="h-[15px] w-[15px]" /> {repo.forks ?? 0}
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <Users className="h-[15px] w-[15px]" /> {collabCount} collaborating
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotesCard({ notes }: { notes: NotesAttachment }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-surface-tint p-4 sm:px-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
          <ArrowDownToLine className="h-5 w-5 text-brand" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-1.5 inline-block rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand">
            Study notes
          </span>
          <div className="font-bold text-ink">{notes.topic}</div>
          {notes.course && <div className="mt-0.5 text-[13px] text-brand">{notes.course}</div>}
          {notes.preview && (
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{notes.preview}</p>
          )}
          <div className="mt-3 flex items-center justify-end">
            <button className="inline-flex h-[34px] items-center gap-1.5 rounded-md border border-brand bg-surface px-3.5 text-[13px] font-medium text-brand transition-colors hover:bg-surface-tint">
              <Download className="h-[15px] w-[15px]" /> Open notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectCard({ project }: { project: ProjectAttachment }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border">
      <div className="h-2 bg-gradient-to-r from-brand-light via-brand to-brand-dark" />
      <div className="p-4 sm:px-5">
        <div className="font-bold text-ink">{project.title}</div>
        {project.description && (
          <p className="mt-1 mb-3 text-sm leading-relaxed text-ink-muted">{project.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {(project.techStack ?? []).map((t) => (
            <span key={t} className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
              {t}
            </span>
          ))}
          {(project.githubUrl || project.liveUrl) && (
            <a
              href={project.liveUrl || project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function MediaGrid({ media }: { media: MediaAttachment[] }) {
  return (
    <div className={`mt-4 grid gap-2 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {media.map((m, i) => {
        if (m.kind === "image") {
          return (
            <div key={m.id ?? i} className="relative overflow-hidden rounded-lg border border-border" style={{ aspectRatio: "4 / 3" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.name ?? "Photo"} className="h-full w-full object-cover" />
            </div>
          );
        }
        if (m.kind === "video") {
          return (
            <div key={m.id ?? i} className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "16 / 9" }}>
              <video src={m.url} controls className="h-full w-full bg-brand-deep object-cover">
                <track kind="captions" />
              </video>
              {m.length && (
                <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  {m.length}
                </span>
              )}
              <Play className="pointer-events-none absolute inset-0 m-auto h-10 w-10 text-white/0" />
            </div>
          );
        }
        // document
        return (
          <div key={m.id ?? i} className="flex items-center gap-3.5 rounded-lg border border-border bg-surface-soft p-4">
            <div className="flex shrink-0 items-center justify-center rounded-md bg-error-bg text-[12px] font-bold text-error" style={{ height: 52, width: 44 }}>
              {(m.name?.split(".").pop() || "DOC").slice(0, 4).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-ink">{m.name ?? "Document"}</div>
              {m.size != null && <div className="text-[13px] text-ink-muted">{formatBytes(m.size)}</div>}
            </div>
            <a
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-md border border-border bg-surface transition-colors hover:bg-surface-alt"
              title="Download"
            >
              <Download className="h-[18px] w-[18px] text-ink-secondary" />
            </a>
          </div>
        );
      })}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
