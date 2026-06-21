"use client";

import { useEffect, useRef } from "react";

// ─── NeuralField — a subtle, cursor-aware "neural network" canvas ─────────────
// Drifting nodes connected by faint lines; lines reach toward the cursor when it's
// over the host. Decorative only (pointer-events-none). Performance-minded:
//   • node count scales to the panel area (capped)
//   • animation pauses when the host scrolls off-screen (IntersectionObserver)
//   • honours prefers-reduced-motion (renders a single static frame, no loop)
// Place inside a `position: relative` host; render content above it with z-10.

interface NeuralFieldProps {
  className?: string;
  /** node + line colour (CSS colour string) */
  color?: string;
  /** hard cap on node count */
  maxNodes?: number;
}

export function NeuralField({ className = "", color = "#3388FF", maxNodes = 64 }: NeuralFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const LINK = 110; // px distance to draw a node-to-node line
    const REACH = 150; // px distance for cursor "reach" lines

    let w = 0, h = 0, raf = 0, running = false;
    type Node = { x: number; y: number; vx: number; vy: number };
    let nodes: Node[] = [];
    const mouse = { x: -9999, y: -9999, on: false };

    const resize = () => {
      const r = parent.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.max(6, Math.min(maxNodes, Math.round((w * h) / 9000)));
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!reduce) {
          a.x += a.vx; a.y += a.vy;
          if (a.x <= 0 || a.x >= w) a.vx *= -1;
          if (a.y <= 0 || a.y >= h) a.vy *= -1;
        }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.globalAlpha = (1 - d / LINK) * 0.18;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (mouse.on) {
          const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (d < REACH) {
            ctx.globalAlpha = (1 - d / REACH) * 0.5;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = color;
      for (const n of nodes) { ctx.beginPath(); ctx.arc(n.x, n.y, 1.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (running && !reduce) raf = requestAnimationFrame(draw);
    };

    const start = () => { if (running) return; running = true; if (reduce) draw(); else raf = requestAnimationFrame(draw); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      mouse.on = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      mouse.x = x; mouse.y = y;
    };
    const clearMouse = () => { mouse.on = false; };

    resize();
    draw(); // initial frame (also the static frame for reduced-motion)

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    const io = new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(parent);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", clearMouse);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", clearMouse);
    };
  }, [color, maxNodes]);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none absolute inset-0 z-0 ${className}`} />;
}
