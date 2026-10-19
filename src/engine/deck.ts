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

/** Value of a set of cards: ratings plus combo bonuses. */
export function setPotential(cards: CardInst[]): number {
  let total = 0;
  for (const c of cards) total += c.def.rating;
  for (const c of findCombos(cards.map((x) => x.def.id))) total += c.bonus;
  return total;
}

function bestSubset(cards: CardInst[], slots: SlotDef[]): { assign: number[]; chosen: CardInst[] } {
  // Greedy: highest ratings first into the most specific free slot, then one-swap improvement so
  // a lower card that completes a combo can still make the cut.
  const order = cards.map((_c, i) => i).sort((a, b) => cards[b].def.rating - cards[a].def.rating);
  const assign: number[] = new Array(slots.length).fill(-1);
  const slotOrder = slots.map((_sl, i) => i).sort((a, b) => slots[a].accepts.length - slots[b].accepts.length);
  for (const ci of order) {
    const cat = cards[ci].def.cat as MainCategory;
    const si = slotOrder.find((i) => assign[i] === -1 && slots[i].accepts.includes(cat));
    if (si !== undefined) assign[si] = ci;
  }
  const scoreOf = (a: number[]) => setPotential(a.filter((x) => x >= 0).map((x) => cards[x]));
  let best = scoreOf(assign);
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 6) {
    improved = false;
    const used = new Set(assign.filter((x) => x >= 0));
    for (let ci = 0; ci < cards.length; ci++) {
      if (used.has(ci)) continue;
      const cat = cards[ci].def.cat as MainCategory;
      for (let si = 0; si < slots.length; si++) {
        if (!slots[si].accepts.includes(cat)) continue;
        const prev = assign[si];
        assign[si] = ci;
        const sc = scoreOf(assign);
        if (sc > best) {
          best = sc;
          improved = true;
          used.delete(prev);
          used.add(ci);
          break;
        }
        assign[si] = prev;
      }
      if (improved) break;
    }
  }
  const chosen = assign.filter((x) => x >= 0).map((x) => cards[x]);
  const remap = assign.map((x) => (x >= 0 ? chosen.indexOf(cards[x]) : -1));
  return { assign: remap, chosen };
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
