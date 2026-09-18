import { notFound } from "next/navigation";
import { SpeciesPage } from "@/components/dex/SpeciesPage";

export const metadata = { title: "Species · Naturedex" };

export default async function SpeciesRoute({ params }: PageProps<"/dex/[id]">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  return <SpeciesPage taxonId={Number(id)} />;
}
