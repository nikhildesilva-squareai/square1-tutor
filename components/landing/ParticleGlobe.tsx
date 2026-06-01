"use client";
import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  particleCount?: number;
  radius?: number;
  color1?: string; // primary particle colour (hex)
  color2?: string; // accent particle colour (hex)
}

export function ParticleGlobe({
  className = "",
  particleCount = 1200,
  radius = 200,
  color1 = "#ffffff",
  color2 = "#0056CE",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: 0, y: 0 });
  const frameRef  = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Generate Fibonacci sphere points ──────────────────────────────────
    // Fibonacci lattice distributes N points evenly on a unit sphere
    const golden = (1 + Math.sqrt(5)) / 2;
    const pts = Array.from({ length: particleCount }, (_, i) => {
      const phi   = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = 2 * Math.PI * i / golden;
      return {
        ox: Math.sin(phi) * Math.cos(theta), // original unit coords
        oy: Math.sin(phi) * Math.sin(theta),
        oz: Math.cos(phi),
        // ~20% brand blue, rest white/silver
        isAccent: i % 5 === 0,
      };
    });

    let rotY = 0;    // auto-rotation angle
    let tiltX = 0;   // mouse-driven tilt

    // ── Canvas resize ──────────────────────────────────────────────────────
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width  = canvas!.offsetWidth  * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Mouse tracking ────────────────────────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width  - 0.5,
        y: (e.clientY - rect.top)  / rect.height - 0.5,
      };
    }
    window.addEventListener("mousemove", onMouseMove);

    // ── Animation loop ────────────────────────────────────────────────────
    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      rotY  += 0.003; // slow graceful auto-rotate
      // Gently interpolate tilt toward mouse position
      tiltX += (mouseRef.current.y * 0.4 - tiltX) * 0.04;
      const tiltY = mouseRef.current.x * 0.4;

      const cx = w / 2;
      const cy = h / 2;
      const focal = 800; // perspective focal length

      // Project each point and sort by depth for painter's algorithm
      const projected = pts.map(p => {
        // 1. Scale by radius
        let x = p.ox * radius;
        let y = p.oy * radius;
        let z = p.oz * radius;

        // 2. Rotate Y (auto-spin)
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        const nx = x * cosY + z * sinY;
        const nz = -x * sinY + z * cosY;
        x = nx; z = nz;

        // 3. Rotate X (mouse tilt)
        const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
        const ny = y * cosX - z * sinX;
        const nz2 = y * sinX + z * cosX;
        y = ny; z = nz2;

        // 4. Rotate Z (slight mouse tilt on Z)
        const cosZ = Math.cos(tiltY * 0.3), sinZ = Math.sin(tiltY * 0.3);
        const nnx = x * cosZ - y * sinZ;
        const nny = x * sinZ + y * cosZ;
        x = nnx; y = nny;

        // 5. Perspective project
        const scale = focal / (focal + z);
        const x2d = cx + x * scale;
        const y2d = cy + y * scale;

        // Depth-based appearance
        const depth   = (z + radius) / (2 * radius); // 0 = back, 1 = front
        const dotSize = 0.5 + depth * 1.8;
        const opacity = 0.1 + depth * 0.75;

        return { x2d, y2d, dotSize, opacity, isAccent: p.isAccent, depth };
      });

      // Sort back-to-front so front particles draw on top
      projected.sort((a, b) => a.depth - b.depth);

      // Draw particles
      projected.forEach(p => {
        ctx!.beginPath();
        ctx!.arc(p.x2d, p.y2d, Math.max(0.3, p.dotSize), 0, Math.PI * 2);

        if (p.isAccent) {
          // Brand blue accent particles
          const r = parseInt(color2.slice(1, 3), 16);
          const g = parseInt(color2.slice(3, 5), 16);
          const b = parseInt(color2.slice(5, 7), 16);
          ctx!.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
        } else {
          // White/silver particles
          const v = Math.round(180 + p.depth * 75); // 180–255
          ctx!.fillStyle = `rgba(${v},${v},${v},${p.opacity * 0.85})`;
        }
        ctx!.fill();
      });

      frameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [particleCount, radius, color1, color2]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
