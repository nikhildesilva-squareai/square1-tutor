"use client";

import { useState, useEffect } from "react";

interface Rule {
  id: string;
  rule_text: string;
  rule_description: string | null;
  rule_category: string;
  order_index: number;
}

interface CommunityRulesDisplayProps {
  communityId: string;
  showHeader?: boolean;
}

const categoryIcons: Record<string, string> = {
  conduct: "👥",
  spam: "🚫",
  respect: "🤝",
  legal: "⚖️",
  other: "📋",
};

export function CommunityRulesDisplay({
  communityId,
  showHeader = true,
}: CommunityRulesDisplayProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, [communityId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/communities/${communityId}/rules`);

      if (!response.ok) throw new Error("Failed to fetch rules");

      const data = await response.json();
      setRules(data.rules || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <svg
          className="animate-spin h-6 w-6 text-brand mx-auto"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-surface border border-border text-center">
        <p className="text-sm text-ink-muted">
          No rules have been set for this community yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-ink mb-2">Community Rules</h2>
          <p className="text-sm text-ink-muted">
            Please follow these guidelines to maintain a positive community
          </p>
        </div>
      )}

      <div className="space-y-3">
        {rules.map((rule, idx) => (
          <div
            key={rule.id}
            className="p-4 rounded-lg bg-surface border border-border hover:border-brand/20 transition-colors"
          >
            <div className="flex gap-3">
              <div className="text-2xl shrink-0">
                {categoryIcons[rule.rule_category] || "📋"}
              </div>

              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-bold text-ink">
                    {idx + 1}. {rule.rule_text}
                  </h3>
                  <span className="text-xs font-medium text-brand/70 bg-brand/5 px-2 py-0.5 rounded">
                    {rule.rule_category}
                  </span>
                </div>

                {rule.rule_description && (
                  <p className="text-sm text-ink-muted mt-2">
                    {rule.rule_description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-brand/5 border border-brand/10">
        <p className="text-xs text-brand text-center">
          ⚠️ Violations of these rules may result in muting, removal, or
          banning from the community.
        </p>
      </div>
    </div>
  );
}
