import Image from "next/image";
import { SoundToggle } from "@/components/title/SoundToggle";
import { StartButton } from "@/components/title/StartButton";

// Positions come from "Screen · Title v2" (390×844) in the .pen file.
const FLOATS = [
  { name: "monarch", x: 286, y: 78, size: 54 },
  { name: "jay", x: 24, y: 88, size: 54 },
  { name: "hummer", x: 302, y: 352, size: 36 },
  { name: "ladybug", x: 32, y: 362, size: 36 },
  { name: "bee", x: 290, y: 538, size: 54 },
  { name: "snail", x: 22, y: 678, size: 54 },
  { name: "daisy", x: 306, y: 676, size: 54 },
];

const titleShadow = { textShadow: "5px 5px 0 var(--ink)" };

export default function TitleScreen() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center bg-lime pb-[max(63px,env(safe-area-inset-bottom))] pt-[max(62px,env(safe-area-inset-top))]">
      <div aria-hidden className="checker absolute inset-0" />
      <div aria-hidden className="absolute inset-0 bg-[#F1F8EC33]" />

      {FLOATS.map((f) => (
        <Image
          key={f.name}
          src={`/sprites/title/${f.name}.png`}
          alt=""
          width={f.size}
          height={f.size}
          priority
          className="pixelated absolute"
          style={{ left: `${(f.x / 390) * 100}%`, top: `${(f.y / 844) * 100}%` }}
        />
      ))}

      <div className="relative flex w-full flex-1 flex-col items-center">
        <section className="mt-[13dvh] flex flex-col items-center gap-4">
          <p className="font-ui text-xs tracking-[2px] text-ink">iNATURALIST PRESENTS</p>
          <h1 className="flex flex-col items-center gap-4 font-display text-[46px] leading-none text-sun">
            <span style={titleShadow}>NATURE</span>
            <span style={titleShadow}>DEX</span>
          </h1>
          <p className="font-display text-[10px] leading-none text-ink">CATCH WHAT&apos;S REALLY OUT THERE</p>
        </section>

        <div className="mt-auto flex flex-col items-center">
          <SoundToggle />
          <StartButton />
          <footer className="mt-[96px] flex flex-col items-center gap-2">
            <p className="font-display text-xs text-ink">2026</p>
            <p className="font-ui text-[10px] tracking-[1px] text-black">OBSERVATION DATA © iNATURALIST</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
