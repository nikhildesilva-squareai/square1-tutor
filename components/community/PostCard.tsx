"use client";

import { Heart, MessageCircle, Send, Waypoints } from "lucide-react";
import type {
  FeedPost,
  RepoAttachment,
  NotesAttachment,
  MediaAttachment,
  ProjectAttachment,
} from "@/lib/community/feed-types";
import { Avatar } from "./Avatar";
import { RepoCard, NotesCard, ProjectCard, MediaGrid } from "./PostAttachments";

interface PostCardProps {
  post: FeedPost;
  onLike: (post: FeedPost) => void;
  onCollaborate: (post: FeedPost) => void;
  onFollow: (profileId: string, next: boolean) => void;
  onOpenProfile: (profileId: string) => void;
  onMessage: (profileId: string) => void;
}

export function PostCard({ post, onLike, onCollaborate, onFollow, onOpenProfile, onMessage }: PostCardProps) {
  const repo = post.attachments.find((a) => a.kind === "repo") as RepoAttachment | undefined;
  const notes = post.attachments.find((a) => a.kind === "notes") as NotesAttachment | undefined;
  const project = post.attachments.find((a) => a.kind === "project") as ProjectAttachment | undefined;
  const media = post.attachments.filter(
    (a) => a.kind === "image" || a.kind === "video" || a.kind === "document"
  ) as MediaAttachment[];

  return (
    <article className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_0_rgba(21,47,84,0.04)] transition-[box-shadow,border-color] duration-200 hover:border-border-mid/40 hover:shadow-card-hover">
      {/* Author row */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onOpenProfile(post.author.profileId)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Avatar name={post.author.name} initials={post.author.initials} avatarUrl={post.author.avatarUrl} size={48} />
          <div className="min-w-0">
            <div className="font-semibold text-ink">{post.author.name}</div>
            <div className="text-[13px] text-ink-muted">{post.meta}</div>
          </div>
        </button>
        {!post.isSelf && (
          <button
            onClick={() => onFollow(post.author.profileId, !post.followsAuthor)}
            className={
              post.followsAuthor
                ? "h-8 whitespace-nowrap rounded-md border border-border bg-surface px-3.5 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
                : "h-8 whitespace-nowrap rounded-md bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-dark"
            }
          >
            {post.followsAuthor ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Text */}
      {post.text && <p className="mt-4 text-[15px] leading-relaxed text-ink-secondary">{post.text}</p>}

      {/* Attachments */}
      {project && <ProjectCard project={project} />}
      {repo && <RepoCard repo={repo} collabCount={post.collabCount} />}
      {notes && <NotesCard notes={notes} />}
      {media.length > 0 && <MediaGrid media={media} />}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <button
          onClick={() => onLike(post)}
          className={
            "inline-flex h-[38px] items-center gap-1.5 rounded-md px-3.5 text-sm font-medium transition-colors " +
            (post.likedByMe ? "bg-surface-tint text-brand" : "text-ink-secondary hover:bg-surface-alt")
          }
        >
          <Heart className="h-[18px] w-[18px]" fill={post.likedByMe ? "currentColor" : "none"} />
          {post.likeCount}
        </button>
        <div className="flex-1" />
        {repo && (
          <button
            onClick={() => onCollaborate(post)}
            className={
              post.collabByMe
                ? "inline-flex h-[38px] items-center gap-1.5 rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
                : "inline-flex h-[38px] items-center gap-1.5 rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            }
          >
            <Waypoints className="h-[17px] w-[17px]" />
            {post.collabByMe ? "Requested" : "Collaborate"}
          </button>
        )}
        <button
          onClick={() => onMessage(post.author.profileId)}
          className="inline-flex h-[38px] items-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-alt"
        >
          <Send className="h-[18px] w-[18px]" />
          Message
        </button>
      </div>
    </article>
  );
}
