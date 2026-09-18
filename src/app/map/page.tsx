import Link from "next/link";

// Placeholder until the map engine lands (Milestone 1).
export default function MapScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-lcd-bg px-6 text-center">
      <p className="font-display text-sm leading-relaxed text-ink">MAP ENGINE</p>
      <p className="font-body text-base text-ink">Scanning the field… the pixel map arrives in the next milestone.</p>
      <Link href="/" className="border-2 border-ink bg-paper px-4 py-2 font-ui text-xs tracking-[1px] text-ink">
        ◀ BACK
      </Link>
    </main>
  );
}
