"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Tone } from "@/lib/map/palette";
import { TONE_KEY } from "@/lib/tone";

function read(): Tone {
  return document.documentElement.dataset.tone === "mono" ? "mono" : "color";
}

function subscribe(fn: () => void) {
  const obs = new MutationObserver(fn);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tone"] });
  return () => obs.disconnect();
}

/** Colour / 1-bit tone, stored on <html data-tone> and remembered per device. */
export function useTone(): [Tone, (t: Tone) => void] {
  const tone = useSyncExternalStore(subscribe, read, () => "color" as Tone);
  const setTone = useCallback((t: Tone) => {
    document.documentElement.dataset.tone = t;
    try {
      localStorage.setItem(TONE_KEY, t);
    } catch {}
  }, []);
  return [tone, setTone];
}
