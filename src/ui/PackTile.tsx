import { CATEGORY_META } from '../data/cards';
import type { MPack as Pack, PackKind } from '../engine/match';
import { CatIcon, Ui } from './Icon';

export const PACK_HUES: Record<PackKind, number> = { basic: 255, enhanced: 320, baptized: 45, category: 190, redemption: 135 };

export function PackArt({ kind, label, count, category, small }: { kind: PackKind; label: string; count?: number; category?: string; small?: boolean }) {
  return (
    <div className={`packart k-${kind} ${small ? 'small' : ''}`} style={{ ['--hue' as string]: category ? CATEGORY_META[category as keyof typeof CATEGORY_META].hue : PACK_HUES[kind] }}>
      <div className="foil" />
      <div className="shine" />
      <div className="crimp top" />
      <div className="crimp bottom" />
      <div className="emblem">
        {category ? <CatIcon cat={category as 'life'} /> : <Ui name={`pack-${kind}`} />}
      </div>
      <div className="plabel">
        <b>{label}</b>
        {count !== undefined && <i>×{count}</i>}
      </div>
    </div>
  );
}

export function PackTile({ pack, onClick, state, style, mirrored }: { pack: Pack; onClick?: () => void; state?: 'idle' | 'targetable' | 'peeked' | 'gone'; style?: React.CSSProperties; mirrored?: boolean }) {
  const cls = ['pack', state ?? 'idle', pack.locked ? 'locked' : '', pack.destroyed ? 'destroyed' : '', mirrored ? 'mirrored' : ''];
  return (
    <button className={cls.join(' ')} style={style} onClick={onClick} disabled={!onClick} aria-label={`${pack.label} pack`}>
      <PackArt kind={pack.kind} label={pack.label} count={pack.size} category={pack.kind === 'category' ? pack.category : undefined} small />
      {pack.locked && (
        <span className="padlock">
          <Ui name="lock" />
        </span>
      )}
    </button>
  );
}
