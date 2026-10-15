import type { IconType } from 'react-icons';
import { CARD_ART, UI_ART } from '../data/art';
import type { Category } from '../engine/types';

export function Art({ id, className, style }: { id: string; className?: string; style?: React.CSSProperties }) {
  const I: IconType | undefined = CARD_ART[id];
  if (!I) return null;
  return <I className={className} style={style} aria-hidden />;
}

export function Ui({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const I: IconType | undefined = UI_ART[name];
  if (!I) return null;
  return <I className={className} style={style} aria-hidden />;
}

export function CatIcon({ cat, className, style }: { cat: Category; className?: string; style?: React.CSSProperties }) {
  return <Ui name={`cat-${cat}`} className={className} style={style} />;
}
