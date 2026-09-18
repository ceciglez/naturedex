import { StateMessage } from "./StateMessage";
import { TabBar, type Tab } from "./TabBar";

/** Placeholder screen for tabs that land in a later milestone. */
export function ComingSoon({ tab, title, body }: { tab: Tab; title: string; body: string }) {
  return (
    <div className="flex h-dvh flex-col bg-paper">
      <header className="px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <h1 className="font-display text-xl text-ink">{tab.toUpperCase()}</h1>
      </header>
      <main className="flex flex-1 items-center justify-center px-8">
        <StateMessage title={title} body={body} alt={{ label: "BACK TO THE MAP ▸", href: "/map" }} />
      </main>
      <TabBar active={tab} />
    </div>
  );
}
