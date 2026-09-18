import type { Rarity } from "@/lib/sprites/atlas";

export const RARITY_LABEL: Record<Rarity, string> = { C: "COMMON", U: "UNCOMMON", R: "RARE" };
const RARITY_BG: Record<Rarity, string> = { C: "bg-moss", U: "bg-abyss", R: "bg-berry" };

/** Iconic-taxon chip colours (Field Dex filter row in the .pen). */
export const ICONIC_STYLE: Record<string, { label: string; chip: string }> = {
  Aves: { label: "AVES", chip: "bg-sky" },
  Insecta: { label: "INSECTA", chip: "bg-sun" },
  Amphibia: { label: "AMPHIBIA", chip: "bg-blossom" },
  Reptilia: { label: "REPTILIA", chip: "bg-lime" },
  Mammalia: { label: "MAMMALIA", chip: "bg-alt-peach" },
  Actinopterygii: { label: "FISH", chip: "bg-alt-aqua" },
  Mollusca: { label: "MOLLUSCA", chip: "bg-alt-butter" },
  Arachnida: { label: "ARACHNIDA", chip: "bg-alt-haze" },
  Fungi: { label: "FUNGI", chip: "bg-alt-lilac" },
  Plantae: { label: "PLANTAE", chip: "bg-cloud" },
};

export function RarityChip({ rarity, className = "" }: { rarity: Rarity; className?: string }) {
  return (
    <span className={`inline-flex h-7 items-center border-2 border-paper px-2.5 font-ui text-[10px] tracking-[2px] text-paper ${RARITY_BG[rarity]} ${className}`}>
      {RARITY_LABEL[rarity]}
    </span>
  );
}

export function TagChip({ children, tone = "teal" }: { children: string; tone?: "teal" | "plain" }) {
  return (
    <span
      className={`inline-flex h-7 items-center border-2 border-paper px-2.5 font-ui text-[10px] tracking-[2px] ${
        tone === "teal" ? "bg-teal text-paper" : "bg-shadow text-bone"
      }`}
    >
      {children.toUpperCase()}
    </span>
  );
}
