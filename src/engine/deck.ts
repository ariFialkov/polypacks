import { findCombos } from '../data/combos';
import { effectWorth } from '../data/cards';
import type { CardInst, Combo, MainCategory } from './types';

export interface SlotDef {
  id: string;
  label: string;
  accepts: MainCategory[];
  special: boolean;
}

export const BASE_SLOTS: SlotDef[] = [
  { id: 'life1', label: 'Life', accepts: ['life'], special: false },
  { id: 'life2', label: 'Life', accepts: ['life'], special: false },
  { id: 'stuff1', label: 'Stuff', accepts: ['stuff'], special: false },
  { id: 'stuff2', label: 'Stuff', accepts: ['stuff'], special: false },
  { id: 'stuff3', label: 'Stuff', accepts: ['stuff'], special: false },
  { id: 'place', label: 'Place', accepts: ['places'], special: false },
  { id: 'idea', label: 'Idea', accepts: ['ideas'], special: false },
  { id: 'event', label: 'Happening', accepts: ['happenings'], special: false },
  { id: 'flex', label: 'Place / Happening', accepts: ['places', 'happenings'], special: false },
];

export const SPECIAL_SLOTS: SlotDef[] = [
  { id: 'sp1', label: 'Life / Stuff', accepts: ['life', 'stuff'], special: true },
  { id: 'sp2', label: 'Idea / Happening', accepts: ['ideas', 'happenings'], special: true },
  { id: 'sp3', label: 'Wild', accepts: ['life', 'stuff', 'places', 'ideas', 'happenings'], special: true },
];

export interface DeckSlot {
  slot: SlotDef;
  card: CardInst | null;
}

export interface Deck {
  slots: DeckSlot[];
  bench: CardInst[];
  combos: Combo[];
  unlocked: number;
  potential: number;
}

export function placeMult(place: CardInst | null | undefined, cat: string): number {
  if (!place || !place.def.mods) return 1;
  return (place.def.mods as Record<string, number | undefined>)[cat] ?? 1;
}

/** Estimated value of a set of cards (best place chosen), including combos. */
export function setPotential(cards: CardInst[]): number {
  const places = cards.filter((c) => c.def.cat === 'places');
  const others = cards.filter((c) => c.def.cat !== 'places');
  const comboBonus = findCombos(cards.map((c) => c.def.id)).reduce((s, c) => s + c.bonus, 0);
  const evalWith = (place: CardInst | null) => {
    let total = place ? place.def.rating : 0;
    for (const c of others) {
      const base = c.def.rating + (c.def.cat === 'happenings' ? effectWorth(c.def.effect) : 0);
      total += Math.round(base * placeMult(place, c.def.cat));
    }
    // a second place is worth a little as a backup
    for (const p of places) if (p !== place) total += Math.round(p.def.rating * 0.35);
    return total + comboBonus;
  };
  if (places.length === 0) return evalWith(null);
  return Math.max(...places.map((p) => evalWith(p)));
}

/** Can every card in `subset` be matched to a distinct compatible slot? (augmenting paths) */
function canAssign(subset: CardInst[], slots: SlotDef[]): number[] | null {
  const match: number[] = new Array(slots.length).fill(-1);
  const tryAssign = (ci: number, seen: boolean[]): boolean => {
    for (let si = 0; si < slots.length; si++) {
      if (seen[si] || !slots[si].accepts.includes(subset[ci].def.cat as MainCategory)) continue;
      seen[si] = true;
      if (match[si] === -1 || tryAssign(match[si], seen)) {
        match[si] = ci;
        return true;
      }
    }
    return false;
  };
  for (let ci = 0; ci < subset.length; ci++) {
    if (!tryAssign(ci, new Array(slots.length).fill(false))) return null;
  }
  return match;
}

function bestSubset(cards: CardInst[], slots: SlotDef[]): { assign: number[]; chosen: CardInst[] } {
  // Group cards by category and iterate subsets; cards count is small (<= 14).
  const n = cards.length;
  let best: { assign: number[]; chosen: CardInst[]; score: number } | null = null;
  const total = 1 << n;
  for (let mask = total - 1; mask >= 0; mask--) {
    const chosen: CardInst[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) chosen.push(cards[i]);
    if (chosen.length > slots.length) continue;
    const assign = canAssign(chosen, slots);
    if (!assign) continue;
    const score = setPotential(chosen);
    if (!best || score > best.score || (score === best.score && chosen.length > best.chosen.length)) best = { assign, chosen, score };
  }
  return best ?? { assign: new Array(slots.length).fill(-1), chosen: [] };
}

export function slotsFor(unlocked: number): SlotDef[] {
  return [...BASE_SLOTS, ...SPECIAL_SLOTS.slice(0, Math.max(0, Math.min(3, unlocked)))];
}

/** Auto-build the best deck from the collected cards, unlocking special slots through combos. */
export function buildDeck(cards: CardInst[], opts: { unlocked?: number } = {}): Deck {
  let unlocked = opts.unlocked ?? 0;
  let result: Deck | null = null;
  for (let iter = 0; iter < 4; iter++) {
    const slots = slotsFor(unlocked);
    const { assign, chosen } = bestSubset(cards, slots);
    const deckSlots: DeckSlot[] = slots.map((slot, si) => ({ slot, card: assign[si] >= 0 ? chosen[assign[si]] : null }));
    const combos = findCombos(chosen.map((c) => c.def.id));
    const comboUnlock = Math.min(3, combos.reduce((s, c) => s + (c.unlock ?? 0), 0));
    const want = Math.max(opts.unlocked ?? 0, comboUnlock);
    result = {
      slots: deckSlots,
      bench: cards.filter((c) => !chosen.includes(c)),
      combos,
      unlocked,
      potential: setPotential(chosen),
    };
    if (want > unlocked) {
      unlocked = want;
      continue;
    }
    break;
  }
  return result!;
}

/** Recompute combos & potential after a manual change. */
export function refreshDeck(deck: Deck): Deck {
  const chosen = deck.slots.map((s) => s.card).filter((c): c is CardInst => !!c);
  return { ...deck, combos: findCombos(chosen.map((c) => c.def.id)), potential: setPotential(chosen) };
}

/** Put a bench card into a slot (swapping out whatever was there). */
export function placeInSlot(deck: Deck, slotId: string, uid: string): Deck {
  const si = deck.slots.findIndex((s) => s.slot.id === slotId);
  if (si < 0) throw new Error('no slot');
  const card = deck.bench.find((c) => c.uid === uid);
  if (!card) throw new Error('card not on bench');
  if (!deck.slots[si].slot.accepts.includes(card.def.cat as MainCategory)) throw new Error('slot does not accept this card');
  const slots = deck.slots.map((s) => ({ ...s }));
  const bench = deck.bench.filter((c) => c.uid !== uid);
  if (slots[si].card) bench.push(slots[si].card!);
  slots[si].card = card;
  return refreshDeck({ ...deck, slots, bench });
}

/** Remove a card from a slot to the bench. */
export function clearSlot(deck: Deck, slotId: string): Deck {
  const si = deck.slots.findIndex((s) => s.slot.id === slotId);
  if (si < 0 || !deck.slots[si].card) return deck;
  const slots = deck.slots.map((s) => ({ ...s }));
  const bench = [...deck.bench, slots[si].card!];
  slots[si].card = null;
  return refreshDeck({ ...deck, slots, bench });
}

export function deckCards(deck: Deck): CardInst[] {
  return deck.slots.map((s) => s.card).filter((c): c is CardInst => !!c);
}
