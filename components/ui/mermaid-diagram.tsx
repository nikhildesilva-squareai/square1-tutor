"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          themeVariables: {
            primaryColor: "#E5F0FF",
            primaryTextColor: "#0F172A",
            primaryBorderColor: "#0056CE",
            lineColor: "#94A3B8",
            secondaryColor: "#F8FAFC",
            tertiaryColor: "#D0FBED",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "13px",
          },
          flowchart: { curve: "basis", padding: 16 },
          sequence: { actorMargin: 50 },
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart.trim());
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Diagram could not be rendered");
          console.error("[MermaidDiagram]", err);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className={`rounded-xl border border-border bg-surface-alt p-4 text-xs text-ink-muted ${className}`}>
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`rounded-xl border border-border bg-surface p-6 flex items-center justify-center ${className}`}>
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-xl border border-border bg-surface p-4 overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// ─── Helper: extract mermaid blocks from markdown ─────────────────────────────
// Looks for ```mermaid ... ``` blocks in text and splits into text + diagrams
export function parseMermaidBlocks(markdown: string): Array<{ type: "text" | "mermaid"; content: string }> {
  const blocks: Array<{ type: "text" | "mermaid"; content: string }> = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    // Text before the mermaid block
    if (match.index > lastIndex) {
      const text = markdown.slice(lastIndex, match.index).trim();
      if (text) blocks.push({ type: "text", content: text });
    }
    // The mermaid block
    blocks.push({ type: "mermaid", content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last mermaid block
  if (lastIndex < markdown.length) {
    const text = markdown.slice(lastIndex).trim();
    if (text) blocks.push({ type: "text", content: text });
  }

  // If no mermaid blocks found, return the whole thing as text
  if (blocks.length === 0) {
    blocks.push({ type: "text", content: markdown });
  }

  return blocks;
}
