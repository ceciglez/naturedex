import type { ReactNode } from "react";

interface StateMessageProps {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
  alt?: { label: string; onClick?: () => void; href?: string };
  /** Light text for dark (ink) screens. */
  dark?: boolean;
}

/** "State / Message" component from the .pen, light-on-paper variant used by the v2 state screens. */
export function StateMessage({ icon, title, body, action, alt, dark }: StateMessageProps) {
  const altCls = `py-2 font-ui text-[10px] tracking-[1px] ${dark ? "text-alt-aqua" : "text-moss"}`;
  return (
    <div className="flex w-full max-w-[326px] flex-col items-center gap-3.5 text-center">
      {icon && <div className={dark ? "text-sun" : "text-rust"}>{icon}</div>}
      <h2 className={`font-display text-[13px] leading-normal ${dark ? "text-bone" : "text-ink"}`}>{title}</h2>
      <p className={`font-body text-[13px] leading-[1.65] ${dark ? "text-alt-dusk" : "text-ink"}`}>{body}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="border-[3px] border-ink bg-sun px-5 py-[13px] font-display text-xs text-ink shadow-[4px_4px_0_#2C162255] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#2C162255]"
        >
          {action.label}
        </button>
      )}
      {alt &&
        (alt.href ? (
          <a href={alt.href} className={altCls}>
            {alt.label}
          </a>
        ) : (
          <button type="button" onClick={alt.onClick} className={altCls}>
            {alt.label}
          </button>
        ))}
    </div>
  );
}

/** Pixel padlock / wifi-off glyphs for the state screens (44px, 11×11 grid). */
export function LockGlyph() {
  return (
    <svg viewBox="0 0 11 11" width={44} height={44} shapeRendering="crispEdges" aria-hidden>
      <path fill="currentColor" d="M3 0h5v1h-5z M2 1h1v3h-1z M8 1h1v3h-1z M1 4h9v1h-9z M1 5h1v5h-1z M9 5h1v5h-1z M1 10h9v1h-9z M5 6h1v2h-1z" />
    </svg>
  );
}

export function NoSignalGlyph() {
  return (
    <svg viewBox="0 0 11 11" width={44} height={44} shapeRendering="crispEdges" aria-hidden>
      <path fill="currentColor" d="M2 1h7v1h-7z M0 2h2v1h-2z M9 2h2v1h-2z M3 4h5v1h-5z M2 5h1v1h-1z M8 5h1v1h-1z M4 7h3v1h-3z M5 9h1v1h-1z M0 0h1v1h-1z M1 1h1v1h-1z M10 10h1v1h-1z M9 9h1v1h-1z" />
    </svg>
  );
}

export function GridGlyph() {
  return (
    <svg viewBox="0 0 11 11" width={44} height={44} shapeRendering="crispEdges" aria-hidden>
      <path fill="currentColor" d="M0 0h5v5h-5z M6 0h5v5h-5z M0 6h5v5h-5z M6 6h5v5h-5z" />
      <path fill="var(--paper)" d="M1 1h3v3h-3z M7 1h3v3h-3z M1 7h3v3h-3z M7 7h3v3h-3z" />
    </svg>
  );
}

export function SparkGlyph() {
  return (
    <svg viewBox="0 0 11 11" width={44} height={44} shapeRendering="crispEdges" aria-hidden>
      <path fill="currentColor" d="M4 1h1v2h-1z M3 3h3v1h-3z M1 4h7v1h-7z M3 5h3v1h-3z M4 6h1v2h-1z M8 0h1v3h-1z M7 1h3v1h-3z M1 8h1v2h-1z M0 9h3v1h-3z" />
    </svg>
  );
}
