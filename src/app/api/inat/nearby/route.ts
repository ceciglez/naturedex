import type { NextRequest } from "next/server";
import type { NearbyObservation, NearbyResponse } from "@/lib/inat/types";

// Proxy for iNaturalist's observation search. Rounding the location to ~100 m lets
// Vercel's CDN serve one cached answer to everyone standing in the same spot, keeps
// us polite towards iNaturalist, and means precise positions never reach our logs.
const RADIUS_KM = 0.6;
const USER_AGENT = "Naturedex/0.1 (+https://naturedex-nine.vercel.app)";

interface INatObservation {
  id: number;
  location: string | null;
  observed_on: string | null;
  obscured: boolean;
  identifications_count?: number;
  num_identification_agreements?: number;
  user?: { login: string };
  taxon?: {
    id: number;
    name: string;
    preferred_common_name?: string;
    rank: string;
    iconic_taxon_name?: string;
    ancestor_ids?: number[];
  };
  photos?: { url: string; attribution: string }[];
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ error: "lat and lng are required" }, { status: 400 });
  }
  const center = { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };

  const url = new URL("https://api.inaturalist.org/v1/observations");
  url.search = new URLSearchParams({
    lat: String(center.lat),
    lng: String(center.lng),
    radius: String(RADIUS_KM),
    quality_grade: "research",
    photos: "true",
    geoprivacy: "open",
    taxon_geoprivacy: "open",
    order_by: "observed_on",
    order: "desc",
    per_page: "200",
    locale: "en",
  }).toString();

  let res: Response;
  try {
    res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, cache: "no-store" });
  } catch {
    return Response.json({ error: "iNaturalist unreachable" }, { status: 502 });
  }
  if (!res.ok) {
    return Response.json({ error: `iNaturalist ${res.status}` }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  const json = (await res.json()) as { results: INatObservation[] };
  const observations: NearbyObservation[] = json.results.flatMap((o) => {
    if (!o.taxon || !o.location || o.obscured) return [];
    const [olat, olng] = o.location.split(",").map(Number);
    const photo = o.photos?.[0];
    return [
      {
        id: o.id,
        lat: olat,
        lng: olng,
        observedOn: o.observed_on,
        user: o.user?.login ?? "",
        taxon: {
          id: o.taxon.id,
          name: o.taxon.name,
          common: o.taxon.preferred_common_name ?? null,
          rank: o.taxon.rank,
          iconic: o.taxon.iconic_taxon_name ?? null,
          ancestorIds: o.taxon.ancestor_ids ?? [],
        },
        photo: photo ? { url: photo.url.replace("/square.", "/medium."), attribution: photo.attribution } : null,
        idAgree: o.num_identification_agreements ?? 0,
        idTotal: o.identifications_count ?? 0,
      },
    ];
  });

  const body: NearbyResponse = { center, radiusKm: RADIUS_KM, observations };
  return Response.json(body, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
