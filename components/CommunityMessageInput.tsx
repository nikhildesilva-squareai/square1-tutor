"use client";

import { useState, useRef } from "react";
import { FileUploader } from "./FileUploader";

interface UploadedFile {
  filename: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

interface CommunityProfile {
  id: string;
  bio: string | null;
}

interface CommunityMessageInputProps {
  communityId: string;
  currentUserProfile: CommunityProfile;
  communityMembers: CommunityProfile[];
  onMessageSent: (message: any) => void;
  isLoading?: boolean;
}

export function CommunityMessageInput({
  communityId,
  currentUserProfile,
  communityMembers,
  onMessageSent,
  isLoading = false,
}: CommunityMessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionStartPos = useRef(0);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    // Check for @ mention
    const lastAt = text.lastIndexOf("@");
    if (lastAt !== -1) {
      const afterAt = text.substring(lastAt + 1);
      if (!afterAt.includes(" ")) {
        setMentionQuery(afterAt);
        mentionStartPos.current = lastAt;
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const filteredMembers = communityMembers.filter(
    (member) =>
      member.id !== currentUserProfile.id &&
      (member.bio?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        mentionQuery === "")
  );

  const applyFormat = (format: "bold" | "italic" | "code") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        formattedText = `_${selectedText || "italic text"}_`;
        break;
      case "code":
        formattedText = `\`${selectedText || "code"}\``;
        break;
    }

    const newContent = beforeText + formattedText + afterText;
    setContent(newContent);

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const cursorPos = start + formattedText.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  const selectMention = (memberId: string) => {
    const member = communityMembers.find((m) => m.id === memberId);
    if (!member) return;

    const mentionName = member.bio || memberId.slice(0, 8);
    const beforeAt = content.substring(0, mentionStartPos.current);
    const afterMention = content.substring(mentionStartPos.current + mentionQuery.length + 1);

    const newContent = `${beforeAt}@${mentionName} ${afterMention}`;
    setContent(newContent);
    setSelectedMentions([...selectedMentions, memberId]);
    setShowMentions(false);
    setMentionQuery("");

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSendMessage = async () => {
    if (!content.trim() && uploadedFiles.length === 0) return;

    try {
      setSending(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            mentions: selectedMentions,
            attachments: uploadedFiles.map((file) => ({
              file_url: file.fileUrl,
              file_type: file.fileType,
              file_size: file.fileSize,
              original_filename: file.filename,
            })),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      const { message } = await response.json();
      onMessageSent(message);

      // Clear input
      setContent("");
      setSelectedMentions([]);
      setUploadedFiles([]);
      setShowMentions(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border pt-4">
      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* File Uploader */}
        <FileUploader
          onFilesUploaded={(files) => setUploadedFiles([...uploadedFiles, ...files])}
          maxFiles={5}
          maxTotalSize={100}
        />

        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-ink-muted">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} attached
            </p>
            <div className="space-y-1">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/50 border border-border text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">📎</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-ink truncate">{file.filename}</p>
                      <p className="text-ink-muted text-[10px]">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setUploadedFiles(
                        uploadedFiles.filter((_, i) => i !== index)
                      )
                    }
                    className="ml-2 text-ink-muted hover:text-ink transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className="space-y-2">
          {/* Formatting Toolbar */}
        <div className="flex gap-1 p-2 bg-surface rounded-lg border border-border">
          <button
            onClick={() => applyFormat("bold")}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Bold (Cmd+B)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4v16h9a5 5 0 0 0 0-10H9V4H6zm3 3h6a2 2 0 0 1 0 4H9V7zm6 6H9v4h6a2 2 0 0 0 0-4z" />
            </svg>
          </button>

          <button
            onClick={() => applyFormat("italic")}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Italic (Cmd+I)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z" />
            </svg>
          </button>

          <button
            onClick={() => applyFormat("code")}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Code"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L6.6 6 0 12l6.6 6 2.8-2.4zm5.2 0l4.6-4.6-4.6-4.6 2.8-2.8L24 12l-6.6 6 2.8 2.4z" />
            </svg>
          </button>
        </div>

        {/* Message Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Type @ to mention someone... Use **bold**, _italic_, `code`"
            className="w-full p-3 rounded-lg border border-border bg-surface text-ink resize-none focus:outline-none focus:ring-2 focus:ring-brand/50"
            rows={3}
            disabled={sending || isLoading}
          />

          {/* Mention Suggestions */}
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
              {filteredMembers.slice(0, 5).map((member) => (
                <button
                  key={member.id}
                  onClick={() => selectMention(member.id)}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors text-sm"
                >
                  <span className="font-semibold text-ink">
                    @{member.bio || member.id.slice(0, 8)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Mentions Display */}
        {selectedMentions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedMentions.map((mentionId) => {
              const member = communityMembers.find((m) => m.id === mentionId);
              return (
                <div
                  key={mentionId}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand/10 border border-brand/20 text-xs text-brand"
                >
                  @{member?.bio || mentionId.slice(0, 8)}
                  <button
                    onClick={() =>
                      setSelectedMentions(
                        selectedMentions.filter((id) => id !== mentionId)
                      )
                    }
                    className="ml-1 hover:text-brand/70"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={(!content.trim() && uploadedFiles.length === 0) || sending || isLoading}
            className="w-full px-4 py-2 rounded-lg bg-brand text-white font-semibold text-sm hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </div>
    </div>
  );
}
