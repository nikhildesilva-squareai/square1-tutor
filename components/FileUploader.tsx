"use client";

import { useState, useRef } from "react";

interface UploadedFile {
  filename: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxTotalSize?: number; // in MB
}

export function FileUploader({
  onFilesUploaded,
  maxFiles = 5,
  maxTotalSize = 100,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    try {
      setError(null);
      setProgress(0);

      // Validate file count
      if (files.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`);
      }

      // Validate total size
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > maxTotalSize * 1024 * 1024) {
        throw new Error(`Total size must not exceed ${maxTotalSize}MB`);
      }

      setUploading(true);
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setProgress(100);

      // Notify parent component
      onFilesUploaded(data.files);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reset progress after delay
      setTimeout(() => setProgress(0), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-2">
      {/* Drag-drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`p-4 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? "border-brand bg-brand/5"
            : "border-border bg-white/50 hover:border-brand"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full text-center py-4 disabled:opacity-50"
        >
          <div className="text-2xl mb-2">📁</div>
          <p className="text-sm font-semibold text-ink">
            {uploading ? "Uploading..." : "Drag files here or click to select"}
          </p>
          <p className="text-xs text-ink-muted mt-1">
            Max {maxFiles} files, {maxTotalSize}MB total
          </p>
        </button>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
