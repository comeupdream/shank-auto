"use client";

/**
 * Interactive 3D wireframe coupe — the hero showpiece. No libraries: the
 * geometry is generated procedurally (a coupe profile extruded to two body
 * sides, wheel rings, axles), rotated and perspective-projected by hand,
 * and drawn as depth-shaded ice-blue lines on a canvas.
 *
 * It idles at a slow turn; drag (or touch-drag) to spin it with inertia.
 * The loop pauses when the canvas is offscreen, and prefers-reduced-motion
 * stops the idle spin (dragging still works — that motion is the user's).
 */

import { useEffect, useRef } from "react";

type V3 = [number, number, number];
type Edge = [number, number];

function buildCar(): { verts: V3[]; edges: Edge[] } {
  // Coupe side profile with a real greenhouse: front bumper → hood →
  // windshield → roof → rear glass → trunk → tail, in x (length) / y (up).
  const profile: [number, number][] = [
    [-100, 8], [-100, 24], [-92, 31], [-30, 34], [-8, 58],
    [34, 58], [62, 40], [96, 32], [100, 22], [100, 8],
  ];
  const w = 36; // half body width
  const verts: V3[] = [];
  const edges: Edge[] = [];
  const n = profile.length;

  // Two body sides.
  for (const side of [-1, 1]) {
    const base = verts.length;
    for (const [x, y] of profile) verts.push([x, y, side * w]);
    for (let i = 0; i < n - 1; i++) edges.push([base + i, base + i + 1]);
    edges.push([base, base + n - 1]); // rocker line
    // Door line: beltline down to the rocker.
    const d0 = verts.length;
    verts.push([-6, 34, side * w], [-6, 8, side * w]);
    edges.push([d0, d0 + 1]);
  }
  // Cross members tying the sides together (bumpers, cowl, roof, deck).
  const sideStride = n + 2; // profile + the 2 door-line verts
  for (const i of [0, 1, 2, 3, 4, 5, 6, 8, 9]) edges.push([i, i + sideStride]);

  // Wheels: double rings (tire + rim) at each corner.
  const wheelR = 17;
  const axleY = 17;
  for (const wx of [-60, 62]) {
    for (const side of [-1, 1]) {
      for (const r of [wheelR, wheelR * 0.55]) {
        const base = verts.length;
        const segs = 14;
        for (let i = 0; i < segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          verts.push([wx + Math.cos(a) * r, axleY + Math.sin(a) * r, side * (w + 2)]);
        }
        for (let i = 0; i < segs; i++) edges.push([base + i, base + ((i + 1) % segs)]);
      }
    }
    // Axle.
    const a1 = verts.length;
    verts.push([wx, axleY, -(w + 2)], [wx, axleY, w + 2]);
    edges.push([a1, a1 + 1]);
  }

  // Center vertically and flip y: model y grows up, screen y grows down.
  const cy = 30;
  return { verts: verts.map(([x, y, z]) => [x, cy - y, z] as V3), edges };
}

export default function WireCar({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { verts, edges } = buildCar();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let yaw = 0.7;
    let vel = reduced ? 0 : 0.004;
    const IDLE = reduced ? 0 : 0.004;
    let dragging = false;
    let lastX = 0;
    let visible = true;
    let raf = 0;

    const pitch = 0.3; // fixed camera tilt

    function draw() {
      const el = canvas as HTMLCanvasElement;
      const c = ctx as CanvasRenderingContext2D;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const wpx = el.clientWidth;
      const hpx = el.clientHeight;
      if (el.width !== wpx * dpr || el.height !== hpx * dpr) {
        el.width = wpx * dpr;
        el.height = hpx * dpr;
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, wpx, hpx);

      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const scale = Math.min(wpx, hpx * 1.6) / 240;
      const cxm = wpx / 2, cym = hpx / 2 + 6;

      const pts = verts.map(([x, y, z]) => {
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        const y2 = y * cp - z1 * sp;
        const z2 = y * sp + z1 * cp;
        const persp = 340 / (340 + z2);
        return [cxm + x1 * scale * persp, cym + y2 * scale * persp, z2] as V3;
      });

      for (const [a, b] of edges) {
        const [x1, y1, z1] = pts[a];
        const [x2, y2, z2] = pts[b];
        const depth = (z1 + z2) / 2;
        const alpha = 0.9 - Math.max(0, Math.min(0.62, (depth + 60) / 260));
        c.strokeStyle = `rgba(163, 196, 232, ${alpha.toFixed(3)})`;
        c.lineWidth = depth < 0 ? 1.6 : 1;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
      }

      // Ground shadow ellipse.
      c.strokeStyle = "rgba(163,196,232,0.14)";
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(cxm, cym + 62 * scale, 105 * scale, 20 * scale, 0, 0, Math.PI * 2);
      c.stroke();
    }

    function tick() {
      if (!dragging) {
        yaw += vel;
        // Ease back toward the idle speed after a fling.
        vel += (IDLE - vel) * 0.02;
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      yaw += dx * 0.008;
      vel = dx * 0.0035;
      draw();
    };
    const onUp = () => {
      dragging = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const io = new IntersectionObserver(([entry]) => {
      const nowVisible = entry.isIntersecting;
      if (nowVisible && !visible) raf = requestAnimationFrame(tick);
      if (!nowVisible) cancelAnimationFrame(raf);
      visible = nowVisible;
    });
    io.observe(canvas);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Interactive 3D wireframe car — drag to spin"
      className={`h-full w-full cursor-grab touch-pan-y active:cursor-grabbing ${className}`}
    />
  );
}
