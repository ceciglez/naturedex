// Slimmed-down iNaturalist observation, as returned by /api/inat/nearby.
export interface NearbyTaxon {
  id: number;
  name: string; // scientific
  common: string | null;
  rank: string;
  iconic: string | null;
  ancestorIds: number[];
}

export interface NearbyObservation {
  id: number;
  lat: number;
  lng: number;
  observedOn: string | null;
  user: string;
  taxon: NearbyTaxon;
  photo: { url: string; attribution: string } | null;
  /** Community identifications: how many agree with the observation's taxon, out of how many. */
  idAgree: number;
  idTotal: number;
}

export interface NearbyResponse {
  center: { lat: number; lng: number };
  radiusKm: number;
  observations: NearbyObservation[];
}

export interface TaxonDetails {
  id: number;
  name: string;
  common: string | null;
  rank: string;
  iconic: string | null;
  /** Kingdom → genus, then the taxon itself. */
  lineage: { rank: string; name: string }[];
  photo: { url: string; attribution: string; license: string | null } | null;
  wikipedia: string | null;
  observationsTotal: number;
  /** Research-grade observations within 50 km of the player. */
  nearbyCount: number;
  lastSeenNearby: string | null;
  identifiers: number;
  /** Observations per calendar month (Jan…Dec); nearby when there are enough, else worldwide. */
  byMonth: number[];
  byMonthScope: "nearby" | "world";
}
