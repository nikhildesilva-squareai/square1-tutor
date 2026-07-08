"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Video, FileText, NotebookText, X, Loader2 } from "lucide-react";
import { GithubMark } from "./PostAttachments";
import { Avatar } from "./Avatar";

type MediaKind = "image" | "video" | "document";

interface PendingMedia {
  id: string;
  type: MediaKind;
  url?: string;
  name: string;
  size: number;
  uploading: boolean;
}
interface PendingNotes {
  id: string;
  type: "notes";
  topic: string;
  course: string;
}
interface RepoMeta {
  owner: string;
  name: string;
  url: string;
  description?: string;
  language?: string;
  languageColor?: string;
  stars?: number;
  forks?: number;
}

let seq = 0;
const uid = () => `p${Date.now()}-${seq++}`;

const ACCEPT: Record<MediaKind, string> = {
  image: "image/*",
  video: "video/mp4,video/webm,video/quicktime",
  document: ".pdf,.doc,.docx,.xls,.xlsx,.txt",
};

const attachBtn =
  "inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-surface-alt";

export function PostComposer({ me, onPosted }: { me: { name?: string; avatarUrl?: string | null }; onPosted: () => void }) {
  const [text, setText] = useState("");
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [notes, setNotes] = useState<PendingNotes[]>([]);
  const [showRepo, setShowRepo] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [repo, setRepo] = useState<RepoMeta | null>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const pickKind = useRef<MediaKind>("image");

  const openPicker = (kind: MediaKind) => {
    pickKind.current = kind;
    if (fileRef.current) {
      fileRef.current.accept = ACCEPT[kind];
      fileRef.current.value = "";
      fileRef.current.click();
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = pickKind.current;
    const id = uid();
    setMedia((m) => [...m, { id, type: kind, name: file.name, size: file.size, uploading: true }]);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const uploaded = data.files?.[0];
      setMedia((m) => m.map((x) => (x.id === id ? { ...x, url: uploaded.fileUrl, uploading: false } : x)));
    } catch {
      setMedia((m) => m.filter((x) => x.id !== id));
    }
  };

  const loadRepo = async () => {
    const url = repoUrl.trim();
    if (!url) return;
    setRepoLoading(true);
    setRepoError(null);
    try {
      const res = await fetch(`/api/github/repo-meta?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load repo");
      setRepo(data.repo);
    } catch (err) {
      setRepoError(err instanceof Error ? err.message : "Could not load repo");
      setRepo(null);
    } finally {
      setRepoLoading(false);
    }
  };

  const hasPending = media.length > 0 || notes.length > 0 || !!repo;
  const canPost = (text.trim() || hasPending) && !media.some((m) => m.uploading) && !posting;

  const reset = () => {
    setText("");
    setMedia([]);
    setNotes([]);
    setShowRepo(false);
    setRepoUrl("");
    setRepo(null);
    setRepoError(null);
  };

  const submit = async () => {
    if (!canPost) return;
    setPosting(true);
    const attachments: { kind: string; payload: unknown }[] = [];
    for (const m of media) {
      if (!m.url) continue;
      attachments.push({ kind: m.type, payload: { url: m.url, name: m.name, size: m.size } });
    }
    for (const n of notes) {
      if (!n.topic && !n.course) continue;
      attachments.push({
        kind: "notes",
        payload: { topic: n.topic || "Untitled notes", course: n.course, preview: text.trim() },
      });
    }
    if (repo) attachments.push({ kind: "repo", payload: repo });

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), attachments }),
      });
      if (!res.ok) throw new Error();
      reset();
      onPosted();
    } catch {
      /* keep the draft so the user can retry */
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-[0_1px_2px_0_rgba(21,47,84,0.04)]">
      <div className="flex items-center gap-3">
        <Avatar name={me.name} avatarUrl={me.avatarUrl} size={40} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share a project or start a thread…"
          className="s1-search h-11 flex-1 rounded-full border border-border bg-surface-soft px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted focus:border-brand"
        />
      </div>

      {showRepo && (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border bg-surface-soft px-3.5 py-2.5">
          <GithubMark size={18} className="shrink-0 text-ink-secondary" />
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onBlur={loadRepo}
            onKeyDown={(e) => e.key === "Enter" && loadRepo()}
            placeholder="Paste a GitHub repo URL (github.com/owner/repo)"
            className="h-9 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          {repoLoading && <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />}
        </div>
      )}
      {repoError && <p className="mt-2 text-[13px] text-error">{repoError}</p>}

      {/* Pending previews */}
      {hasPending && (
        <div className="mt-3 flex flex-col gap-2.5">
          {repo && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface-soft px-3 py-2 text-sm text-ink-secondary">
              <GithubMark size={16} className="text-ink-secondary" />
              <span className="truncate">
                {repo.owner}/{repo.name}
              </span>
              <button onClick={() => setRepo(null)} className="ml-auto text-ink-muted hover:text-ink" aria-label="Remove repo">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {media.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {media.map((m) => (
                <div
                  key={m.id}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface-soft px-3 text-sm text-ink-secondary"
                >
                  {m.uploading ? <Loader2 className="h-4 w-4 animate-spin text-ink-muted" /> : mediaIcon(m.type)}
                  <span className="max-w-[180px] truncate">{m.name}</span>
                  <button
                    onClick={() => setMedia((arr) => arr.filter((x) => x.id !== m.id))}
                    className="text-ink-muted hover:text-ink"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {notes.map((n) => (
            <div key={n.id} className="flex items-center gap-2 rounded-md border border-border bg-surface-soft px-3.5 py-3">
              <NotebookText className="h-[18px] w-[18px] shrink-0 text-brand" />
              <input
                value={n.topic}
                onChange={(e) => setNotes((arr) => arr.map((x) => (x.id === n.id ? { ...x, topic: e.target.value } : x)))}
                placeholder="Topic (e.g. Eigenvectors)"
                className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-ink outline-none"
              />
              <input
                value={n.course}
                onChange={(e) => setNotes((arr) => arr.map((x) => (x.id === n.id ? { ...x, course: e.target.value } : x)))}
                placeholder="Course (e.g. MATH 204)"
                className="h-9 w-40 rounded-md border border-border bg-surface px-3 text-sm text-ink outline-none"
              />
              <button
                onClick={() => setNotes((arr) => arr.filter((x) => x.id !== n.id))}
                className="text-ink-muted hover:text-ink"
                aria-label="Remove notes"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" className="hidden" onChange={onFile} />

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap gap-1.5">
          <button className={attachBtn} onClick={() => openPicker("image")} title="Add photo">
            <ImageIcon className="h-[17px] w-[17px]" /> Photo
          </button>
          <button className={attachBtn} onClick={() => openPicker("video")} title="Add video">
            <Video className="h-[17px] w-[17px]" /> Video
          </button>
          <button className={attachBtn} onClick={() => openPicker("document")} title="Add document">
            <FileText className="h-[17px] w-[17px]" /> Document
          </button>
          <button
            className={attachBtn}
            onClick={() => setNotes((n) => (n.length ? n : [{ id: uid(), type: "notes", topic: "", course: "" }]))}
            title="Share notes"
          >
            <NotebookText className="h-[17px] w-[17px]" /> Notes
          </button>
          <button className={attachBtn} onClick={() => setShowRepo((v) => !v)} title="Attach GitHub repo">
            <GithubMark size={17} /> Repo
          </button>
        </div>
        <button
          onClick={submit}
          disabled={!canPost}
          className="h-10 rounded-full bg-brand px-[22px] text-[15px] font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}

function mediaIcon(kind: MediaKind) {
  if (kind === "image") return <ImageIcon className="h-4 w-4 text-brand" />;
  if (kind === "video") return <Video className="h-4 w-4 text-brand" />;
  return <FileText className="h-4 w-4 text-brand" />;
}
