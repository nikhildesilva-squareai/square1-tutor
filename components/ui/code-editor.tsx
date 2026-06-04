"use client";

import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { indentWithTab } from "@codemirror/commands";
import { lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, highlightActiveLine } from "@codemirror/view";
import { foldGutter, indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { history, historyKeymap, defaultKeymap } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "python" | "typescript" | "javascript";
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "python",
  placeholder = "Write your code here...",
  readOnly = false,
  minHeight = "200px",
  className = "",
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep the callback ref up to date
  onChangeRef.current = onChange;

  const getLanguageExtension = useCallback(() => {
    switch (language) {
      case "python":
        return python();
      case "typescript":
      case "javascript":
        return javascript({ typescript: language === "typescript" });
      default:
        return python();
    }
  }, [language]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing editor
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
        getLanguageExtension(),
        oneDark,
        keymap.of([indentWithTab]),
        cmPlaceholder(placeholder),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": {
            fontSize: "13px",
            minHeight,
            borderRadius: "12px",
            overflow: "hidden",
          },
          ".cm-scroller": {
            fontFamily: "var(--font-geist-mono), 'JetBrains Mono', ui-monospace, monospace",
            padding: "12px 0",
          },
          ".cm-content": {
            padding: "0 16px",
          },
          ".cm-gutters": {
            borderRight: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "transparent",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "rgba(255,255,255,0.04)",
          },
          ".cm-activeLine": {
            backgroundColor: "rgba(255,255,255,0.03)",
          },
          ".cm-cursor": {
            borderLeftColor: "#0056CE",
            borderLeftWidth: "2px",
          },
          ".cm-selectionBackground": {
            backgroundColor: "rgba(0,86,206,0.25) !important",
          },
          "&.cm-focused .cm-selectionBackground": {
            backgroundColor: "rgba(0,86,206,0.3) !important",
          },
        }),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, readOnly]);

  // Update content when value changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden border border-white/10 ${className}`}
      style={{
        background: "#282c34",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    />
  );
}
