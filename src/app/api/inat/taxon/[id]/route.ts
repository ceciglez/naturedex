import type { NextRequest } from "next/server";
import type { TaxonDetails } from "@/lib/inat/types";

// Everything the Encounter, New Species and Species screens need about one taxon,
// gathered from four iNaturalist calls and cached at the CDN for a day per ~10 km square.
const USER_AGENT = "Naturedex/0.1 (+https://naturedex-nine.vercel.app)";
const NEARBY_KM = 50;
const LINEAGE_RANKS = new Set(["kingdom", "phylum", "class", "order", "family", "genus"]);

const api = (path: string, params: Record<string, string>) =>
  fetch(`https://api.inaturalist.org/v1/${path}?${new URLSearchParams(params)}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  }).then((r) => {
    if (!r.ok) throw new Error(`iNaturalist ${path} ${r.status}`);
    return r.json();
  });

interface INatTaxon {
  id: number;
  name: string;
  rank: string;
  preferred_common_name?: string;
  iconic_taxon_name?: string;
  observations_count: number;
  wikipedia_summary?: string;
  ancestors?: { rank: string; name: string }[];
  default_photo?: { medium_url: string; attribution: string; license_code: string | null };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return Response.json({ error: "bad taxon id" }, { status: 400 });

  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const near = Number.isFinite(lat) && Number.isFinite(lng) && req.nextUrl.searchParams.has("lat")
    ? { lat: (Math.round(lat * 10) / 10).toString(), lng: (Math.round(lng * 10) / 10).toString(), radius: String(NEARBY_KM) }
    : null;

  try {
    const [taxonRes, identifiersRes, nearbyRes, histNearbyRes] = await Promise.all([
      api(`taxa/${id}`, {}),
      api("observations/identifiers", { taxon_id: id, per_page: "0" }),
      near
        ? api("observations", { taxon_id: id, ...near, quality_grade: "research", order_by: "observed_on", per_page: "1" })
        : Promise.resolve(null),
      near
        ? api("observations/histogram", { taxon_id: id, ...near, interval: "month_of_year", quality_grade: "research" })
        : Promise.resolve(null),
    ]);

    const t = (taxonRes as { results: INatTaxon[] }).results[0];
    if (!t) return Response.json({ error: "taxon not found" }, { status: 404 });

    const months = (h: { results: { month_of_year: Record<string, number> } } | null) =>
      h ? Array.from({ length: 12 }, (_, i) => h.results.month_of_year[String(i + 1)] ?? 0) : null;
    let byMonth = months(histNearbyRes);
    let byMonthScope: TaxonDetails["byMonthScope"] = "nearby";
    if (!byMonth || byMonth.reduce((a, b) => a + b, 0) < 12) {
      byMonth = months(await api("observations/histogram", { taxon_id: id, interval: "month_of_year", quality_grade: "research" }));
      byMonthScope = "world";
    }

    const nearby = nearbyRes as { total_results: number; results: { observed_on: string | null }[] } | null;
    const body: TaxonDetails = {
      id: t.id,
      name: t.name,
      common: t.preferred_common_name ?? null,
      rank: t.rank,
      iconic: t.iconic_taxon_name ?? null,
      lineage: [
        ...(t.ancestors ?? []).filter((a) => LINEAGE_RANKS.has(a.rank)).map((a) => ({ rank: a.rank, name: a.name })),
        { rank: t.rank, name: t.name },
      ],
      photo: t.default_photo
        ? { url: t.default_photo.medium_url, attribution: t.default_photo.attribution, license: t.default_photo.license_code }
        : null,
      wikipedia: t.wikipedia_summary?.replace(/<[^>]+>/g, "") ?? null,
      observationsTotal: t.observations_count,
      nearbyCount: nearby?.total_results ?? 0,
      lastSeenNearby: nearby?.results[0]?.observed_on ?? null,
      identifiers: (identifiersRes as { total_results: number }).total_results,
      byMonth: byMonth ?? Array(12).fill(0),
      byMonthScope,
    };
    return Response.json(body, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    console.warn(err);
    return Response.json({ error: "iNaturalist unreachable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
