import Link from "next/link";
import { PixelIcon, type PixelIconName } from "./PixelIcon";

export type Tab = "map" | "dex" | "radar" | "you";

const TABS: { id: Tab; label: string; icon: PixelIconName; href: string }[] = [
  { id: "map", label: "MAP", icon: "pin", href: "/map" },
  { id: "dex", label: "DEX", icon: "dex", href: "/dex" },
  { id: "radar", label: "RADAR", icon: "radar", href: "/map?radar=1" },
  { id: "you", label: "YOU", icon: "you", href: "/you" },
];

interface TabBarProps {
  active: Tab;
  /** Handle the RADAR tab in place (opens the drawer) instead of navigating. */
  onRadar?: () => void;
}

export function TabBar({ active, onRadar }: TabBarProps) {
  return (
    <nav
      aria-label="Main"
      className="relative z-30 flex h-[calc(74px+env(safe-area-inset-bottom))] shrink-0 items-start justify-between bg-ink px-5 pb-[env(safe-area-inset-bottom)] pt-3"
    >
      {TABS.map((t) => {
        const on = t.id === active;
        const cls = `flex min-h-[50px] flex-1 flex-col items-center gap-[5px] ${on ? "text-sun" : "text-stone"}`;
        const content = (
          <>
            <PixelIcon name={t.icon} />
            <span className="font-ui text-[9px] tracking-[1px]">{t.label}</span>
          </>
        );
        return t.id === "radar" && onRadar ? (
          <button key={t.id} type="button" onClick={onRadar} className={cls} aria-pressed={on}>
            {content}
          </button>
        ) : (
          <Link key={t.id} href={t.href} className={cls} aria-current={on ? "page" : undefined}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
