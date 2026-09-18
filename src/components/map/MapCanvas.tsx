"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { LatLng } from "@/lib/geo/mercator";
import { MAX_ZOOM, MIN_ZOOM, type MapEngine, type Viewport } from "@/lib/map/engine";

interface MapCanvasProps {
  engine: MapEngine;
  center: LatLng;
  zoom: number;
  onZoom: (zoom: number) => void;
  onViewport: (vp: Viewport & { cssWidth: number; cssHeight: number }) => void;
  children?: ReactNode;
}

/** Pixel map canvas. Redraws on demand; pinch, wheel and +/- keys step between zoom levels. */
export function MapCanvas({ engine, center, zoom, onZoom, onViewport, children }: MapCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vpRef = useRef<Viewport | null>(null);
  const frame = useRef(0);
  const stateRef = useRef({ center, zoom });

  // Draw whenever inputs change or new chunks land.
  useEffect(() => {
    stateRef.current = { center, zoom };
    const draw = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current, vp = vpRef.current;
        if (!canvas || !vp) return;
        const ctx = canvas.getContext("2d");
        if (ctx) engine.draw(ctx, stateRef.current.center, stateRef.current.zoom, vp);
      });
    };
    draw();
    const unsub = engine.subscribe(draw);
    return () => {
      unsub();
      cancelAnimationFrame(frame.current);
    };
  }, [engine, center, zoom]);

  // Keep the canvas backing store matched to its CSS size × devicePixelRatio.
  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = wrap.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const vp = { width: canvas.width, height: canvas.height, dpr };
      vpRef.current = vp;
      onViewport({ ...vp, cssWidth: width, cssHeight: height });
      const ctx = canvas.getContext("2d");
      if (ctx) engine.draw(ctx, stateRef.current.center, stateRef.current.zoom, vp);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [engine, onViewport]);

  // Zoom gestures.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const step = (dir: 1 | -1) => {
      const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, stateRef.current.zoom + dir));
      if (z !== stateRef.current.zoom) onZoom(z);
    };

    let wheelLock = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      if (now < wheelLock || Math.abs(e.deltaY) < 4) return;
      wheelLock = now + 250;
      step(e.deltaY < 0 ? 1 : -1);
    };

    const pointers = new Map<number, { x: number; y: number }>();
    let pinchStart = 0;
    const spread = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const onDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) pinchStart = spread();
    };
    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size !== 2 || !pinchStart) return;
      const ratio = spread() / pinchStart;
      if (ratio > 1.35 || ratio < 0.74) {
        step(ratio > 1 ? 1 : -1);
        pinchStart = spread();
      }
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStart = 0;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "+" || e.key === "=") step(1);
      if (e.key === "-" || e.key === "_") step(-1);
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [onZoom]);

  return (
    <div ref={wrapRef} className="absolute inset-0 touch-none overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Pixel map of your surroundings" role="img" />
      {children}
    </div>
  );
}
