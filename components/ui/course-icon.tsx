import {
  BarChart3,
  Bot,
  Brain,
  ClipboardList,
  Code2,
  Cpu,
  Eye,
  GraduationCap,
  Network,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CourseIcon — one vector icon per course slug (replaces DB emoji in the UI).
// Emoji render differently per OS and can't be themed; Lucide gives one stroke
// weight and takes the course accent colour.
// ═══════════════════════════════════════════════════════════════════════════════

const ICONS: Record<string, LucideIcon> = {
  "agentic-ai":              Bot,
  "generative-ai":           Sparkles,
  "machine-learning":        Brain,
  "artificial-intelligence": Cpu,
  "cybersecurity":           ShieldCheck,
  "data-science":            BarChart3,
  "fullstack-development":   Code2,
  "computer-vision":         Eye,
  "llm-agent-architect":     Network,
  "ai-product-management":   ClipboardList,
};

export function CourseIcon({
  slug,
  size = 22,
  color,
  className,
}: {
  slug: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  const Icon = ICONS[slug] ?? GraduationCap;
  return <Icon size={size} strokeWidth={2} style={color ? { color } : undefined} className={className} aria-hidden />;
}
