import type { ResolvedSprite } from "@/lib/sprites/resolve";

interface SpriteProps {
  sprite: ResolvedSprite;
  /** Rendered size in CSS px. Keep it a whole multiple of 18 so pixels stay square. */
  size: number;
  className?: string;
  title?: string;
}

/** Pixel creature drawn from design tokens, so it follows the colour / 1-bit tone. */
export function Sprite({ sprite, size, className, title }: SpriteProps) {
  const { creature, remap } = sprite;
  return (
    <svg
      viewBox="0 0 18 18"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {creature.rects.map(([token, x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={`var(--${remap[token] ?? token})`} />
      ))}
    </svg>
  );
}
