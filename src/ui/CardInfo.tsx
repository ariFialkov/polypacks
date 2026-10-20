// Hold a card to read it: a small store of its own (so it works on the game and the card index alike)
// and the popup layer that shows the held card's ability and details.
import { useEffect, useSyncExternalStore } from 'react';
import { ABILITIES } from '../data/abilities';
import { CARD_BY_ID, CATEGORY_META, TIER_META } from '../data/cards';
import { PLACE_LINKS, THEME_LABEL, homeFieldPlace, themesOf } from '../data/places';
import type { CardDef } from '../engine/types';
import { Card } from './Card';

let held: { def: CardDef; at: number } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const cardInfo = {
  show(def: CardDef) {
    held = { def, at: Date.now() };
    emit();
  },
  hide() {
    if (!held || Date.now() - held.at < 350) return; // ignore the release of the hold that opened it
    held = null;
    emit();
  },
};

function useHeld() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => held,
  );
}

/** Long-press handlers for a card element. A held card opens its info and swallows the tap. */
export function holdHandlers(def: CardDef | null | undefined) {
  if (!def) return {};
  let timer = 0;
  let start: { x: number; y: number } | null = null;
  const cancel = () => {
    window.clearTimeout(timer);
    start = null;
  };
  return {
    onPointerDown: (e: React.PointerEvent) => {
      start = { x: e.clientX, y: e.clientY };
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        holdFired.add(def.id);
        window.setTimeout(() => holdFired.delete(def.id), 700);
        cardInfo.show(def);
      }, 430);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}
/** Cards whose hold just opened the popup: their tap is not a pick. */
export const holdFired = new Set<string>();

export function CardInfoLayer() {
  const h = useHeld();
  useEffect(() => {
    if (!h) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cardInfo.hide();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [h]);
  if (!h) return null;
  const def = h.def;
  const ab = def.ability ? ABILITIES[def.ability] : null;
  const themes = themesOf(def.id);
  const links = def.cat === 'places' ? PLACE_LINKS[def.id] : undefined;
  const fieldOf = homeFieldPlace(def.id);
  return (
    <div className="cardinfo" onClick={() => cardInfo.hide()}>
      <div className="cardinfo-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cardinfo-card">
          <Card def={def} />
        </div>
        <div className="cardinfo-text">
          <span className="eyebrow">
            {CATEGORY_META[def.cat].label}
            {def.cat !== 'special' && ` · ${def.rating} · ${TIER_META[def.rarity].label}`}
          </span>
          <h2>{def.name}</h2>
          {ab ? (
            <div className="cardinfo-ability">
              <b>{ab.name}</b>
              <span className="when">{ab.timing === 'pick' ? 'fires when you take it' : ab.timing === 'charge' ? 'a charge you use when you choose' : 'always on'}</span>
              <p>{ab.text}</p>
            </div>
          ) : (
            <p className="noability">No ability. Its rating counts toward your set.</p>
          )}
          {def.blurb && <p className="blurb">{def.blurb}</p>}
          {links && (
            <p className="meta">
              Home themes: {themes.map((t) => THEME_LABEL[t]).join(', ')}. Home field: {CARD_BY_ID[links.homeField].name}.
            </p>
          )}
          {!links && themes.length > 0 && <p className="meta">Fits places of {themes.map((t) => THEME_LABEL[t]).join(', ')}.</p>}
          {fieldOf && <p className="meta field">Home field of {CARD_BY_ID[fieldOf].name}: hold both and home place is yours.</p>}
          <button className="btn small" onClick={() => cardInfo.hide()}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
