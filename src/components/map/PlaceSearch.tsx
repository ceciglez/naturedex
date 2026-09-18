"use client";

import { useState, type FormEvent } from "react";
import type { LatLng } from "@/lib/geo/mercator";

interface Result {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/** "CHOOSE A PLACE": search OpenStreetMap's Nominatim (one request per submit, per its usage policy). */
export function PlaceSearch({ onChoose, onCancel }: { onChoose: (p: LatLng) => void; onCancel: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function search(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setError(false);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(q.trim())}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      setResults(await res.json());
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-[340px] flex-col gap-3">
      <h2 className="font-display text-[13px] text-ink">CHOOSE A PLACE</h2>
      <form onSubmit={search} className="flex border-[3px] border-ink bg-paper">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Park, town or address"
          aria-label="Place"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-body text-base text-ink outline-none placeholder:text-stone"
        />
        <button type="submit" disabled={busy} className="bg-sun px-3 font-display text-[10px] text-ink">
          {busy ? "…" : "GO"}
        </button>
      </form>
      {error && <p className="font-body text-[13px] text-rust">Couldn&apos;t search right now. Try again in a moment.</p>}
      {results && results.length === 0 && <p className="font-body text-[13px] text-ink">No places match that.</p>}
      <ul className="flex flex-col gap-2">
        {results?.map((r) => (
          <li key={r.place_id}>
            <button
              type="button"
              onClick={() => onChoose({ lat: Number(r.lat), lng: Number(r.lon) })}
              className="w-full border-2 border-shell-edge bg-paper px-3 py-2 text-left font-body text-[13px] leading-snug text-ink"
            >
              {r.display_name}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onCancel} className="self-start py-2 font-ui text-[10px] tracking-[1px] text-moss">
        ◀ BACK
      </button>
      <p className="font-ui text-[8px] text-stone">Search © OpenStreetMap contributors · Nominatim</p>
    </div>
  );
}
