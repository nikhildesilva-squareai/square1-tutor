"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FeedPost } from "@/lib/community/feed-types";
import { PostComposer } from "./PostComposer";
import { PostCard } from "./PostCard";
import { PeopleToFollow } from "./PeopleToFollow";
import { MemberProfileSlideOver } from "./MemberProfileSlideOver";

interface PostFeedClientProps {
  me: { name?: string; avatarUrl?: string | null };
}

export function PostFeedClient({ me }: PostFeedClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [followVersion, setFollowVersion] = useState(0);
  const [slideProfileId, setSlideProfileId] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/posts?limit=20");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      /* leave prior posts in place */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const onLike = useCallback((post: FeedPost) => {
    const next = !post.likedByMe;
    setPosts((arr) =>
      arr.map((p) =>
        p.id === post.id ? { ...p, likedByMe: next, likeCount: p.likeCount + (next ? 1 : -1) } : p
      )
    );
    fetch(`/api/posts/${post.id}/like`, { method: next ? "POST" : "DELETE" }).catch(() => {});
  }, []);

  const onCollaborate = useCallback((post: FeedPost) => {
    const next = !post.collabByMe;
    setPosts((arr) =>
      arr.map((p) =>
        p.id === post.id ? { ...p, collabByMe: next, collabCount: p.collabCount + (next ? 1 : -1) } : p
      )
    );
    fetch(`/api/posts/${post.id}/collaborate`, { method: next ? "POST" : "DELETE" }).catch(() => {});
  }, []);

  const onFollow = useCallback((profileId: string, next: boolean) => {
    setPosts((arr) => arr.map((p) => (p.authorProfileId === profileId ? { ...p, followsAuthor: next } : p)));
    setFollowVersion((v) => v + 1);
    fetch("/api/follows", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingProfileId: profileId }),
    }).catch(() => {});
  }, []);

  const onMessage = useCallback(() => {
    // Member DMs are not yet built; the Messages tab is the app's inbox.
    router.push("/messages");
  }, [router]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[40px] font-bold leading-tight tracking-tight text-ink">Post</h1>
        <p className="mt-1.5 text-lg text-ink-muted">Share projects, start threads, and connect with members</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Feed column */}
        <div className="flex min-w-0 flex-col gap-6">
          <PostComposer me={me} onPosted={fetchFeed} />

          {loading ? (
            <div className="flex flex-col gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-soft px-6 py-16 text-center">
              <div className="font-bold text-ink">No posts yet</div>
              <p className="mt-1 text-sm text-ink-muted">Be the first to share a project or start a thread.</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={onLike}
                onCollaborate={onCollaborate}
                onFollow={onFollow}
                onOpenProfile={setSlideProfileId}
                onMessage={onMessage}
              />
            ))
          )}
        </div>

        {/* Right rail */}
        <PeopleToFollow
          onFollow={onFollow}
          onMessage={onMessage}
          onOpenProfile={setSlideProfileId}
          followVersion={followVersion}
        />
      </div>

      <MemberProfileSlideOver
        profileId={slideProfileId}
        onClose={() => setSlideProfileId(null)}
        onFollow={onFollow}
        onMessage={onMessage}
      />
    </>
  );
}
