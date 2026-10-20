import { findCombos } from '../data/combos';
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
  { id: 'event', label: 'Event', accepts: ['happenings'], special: false },
  { id: 'flex', label: 'Place / Event', accepts: ['places', 'happenings'], special: false },
];

export const SPECIAL_SLOTS: SlotDef[] = [
  { id: 'sp1', label: 'Life / Stuff', accepts: ['life', 'stuff'], special: true },
  { id: 'sp2', label: 'Idea / Event', accepts: ['ideas', 'happenings'], special: true },
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

/** Value of a set of cards: ratings plus combo bonuses. */
export function setPotential(cards: CardInst[]): number {
  let total = 0;
  for (const c of cards) total += c.def.rating;
  for (const c of findCombos(cards.map((x) => x.def.id))) total += c.bonus;
  return total;
}

/**
 * Place cards in the order they were acquired, so the newest card always lands in a slot. When every
 * slot that takes it is full, it replaces the weakest older card there (preferring one of its own
 * category, so a new idea replaces the old idea), and the replaced card moves to any other free slot
 * that takes it, or to the bench.
 */
function placeByRecency(cards: CardInst[], slots: SlotDef[]): { assign: number[]; chosen: CardInst[] } {
  const assign: number[] = new Array(slots.length).fill(-1);
  const slotOrder = slots.map((_sl, i) => i).sort((a, b) => slots[a].accepts.length - slots[b].accepts.length);
  const freeSlotFor = (ci: number) => {
    const cat = cards[ci].def.cat as MainCategory;
    return slotOrder.find((i) => assign[i] === -1 && slots[i].accepts.includes(cat));
  };
  for (let ci = 0; ci < cards.length; ci++) {
    const cat = cards[ci].def.cat as MainCategory;
    if (!MAIN.includes(cat)) continue;
    const free = freeSlotFor(ci);
    if (free !== undefined) {
      assign[free] = ci;
      continue;
    }
    const taking = slotOrder.filter((i) => slots[i].accepts.includes(cat) && assign[i] >= 0);
    if (!taking.length) continue;
    const weakest = (pool: number[]) =>
      pool.slice().sort((a, b) => cards[assign[a]].def.rating - cards[assign[b]].def.rating || assign[a] - assign[b])[0];
    const sameCat = taking.filter((i) => cards[assign[i]].def.cat === cat);
    const si = weakest(sameCat.length ? sameCat : taking);
    const bumped = assign[si];
    assign[si] = ci;
    const relocate = freeSlotFor(bumped);
    if (relocate !== undefined) assign[relocate] = bumped;
  }
  const chosen = assign.filter((x) => x >= 0).map((x) => cards[x]);
  const remap = assign.map((x) => (x >= 0 ? chosen.indexOf(cards[x]) : -1));
  return { assign: remap, chosen };
}
const MAIN: MainCategory[] = ['life', 'stuff', 'places', 'ideas', 'happenings'];

export function slotsFor(unlocked: number): SlotDef[] {
  return [...BASE_SLOTS, ...SPECIAL_SLOTS.slice(0, Math.max(0, Math.min(3, unlocked)))];
}

/** Build the set from the collected cards (newest card always slotted), unlocking special slots through combos. */
export function buildDeck(cards: CardInst[], opts: { unlocked?: number } = {}): Deck {
  let unlocked = opts.unlocked ?? 0;
  let result: Deck | null = null;
  for (let iter = 0; iter < 4; iter++) {
    const slots = slotsFor(unlocked);
    const { assign, chosen } = placeByRecency(cards, slots);
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
