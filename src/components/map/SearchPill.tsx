import { PixelIcon } from "@/components/ui/PixelIcon";

interface SearchPillProps {
  title: string;
  subtitle: string;
  mono: boolean;
  onToggleTone: () => void;
}

/** Search Pill from the .pen: where you are, the biome and what's around. The leaf toggles 1-bit mode. */
export function SearchPill({ title, subtitle, mono, onToggleTone }: SearchPillProps) {
  return (
    <div className="flex h-[50px] w-full items-center gap-2.5 border-[3px] border-ink bg-paper px-3 shadow-[4px_4px_0_#45243555]">
      <PixelIcon name="pin" className="shrink-0 text-rust" />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p className="truncate font-display text-[11px] leading-tight text-ink">{title.toUpperCase()}</p>
        <p className="truncate font-ui text-[9px] tracking-[1px] text-stone">{subtitle.toUpperCase()}</p>
      </div>
      <button
        type="button"
        onClick={onToggleTone}
        aria-pressed={mono}
        aria-label="1-bit mode"
        className="flex size-[30px] shrink-0 items-center justify-center border-2 border-ink bg-sun text-ink"
      >
        <PixelIcon name="leaf" size={22} />
      </button>
    </div>
  );
}
