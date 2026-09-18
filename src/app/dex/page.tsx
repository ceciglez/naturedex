import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "Field Dex · Naturedex" };

export default function DexPage() {
  return (
    <ComingSoon
      tab="dex"
      title="YOUR DEX IS EMPTY"
      body="Creatures you log on the map will be filed here. Logging arrives in the next update."
    />
  );
}
