import type { IconType } from 'react-icons';
import { CARD_ART, UI_ART } from '../data/art';
import type { Category } from '../engine/types';

/** A card's main illustration, plain (for tools, burst, menus). */
export function Art({ id, className, style }: { id: string; className?: string; style?: React.CSSProperties }) {
  const spec = CARD_ART[id];
  if (!spec) return null;
  const I: IconType = spec.main;
  return <I className={className} style={style} aria-hidden />;
}

/** Full card artwork: scene backdrop, gradient-filled outlined main icon, prop badge. */
export function CardArt({ id, cat }: { id: string; cat: Category }) {
  const spec = CARD_ART[id];
  if (!spec) return null;
  const Main = spec.main;
  const Prop = spec.prop;
  return (
    <div className={`glowart sc-${spec.scene}`}>
      <div className="scene" />
      <Main className="ico shadow" aria-hidden />
      <Main className="ico main" style={{ fill: `url(#fill-${cat})` }} aria-hidden />
      {Prop && (
        <span className="prop">
          <Prop aria-hidden />
        </span>
      )}
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

/** SVG gradient definitions used by card art fills; rendered once in the app root. */
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
      </defs>
    </svg>
  );
}
