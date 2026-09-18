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
}

export interface NearbyResponse {
  center: { lat: number; lng: number };
  radiusKm: number;
  observations: NearbyObservation[];
}
