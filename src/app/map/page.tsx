import type { Metadata } from "next";
import { MapScreenClient } from "@/components/map/MapScreenClient";

export const metadata: Metadata = { title: "Map · Naturedex" };

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const { radar, z } = await searchParams;
  const zoom = Number(z);
  return <MapScreenClient initialRadar={Boolean(radar)} initialZoom={Number.isInteger(zoom) ? zoom : undefined} />;
}
