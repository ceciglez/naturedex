"use client";

import dynamic from "next/dynamic";

// The map is canvas + GPS only, so it renders in the browser and skips server rendering.
export const MapScreenClient = dynamic(() => import("./MapScreen").then((m) => m.MapScreen), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center bg-lime">
      <p className="font-display text-xs text-ink">LOADING MAP…</p>
    </div>
  ),
});
