"use client";

import { useCallback, useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo/mercator";

export type LocationStatus = "locating" | "live" | "manual" | "denied" | "unavailable";

export interface LocationState {
  status: LocationStatus;
  position: LatLng | null;
  accuracyM: number | null;
  /** Pick a place by hand (from "CHOOSE A PLACE" or ?at=lat,lng). */
  choosePlace: (p: LatLng | null) => void;
}

const PLACE_KEY = "naturedex:place";

function readManual(): LatLng | null {
  const at = new URLSearchParams(window.location.search).get("at");
  const parse = (s: string | null) => {
    const [lat, lng] = (s ?? "").split(",").map(Number);
    return Number.isFinite(lat) && Number.isFinite(lng) && s ? { lat, lng } : null;
  };
  try {
    return parse(at) ?? parse(sessionStorage.getItem(PLACE_KEY));
  } catch {
    return parse(at);
  }
}

export function useLocation(): LocationState {
  // Browser-only hook: MapScreen is rendered client-side, so reading storage here is safe.
  const [manual, setManual] = useState<LatLng | null>(readManual);
  const [live, setLive] = useState<{ p: LatLng; acc: number } | null>(null);
  const [status, setStatus] = useState<LocationStatus>(() =>
    manual ? "manual" : "geolocation" in navigator ? "locating" : "unavailable",
  );

  useEffect(() => {
    if (manual || !("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLive({ p: { lat: pos.coords.latitude, lng: pos.coords.longitude }, acc: pos.coords.accuracy });
        setStatus("live");
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [manual]);

  const choosePlace = useCallback((p: LatLng | null) => {
    try {
      if (p) sessionStorage.setItem(PLACE_KEY, `${p.lat},${p.lng}`);
      else sessionStorage.removeItem(PLACE_KEY);
    } catch {}
    setManual(p);
    setStatus(p ? "manual" : "locating");
  }, []);

  return {
    status,
    position: manual ?? live?.p ?? null,
    accuracyM: manual ? null : (live?.acc ?? null),
    choosePlace,
  };
}
