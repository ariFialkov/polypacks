// The showdown: what happens after the last pick. Each side's home place is its best slotted place.
// Events rally for it (home power), the side with the stronger home takes home turf, every card that
// fits the home is a home tie, and home combos count. One function scores it so the result, the
// opponent's steering and the showdown animation always agree.
import { findCombos, findHomeCombos } from '../data/combos';
import { EVENT_RALLY, EVENT_RALLY_MATCH, HOME_BONUS, HOME_TIE, PLACE_LINKS, tieLabel } from '../data/places';
import { buildDeck } from './deck';
import type { CardInst, Combo, Side } from './types';

/** The parts of a side the showdown needs (a structural subset of the match's SideState). */
export interface ShowdownSide {
  cards: CardInst[];
  cancelledCombos: string[];
  flags: { godMode: boolean };
}

export interface HomeLine {
  uid: string;
  n: number;
  /** the named connection to the home place (ties only) */
  label?: string;
}

export interface SideShowdown {
  /** slot ratings plus regular combos: the running total during the draft */
  base: number;
  home: CardInst | null;
  /** holds the home place's home field card: home place is theirs outright */
  homeField: boolean;
  /** home power: place rating plus rallies */
  power: number;
  rally: HomeLine[];
  ties: HomeLine[];
  homeCombos: Combo[];
  homeBonus: number;
  total: number;
}

export interface Showdown {
  you: SideShowdown;
  bot: SideShowdown | null;
  homeWinner: Side | 'tie' | null;
}

function slotted(ss: ShowdownSide): CardInst[] {
  const deck = buildDeck(ss.cards, { unlocked: ss.flags.godMode ? 3 : 0 });
  return deck.slots.map((x) => x.card).filter((c): c is CardInst => !!c);
}

function baseOf(cards: CardInst[], cancelled: string[]): number {
  let t = 0;
  for (const c of cards) t += c.def.rating;
  for (const k of findCombos(cards.map((c) => c.def.id))) if (!cancelled.includes(k.id)) t += k.bonus;
  return t;
}

function homeLines(home: CardInst | null, cards: CardInst[], cancelled: string[]) {
  const rally: HomeLine[] = [];
  const ties: HomeLine[] = [];
  let power = 0;
  let homeCombos: Combo[] = [];
  if (home) {
    power = home.def.rating;
    for (const c of cards) {
      if (c.uid === home.uid) continue;
      const label = tieLabel(home.def.id, c.def.id);
      if (c.def.cat === 'happenings') {
        const n = EVENT_RALLY + (label ? EVENT_RALLY_MATCH : 0);
        rally.push({ uid: c.uid, n });
        power += n;
      }
      if (label && (c.def.cat === 'life' || c.def.cat === 'stuff' || c.def.cat === 'happenings')) ties.push({ uid: c.uid, n: HOME_TIE, label });
    }
    homeCombos = findHomeCombos(home.def.id, cards.map((c) => c.def.id)).filter((k) => !cancelled.includes(k.id));
  }
  const own = ties.reduce((t, x) => t + x.n, 0) + homeCombos.reduce((t, k) => t + k.bonus, 0);
  return { rally, ties, power, homeCombos, own };
}

/**
 * One side's showdown before home place is decided. The home is the slotted place whose home field card
 * is also in the set; failing that, whichever slotted place scores best.
 */
export function sideShowdown(ss: ShowdownSide): SideShowdown {
  const cards = slotted(ss);
  const base = baseOf(cards, ss.cancelledCombos);
  const ids = new Set(cards.map((c) => c.def.id));
  const places = cards.filter((c) => c.def.cat === 'places');
  const fieldOf = (p: CardInst) => ids.has(PLACE_LINKS[p.def.id]?.homeField ?? '');
  let best: { home: CardInst | null; field: boolean; lines: ReturnType<typeof homeLines> } = { home: null, field: false, lines: homeLines(null, cards, ss.cancelledCombos) };
  for (const p of places) {
    const lines = homeLines(p, cards, ss.cancelledCombos);
    const field = fieldOf(p);
    const score = (field ? 1000 : 0) + lines.own + lines.power / 4;
    const bestScore = best.home ? (best.field ? 1000 : 0) + best.lines.own + best.lines.power / 4 : -1;
    if (score > bestScore) best = { home: p, field, lines };
  }
  const { rally, ties, power, homeCombos, own } = best.lines;
  return { base, home: best.home, homeField: best.field, power, rally, ties, homeCombos, homeBonus: 0, total: base + own };
}

/** What a side is worth on its own (base + home ties + home combos), without the home-turf contest. */
export function sideValue(ss: ShowdownSide): number {
  return sideShowdown(ss).total;
}

/** The full showdown for a match: both sides plus the home-turf contest. */
export function showdown(you: ShowdownSide, bot: ShowdownSide | null): Showdown {
  const y = sideShowdown(you);
  if (!bot) return { you: y, bot: null, homeWinner: null };
  const b = sideShowdown(bot);
  let homeWinner: Side | 'tie' | null = null;
  if (y.home || b.home) {
    // a home field pair wins outright; otherwise (or if both hold one) the stronger home power
    const yp = (y.homeField ? 10000 : 0) + (y.home ? y.power : -1);
    const bp = (b.homeField ? 10000 : 0) + (b.home ? b.power : -1);
    homeWinner = yp > bp ? 'you' : bp > yp ? 'bot' : 'tie';
  }
  if (homeWinner === 'you') y.homeBonus = HOME_BONUS;
  if (homeWinner === 'bot') b.homeBonus = HOME_BONUS;
  y.total += y.homeBonus;
  b.total += b.homeBonus;
  return { you: y, bot: b, homeWinner };
}

/** Final totals (what the result is decided on). */
export function finalTotals(you: ShowdownSide, bot: ShowdownSide | null): { you: number; bot: number } {
  const s = showdown(you, bot);
  return { you: s.you.total, bot: s.bot?.total ?? 0 };
}
