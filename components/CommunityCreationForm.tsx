"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateType } from "@/types/database";

const TEMPLATES: { value: TemplateType; label: string; description: string }[] = [
  { value: "project", label: "Project Group", description: "Collaborate on projects, share code & designs" },
  { value: "research", label: "Research Group", description: "Deep dive into topics, share findings" },
  { value: "company", label: "Launching a Company", description: "Build a startup together" },
  { value: "opensource", label: "Open Source Project", description: "Contribute to open source" },
  { value: "cohort", label: "Learning Cohort", description: "Study and learn together" },
];

const CATEGORIES = [
  "Tech",
  "AI/ML",
  "Data Science",
  "Cloud",
  "DevOps",
  "Startup",
  "Founder",
  "Product",
  "Research",
  "Academic",
  "Health",
  "Finance",
  "Education",
  "Hobbies",
  "Other",
];

interface CommunityCreationFormProps {
  onSuccess?: (communityId: string, communityName: string) => void;
  onCancel?: () => void;
}

export function CommunityCreationForm({ onSuccess, onCancel }: CommunityCreationFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    template_type: "project" as TemplateType,
    description: "",
    category: "Tech",
    is_private: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create community");
      }

      const data = await response.json();
      const communityId = data.community.id;

      // Show success toast and redirect
      onSuccess?.(communityId, formData.name);

      // Redirect to community page
      router.push(`/community/${data.community.slug}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const charCount = formData.description.length;
  const charLimit = 500;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Community Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-ink mb-2">
          Community Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., AI Ethics Book Club"
          maxLength={60}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
        <p className="text-xs text-ink-muted mt-1">{formData.name.length}/60 characters</p>
      </div>

      {/* Template */}
      <div>
        <label htmlFor="template_type" className="block text-sm font-semibold text-ink mb-3">
          Community Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((template) => (
            <label
              key={template.value}
              className={`relative flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                formData.template_type === template.value
                  ? "border-brand bg-brand/5"
                  : "border-border bg-surface hover:border-brand/30"
              }`}
            >
              <input
                type="radio"
                name="template_type"
                value={template.value}
                checked={formData.template_type === template.value}
                onChange={handleChange}
                className="mt-0.5"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-ink">{template.label}</p>
                <p className="text-xs text-ink-muted mt-0.5">{template.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-semibold text-ink mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-ink mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="What's this community about? (optional)"
          maxLength={charLimit}
          rows={4}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-ink-muted">Brief description to help people discover your community</p>
          <p className={`text-xs font-medium ${charCount > charLimit * 0.9 ? "text-amber-600" : "text-ink-muted"}`}>
            {charCount}/{charLimit}
          </p>
        </div>
      </div>

      {/* Privacy */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-alt">
        <input
          type="checkbox"
          id="is_private"
          name="is_private"
          checked={formData.is_private}
          onChange={handleChange}
          className="w-4 h-4 rounded border-border cursor-pointer"
        />
        <div className="flex-1">
          <label htmlFor="is_private" className="text-sm font-semibold text-ink cursor-pointer">
            Private Community
          </label>
          <p className="text-xs text-ink-muted mt-0.5">
            {formData.is_private
              ? "Only you can create it. You'll invite members manually."
              : "Public community. Members auto-discovered from courses/skills."}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-2.5 rounded-lg bg-brand text-white font-semibold text-sm hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v0a8 8 0 100 16v0a8 8 0 01-8-8z" />
              </svg>
              Creating...
            </span>
          ) : (
            "Create Community"
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-surface-alt text-ink font-semibold text-sm hover:bg-surface-alt/80 disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-900">
          <span className="font-semibold">💡 Tip:</span> Public communities will automatically invite relevant members based on their course enrollment and skills. Private communities are invite-only.
        </p>
      </div>
    </form>
  );
}
