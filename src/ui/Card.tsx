import { CATEGORY_META, TIER_META } from '../data/cards';
import type { CardDef, Category, Rarity } from '../engine/types';
import { CardArt, CatIcon } from './Icon';

interface Props {
  def?: CardDef | null;
  /** face-down; `backCat` shows the category symbol on the back, `backRarity` tints the glow */
  back?: boolean;
  backCat?: Category;
  backRarity?: number;
  onClick?: () => void;
  selected?: boolean;
  dim?: boolean;
  value?: number;
  badge?: string;
  flags?: { halved?: boolean; doubled?: boolean; stolen?: boolean; fresh?: boolean; thinking?: boolean; flipped?: boolean; scene?: boolean };
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
      return `−${e.amount} table`;
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

/**
 * A card. Rendered as a 3D flipper so the same element can show its back
 * (category symbol, tier glow) and flip to its face.
 */
export function Card({ def, back, backCat, backRarity, onClick, selected, dim, value, badge, flags, style, className }: Props) {
  const cat = def?.cat ?? backCat ?? 'special';
  const meta = CATEGORY_META[cat];
  const rarity = (def?.rarity ?? backRarity ?? 1) as Rarity;
  const neutral = !def && backRarity === undefined; // concealed opponent card: no tier tell
  const cls = ['card', `r${rarity}`, neutral ? 'neutral' : '', onClick ? 'tappable' : '', selected ? 'selected' : '', dim ? 'dim' : '', back ? 'is-back' : '', className ?? ''];
  if (flags?.halved) cls.push('halved');
  if (flags?.doubled) cls.push('doubled');
  if (flags?.stolen) cls.push('stolen');
  if (flags?.fresh) cls.push('fresh');
  if (flags?.thinking) cls.push('thinking');
  if (flags?.flipped) cls.push('just-flipped');
  if (flags?.scene) cls.push('scene');
  if (cat === 'special') cls.push('special');
  const shown = def ? (value ?? def.rating) : 0;
  const valCls = def && value !== undefined && value !== def.rating ? (value > def.rating ? 'val boost' : 'val hurt') : 'val';
  const fx = def ? (badge ?? (def.cat === 'happenings' ? effectLabel(def) : def.cat === 'places' ? modLabel(def) : def.ability ? 'ability' : null)) : null;
  return (
    <div className={cls.join(' ')} style={{ ...style, ['--hue' as string]: meta.hue, ['--tier' as string]: neutral ? '#8f9bff' : TIER_META[rarity].color }} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="flipper">
        <div className="face back">
          <div className="holo" />
          <div className="sigil">
            <CatIcon cat={cat} />
          </div>
          <div className="ring" />
        </div>
        {def && (
          <div className="face front">
            <div className="art">
              <CardArt id={def.id} cat={cat} />
              <span className="cat">
                <CatIcon cat={cat} /> {meta.short}
              </span>
              {cat !== 'special' && <span className={valCls}>{shown}</span>}
              {fx && <span className="fx">{fx}</span>}
            </div>
            <div className="name">
              <span>{def.name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
