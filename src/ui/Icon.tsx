import type { IconType } from 'react-icons';
import { CARD_ART, UI_ART, type ArtLayer } from '../data/art';
import type { Category } from '../engine/types';

/** A card's primary icon, plain (for tools, burst, menus). Custom-shape cards fall back to their first layer. */
export function Art({ id, className, style }: { id: string; className?: string; style?: React.CSSProperties }) {
  const spec = CARD_ART[id];
  if (!spec) return null;
  const first = spec.layers.find((l) => l.icon);
  if (first?.icon) {
    const I: IconType = first.icon;
    return <I className={className} style={style} aria-hidden />;
  }
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden fill="currentColor">
      {spec.layers.map((l, i) => (
        <Layer key={i} l={l} plain />
      ))}
    </svg>
  );
}

function Layer({ l, plain }: { l: ArtLayer; plain?: boolean }) {
  const style: React.CSSProperties = {};
  if (l.op !== undefined) style.opacity = l.op;
  const transform = l.rot ? `rotate(${l.rot} ${(l.x ?? 0) + (l.s ?? 100) / 2} ${(l.y ?? 0) + (l.s ?? 100) / 2})` : undefined;
  if (l.icon) {
    const I = l.icon;
    const el = <I x={l.x ?? 0} y={l.y ?? 0} size={l.s ?? 100} transform={transform} className={plain ? undefined : `l-${l.fill ?? 'light'}`} style={style} />;
    if (l.clip && !plain) return <g clipPath={`url(#cp-${l.clip})`}>{el}</g>;
    return el;
  }
  if (l.stroke) {
    return <path d={l.path} className={plain ? undefined : `s-${l.stroke}`} style={{ ...style, fill: 'none' }} stroke={plain ? 'currentColor' : undefined} strokeWidth={l.w ?? 5} strokeLinecap="round" strokeLinejoin="round" transform={transform} />;
  }
  return <path d={l.path} className={plain ? undefined : `l-${l.fill ?? 'light'}`} style={style} transform={transform} />;
}

/** Full card artwork: scene backdrop plus the layered composition, drawn twice (glow shadow + lit main). */
export function CardArt({ id, cat }: { id: string; cat: Category }) {
  const spec = CARD_ART[id];
  if (!spec) return null;
  return (
    <div className={`glowart sc-${spec.scene}`}>
      <div className="scene" />
      <svg viewBox="0 0 100 100" className="ico shadow" aria-hidden fill="currentColor">
        {spec.layers.map((l, i) => (
          <Layer key={i} l={l} plain />
        ))}
      </svg>
      <svg viewBox="0 0 100 100" className="ico main" aria-hidden style={{ fill: `url(#fill-${cat})` }}>
        {spec.layers.map((l, i) => (
          <Layer key={i} l={l} />
        ))}
      </svg>
    </div>
  );
}

export function Ui({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const I: IconType | undefined = UI_ART[name];
  if (!I) return null;
  return <I className={className} style={style} aria-hidden />;
}

export function CatIcon({ cat, className, style }: { cat: Category; className?: string; style?: React.CSSProperties }) {
  return <Ui name={`cat-${cat}`} className={className} style={style} />;
}

/** SVG gradient and clip definitions used by card art; rendered once in the app root. */
export function ArtDefs() {
  const tints: Record<Category, string> = { life: '#b8ffd6', stuff: '#ffd9a8', places: '#b9e4ff', ideas: '#dcc6ff', happenings: '#ffc2d1', special: '#ffe9a8' };
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        {(Object.keys(tints) as Category[]).map((c) => (
          <linearGradient key={c} id={`fill-${c}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor={tints[c]} />
          </linearGradient>
        ))}
        <linearGradient id="fill-goldgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2b0" />
          <stop offset="1" stopColor="#e8a800" />
        </linearGradient>
        <clipPath id="cp-right" clipPathUnits="userSpaceOnUse">
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>
        <clipPath id="cp-left" clipPathUnits="userSpaceOnUse">
          <rect x="0" y="0" width="50" height="100" />
        </clipPath>
      </defs>
    </svg>
  );
}
