"use client";

import { useState } from "react";

interface MessageAuthor {
  id: string;
  avatar_url: string | null;
  bio: string | null;
}

interface MessageAttachment {
  id: string;
  file_url: string;
  file_type: "image" | "file";
  file_name: string;
  mime_type?: string;
}

interface CommunityMessageProps {
  id: string;
  content: string;
  author: MessageAuthor;
  createdAt: string;
  editedAt: string | null;
  isDeleted: boolean;
  isOwn: boolean;
  attachments?: MessageAttachment[];
  mentionedProfileIds?: string[];
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
}

export function CommunityMessage({
  id,
  content,
  author,
  createdAt,
  editedAt,
  isDeleted,
  isOwn,
  attachments = [],
  mentionedProfileIds = [],
  onEdit,
  onDelete,
}: CommunityMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = async () => {
    if (!onEdit || !editedContent.trim()) return;

    try {
      await onEdit(id, editedContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !window.confirm("Are you sure you want to delete this message?"))
      return;

    try {
      setIsDeleting(true);
      await onDelete(id);
    } catch (error) {
      console.error("Failed to delete message:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Parse markdown-like formatting
  const renderContent = (text: string) => {
    let parsed = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>");

    return (
      <p
        className="text-sm text-ink whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: parsed }}
      />
    );
  };

  if (isDeleted) {
    return (
      <div className="p-3 rounded-lg bg-surface border border-border text-center">
        <p className="text-xs text-ink-muted italic">Message deleted</p>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-lg bg-surface border border-border hover:border-brand/20 transition-colors group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Author info */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white font-bold shrink-0">
          {author.avatar_url ? (
            <img
              src={author.avatar_url}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            "M"
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 justify-between">
            <p className="text-sm font-semibold text-ink">
              {author.bio || `User ${author.id.slice(0, 8)}`}
            </p>

            {/* Edit/Delete Actions */}
            {isOwn && showActions && (
              <div className="flex gap-1">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs px-2 py-1 rounded bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-xs px-2 py-1 rounded bg-red-10 text-red-600 hover:bg-red-/20 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-ink-muted">
            {new Date(createdAt).toLocaleString()}
            {editedAt && ` (edited ${new Date(editedAt).toLocaleString()})`}
          </p>
        </div>
      </div>

      {/* Message content */}
      <div className="mt-2 ml-11">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 rounded border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="text-xs px-3 py-1 rounded bg-brand text-white hover:bg-brand/90 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(content);
                }}
                className="text-xs px-3 py-1 rounded bg-surface border border-border hover:border-brand/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {renderContent(content)}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((attachment) =>
                  attachment.file_type === "image" ? (
                    <img
                      key={attachment.id}
                      src={attachment.file_url}
                      alt={attachment.file_name}
                      className="max-w-xs rounded-lg max-h-80 object-cover"
                    />
                  ) : (
                    <a
                      key={attachment.id}
                      href={attachment.file_url}
                      download={attachment.file_name}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                      </svg>
                      <span className="text-xs font-medium">{attachment.file_name}</span>
                    </a>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
