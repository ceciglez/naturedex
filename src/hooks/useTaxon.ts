"use client";

import { useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo/mercator";
import type { TaxonDetails } from "@/lib/inat/types";

const cache = new Map<string, Promise<TaxonDetails>>();

export function fetchTaxon(id: number, near: LatLng | null): Promise<TaxonDetails> {
  const q = near ? `?lat=${near.lat.toFixed(1)}&lng=${near.lng.toFixed(1)}` : "";
  const key = `${id}${q}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/api/inat/taxon/${id}${q}`).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<TaxonDetails>;
    });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

/** Species details from iNaturalist, falling back to a cached copy (e.g. from the Dex) when offline. */
export function useTaxon(id: number | null, near: LatLng | null, fallback?: TaxonDetails) {
  const [state, setState] = useState<{ id: number | null; data?: TaxonDetails; error?: boolean }>({ id: null });
  const nearKey = near ? `${near.lat.toFixed(1)},${near.lng.toFixed(1)}` : "";

  useEffect(() => {
    if (id === null) return;
    let live = true;
    fetchTaxon(id, near).then(
      (data) => live && setState({ id, data }),
      () => live && setState({ id, error: true }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, nearKey]);

  const current = state.id === id ? state : { id };
  return { data: current.data ?? fallback, error: Boolean(current.error), loading: !current.data && !current.error };
}
