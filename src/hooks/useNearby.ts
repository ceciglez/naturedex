"use client";

import { useCallback, useEffect, useState } from "react";
import { distanceM, type LatLng } from "@/lib/geo/mercator";
import type { NearbyObservation, NearbyResponse } from "@/lib/inat/types";

export type NearbyStatus = "idle" | "loading" | "ready" | "error";

/** Refetch once the player has walked this far from the last search centre. */
const REFETCH_M = 150;

interface Query {
  center: LatLng;
  attempt: number;
}

export function useNearby(position: LatLng | null) {
  const [query, setQuery] = useState<Query | null>(null);
  const [observations, setObservations] = useState<NearbyObservation[]>([]);
  const [status, setStatus] = useState<NearbyStatus>("idle");
  const [syncedAt, setSyncedAt] = useState<number | null>(null);

  // Move the search centre when the player walks far enough (derived during render).
  if (position && (!query || distanceM(query.center, position) > REFETCH_M)) {
    setQuery({ center: position, attempt: query?.attempt ?? 0 });
  }

  useEffect(() => {
    if (!query) return;
    const ctrl = new AbortController();
    const { lat, lng } = query.center;
    fetch(`/api/inat/nearby?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<NearbyResponse>;
      })
      .then((data) => {
        setObservations(data.observations);
        setStatus("ready");
        setSyncedAt(Date.now());
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        console.warn("nearby", err);
        setStatus("error");
      });
    return () => ctrl.abort();
  }, [query]);

  const retry = useCallback(() => {
    setStatus("loading");
    setQuery((q) => (q ? { ...q, attempt: q.attempt + 1 } : q));
  }, []);

  return { observations, status: query && status === "idle" ? "loading" : status, syncedAt, retry };
}
