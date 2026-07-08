// Shared shapes for the community Post feed (mirror the /api/posts response).

export interface FeedAuthor {
  profileId: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
}

export interface RepoAttachment {
  id?: string;
  kind: "repo";
  owner: string;
  name: string;
  url: string;
  description?: string;
  language?: string;
  languageColor?: string;
  stars?: number;
  forks?: number;
}

export interface NotesAttachment {
  id?: string;
  kind: "notes";
  topic: string;
  course: string;
  preview?: string;
}

export interface MediaAttachment {
  id?: string;
  kind: "image" | "video" | "document";
  url: string;
  name?: string;
  size?: number;
  length?: string;
  mimeType?: string;
}

export interface ProjectAttachment {
  id?: string;
  kind: "project";
  submissionId?: string;
  title: string;
  description?: string;
  techStack?: string[];
  score?: number;
  maxScore?: number;
  githubUrl?: string;
  liveUrl?: string;
}

export type Attachment =
  | RepoAttachment
  | NotesAttachment
  | MediaAttachment
  | ProjectAttachment;

export interface FeedPost {
  id: string;
  authorProfileId: string;
  author: FeedAuthor;
  meta: string;
  text: string;
  createdAt: string;
  editedAt: string | null;
  attachments: Attachment[];
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  collabCount: number;
  collabByMe: boolean;
  followsAuthor: boolean;
  isSelf: boolean;
}

export interface SuggestedMember {
  profileId: string;
  name: string;
  initials: string;
  role: string;
  avatarUrl: string | null;
  followsThem: boolean;
}

export interface ProfileDetail {
  profileId: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  role: string;
  enrolled: string | null;
  bio: string;
  skills: string[];
  stats: { posts: number; followers: number };
  sharedNotes: { topic: string; course: string }[];
  followsThem: boolean;
  isSelf: boolean;
  submissionCount: number;
}
