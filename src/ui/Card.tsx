import { CATEGORY_META } from '../data/cards';
import type { CardDef } from '../engine/types';

interface Props {
  def?: CardDef | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  back?: boolean;
  onClick?: () => void;
  selected?: boolean;
  dim?: boolean;
  value?: number; // override display value (field value)
  badge?: string;
  flags?: { halved?: boolean; doubled?: boolean; stolen?: boolean; fresh?: boolean; thinking?: boolean };
  style?: React.CSSProperties;
  className?: string;
}

export function effectLabel(def: CardDef): string | null {
  const e = def.effect;
  if (!e) return null;
  switch (e.kind) {
    case 'boostSelf':
      return `+${e.amount} you`;
    case 'hitOpp':
      return `−${e.amount} them`;
    case 'fieldShake':
      return `−${e.amount} all`;
    case 'halveOppTop':
      return 'halve best';
    case 'doubleLast':
      return 'double last';
    case 'steal':
      return 'steal lowest';
  }
}

export function modLabel(def: CardDef): string | null {
  if (!def.mods) return null;
  const parts = Object.entries(def.mods)
    .filter(([, v]) => v !== 1)
    .map(([k, v]) => `${CATEGORY_META[k as keyof typeof CATEGORY_META].short.toLowerCase()} ×${v}`);
  return parts.length ? parts.join(' · ') : 'neutral';
}

export function Card({ def, size = 'md', back, onClick, selected, dim, value, badge, flags, style, className }: Props) {
  const cls = ['card', size !== 'md' ? size : '', onClick ? 'tappable' : '', selected ? 'selected' : '', dim ? 'dim' : '', className ?? ''];
  if (back || !def) {
    cls.push('back');
    if (flags?.thinking) cls.push('thinking');
    return (
      <div className={cls.join(' ')} style={style} onClick={onClick}>
        <span className="logo-mini">P</span>
      </div>
    );
  }
  const meta = CATEGORY_META[def.cat];
  cls.push(`r${def.rarity}`);
  if (def.cat === 'special') cls.push('special');
  if (flags?.halved) cls.push('halved');
  if (flags?.doubled) cls.push('doubled');
  if (flags?.stolen) cls.push('stolen');
  if (flags?.fresh) cls.push('fresh');
  const shown = value ?? def.rating;
  const valCls = value !== undefined && value !== def.rating ? (value > def.rating ? 'val boost' : 'val hurt') : 'val';
  const fx = badge ?? (def.cat === 'happenings' ? effectLabel(def) : def.cat === 'places' ? modLabel(def) : def.ability ? '★ ability' : null);
  return (
    <div className={cls.join(' ')} style={{ ...style, ['--hue' as string]: meta.hue }} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="art">
        <span className="cat">{meta.short}</span>
        {def.cat !== 'special' && <span className={valCls}>{shown}</span>}
        <span className="glyph">{def.emoji}</span>
        {fx && <span className="fx">{fx}</span>}
      </div>
      <div className="name">{def.name}</div>
    </div>
  );
}
