import { CARDS, GROUPS } from '../data/cards';
import { findCombos } from '../data/combos';
import { buildDeck } from './deck';
import { Rng } from './rng';
import { acquire, allInPlayIds, answer, cloneMatch, fillEmpty, flipCat, matchShowdown, matchTotals, pickCard, turnRng, unopened, type BotDecisions, type MPack, type MatchState, type SideState } from './match';
import { finalTotals, sideValue } from './finale';
import { HOME_BONUS, HOME_TIE } from '../data/places';
import type { CardDef, MainCategory, Side } from './types';

export interface RoundFate {
  playerWins: boolean;
  margin: number;
}

const BOT_NAMES = [
  'Dale Hendricks', 'Denise Okafor', 'Mitch Barlow', 'Tammy Pruitt', 'Doug Ferraro', 'Brenda Kowalski',
  'Rick Delgado', 'Linda Ashworth', 'Chet Wallace', 'Marge Fennimore', 'Todd Ritchie', 'Patty Osgood',
  'Ken Dalrymple', 'Barb Huxley', 'Gary Lindqvist', 'Rusty Shackleford', 'Justin Case', 'Paige Turner',
  'Will Power', 'Penny Wise', 'Al Dente', 'Sal Monella', 'Carol Singer', 'Rhoda Dendron',
]

export function botIdentity(rng: Rng): { name: string } {
  return { name: rng.pick(BOT_NAMES) };
}

/** The neutral stand-in used inside simulations so nested bot turns do not recurse into steering. */
const NEUTRAL: BotDecisions = {
  pickFor: (s, pack) => ({ def: neutralCard(s, pack.category) }),
  fillFor: (s, cat) => neutralCard(s, cat),
  catChoice: () => 'top',
};

function neutralCard(s: MatchState, cat?: MainCategory, target = 60): CardDef {
  const taken = allInPlayIds(s);
  const pool = CARDS.filter((c) => c.cat !== 'special' && (!cat || c.cat === cat) && !taken.has(c.id) && !c.ability);
  const sorted = pool.sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target));
  return sorted[0] ?? CARDS.find((c) => c.cat === (cat ?? 'stuff'))!;
}

/** Decisions the player would make when a simulated bot action asks them something. */
function autoAnswerYou(s: MatchState) {
  let guard = 0;
  while (s.prompt && s.promptFor === 'you' && guard++ < 6) {
    const p = s.prompt;
    if (p.kind === 'dui') {
      const sum = (uids: string[]) => uids.reduce((t, u) => t + (s.you.cards.find((c) => c.uid === u)?.def.rating ?? 0), 0);
      answer(s, { option: sum(p.vehicles) <= sum(p.impairments) ? 'vehicles' : 'impairments' });
    } else if (p.kind === 'champion') {
      const best = p.animals.slice().sort((a, b) => (s.you.cards.find((c) => c.uid === b)?.def.rating ?? 0) - (s.you.cards.find((c) => c.uid === a)?.def.rating ?? 0))[0];
      answer(s, { uid: best });
    } else answer(s, { accept: false });
  }
}

/** Current gap, bot minus you, as the showdown would score it right now. */
function gapNow(s: MatchState): number {
  const t = matchTotals(s);
  return t.bot - t.you;
}

/** How much a card would be worth to a side if added right now (ratings, combos, and its ability's bite). */
/** What taking `def` adds for `who` (best nine + combos + ability bite), and whether it fills an empty slot. */
function optionInfo(s: MatchState, who: Side, def: CardDef): { v: number; fills: number } {
  const ss = who === 'you' ? s.you : s.bot;
  const opp = who === 'you' ? s.bot : s.you;
  if (def.cat === 'special') return { v: def.ability === 'god' ? 120 : def.ability === 'devil' ? 70 : def.ability === 'redemption' ? 60 : 10, fills: 0 };
  // what the card really adds to the set: slots, combos, home ties and home combos included
  const unlocked = ss.flags.godMode ? 3 : 0;
  const trialCards = [...ss.cards, { uid: 'trial', def }];
  const before = buildDeck(ss.cards, { unlocked });
  const after = buildDeck(trialCards, { unlocked });
  const empties = (d: { slots: { card: unknown }[] }) => d.slots.filter((x) => !x.card).length;
  const fills = Math.max(0, empties(before) - empties(after));
  let v = sideValue({ ...ss, cards: trialCards }) - sideValue(ss);
  const oppRatings = opp.cards.map((c) => c.def.rating);
  const oppMax = oppRatings.length ? Math.max(...oppRatings) : 0;
  const oppMin = oppRatings.length ? Math.min(...oppRatings) : 0;
  switch (def.ability) {
    case 'rapture':
    case 'flamethrower':
      v += oppMax;
      break;
    case 'coup':
      v += Math.max(0, oppMax - (ss.cards.length ? Math.min(...ss.cards.map((c) => c.def.rating)) : 0));
      break;
    case 'trolley':
      v += oppMin;
      break;
    case 'bermuda':
      v += opp.cards.filter((c) => (GROUPS.boats as readonly string[]).includes(c.def.id)).reduce((t, c) => t + c.def.rating, 0);
      break;
    case 'pretty':
      v += Math.max(0, ...opp.cards.filter((c) => (GROUPS.prettyTargets as readonly string[]).includes(c.def.id)).map((c) => c.def.rating));
      break;
    case 'pentagon':
      v += opp.cards.some((c) => c.def.id === 'communism') ? 90 : 0;
      break;
    case 'wedding':
      v += Math.max(0, ...findCombos(opp.cards.map((c) => c.def.id)).map((c) => c.bonus));
      break;
    case 'dui': {
      const veh = opp.cards.filter((c) => (GROUPS.vehicles as readonly string[]).includes(c.def.id));
      const imp = opp.cards.filter((c) => (GROUPS.impairments as readonly string[]).includes(c.def.id));
      if (veh.length && imp.length) v += Math.min(veh.reduce((t, c) => t + c.def.rating, 0), imp.reduce((t, c) => t + c.def.rating, 0));
      break;
    }
    case 'bitcoin':
      v += 30; // an extra pack
      break;
    case 'defib':
      v += Math.max(0, ...ss.graveyard.map((c) => c.def.rating)) * 0.8;
      break;
  }
  return { v, fills };
}

/**
 * Range of what the player can still add from their remaining packs plus the commons (40..56) that
 * fill whatever slots are still empty at the end. An option that fills an empty slot forgoes that
 * slot's end fill, so it is worth its value minus the fill it replaces.
 */
function playerRemainingRange(s: MatchState): { lo: number; hi: number } {
  const emptyNow = deckSlots(s.you).filter((x) => !x.card).length;
  let lo = emptyNow * 40;
  let hi = emptyNow * 56;
  for (const p of unopened(s.you)) {
    if (p.cards && p.cards.length) {
      const infos = p.cards.map((c) => optionInfo(s, 'you', c));
      lo += Math.min(...infos.map((i) => i.v - 40 * i.fills));
      hi += Math.max(...infos.map((i) => i.v - 56 * i.fills));
    } else {
      lo += 55;
      hi += 99;
    }
  }
  // home turf: if the player isn't holding it and a remaining pack could bring a place or an event,
  // they could still take it (a swing of the bonus to them and away from the bot)
  const packsLeft = unopened(s.you);
  if (packsLeft.length && matchShowdown(s).homeWinner !== 'you') {
    const could = packsLeft.some((p) => !p.cards || p.cards.some((c) => c.cat === 'places' || c.cat === 'happenings'));
    if (could) hi += 2 * HOME_BONUS;
  }
  return { lo, hi };
}

/** Simulate the bot taking `def` from `pack` and return the resulting gap (after minigames, before further turns). */
function simulatePick(s: MatchState, pack: MPack, def: CardDef, second?: CardDef): MatchState {
  const sim = cloneMatch(s);
  sim.sim = true;
  sim.botDecisions = NEUTRAL;
  const p = sim.bot.packs.find((x) => x.id === pack.id)!;
  p.opened = true;
  p.picked = false;
  p.cards = second ? [def, second] : [def];
  if (second) p.catPack = true;
  sim.turn = 'bot';
  sim.prompt = null;
  try {
    pickCard(sim, 'bot', p.id, def.id, second?.id);
    autoAnswerYou(sim);
  } catch {
    // a simulated pick that throws is simply not a candidate
  }
  return sim;
}

/**
 * Where the bot's forced end fills can take the final gap. The next empty slot is tried card by card
 * (fills can complete combos and home ties, so a cheaper card can be worth more); later slots are
 * bounded. With one slot left the result is the exact set of reachable gaps.
 */
function fillOutcomes(s: MatchState): { lo: number; hi: number; points: number[] | null } {
  const empties = deckSlots(s.bot)
    .filter((x) => !x.card)
    .map((x) => x.slot.accepts[0] as MainCategory);
  const gapWith = (def?: CardDef) => {
    const bot = def ? { ...s.bot, cards: [...s.bot.cards, { uid: 'fill-trial', def }] } : s.bot;
    const t = finalTotals(s.you, bot);
    return t.bot - t.you;
  };
  if (!empties.length) {
    const g = gapWith();
    return { lo: g, hi: g, points: [g] };
  }
  const taken = allInPlayIds(s);
  const pool = CARDS.filter((c) => c.cat === empties[0] && c.rarity === 1 && !taken.has(c.id));
  const rest = { lo: 0, hi: 0 };
  for (const cat of empties.slice(1)) {
    const r = CARDS.filter((c) => c.cat === cat && c.rarity === 1 && !taken.has(c.id)).map((c) => c.rating);
    rest.lo += r.length ? Math.min(...r) : 40;
    rest.hi += (r.length ? Math.max(...r) : 56) + HOME_TIE + 30; // a later fill can also finish a combo
  }
  const gaps = pool.length ? pool.map((d) => gapWith(d)) : [gapWith() + 40];
  return { lo: Math.min(...gaps) + rest.lo, hi: Math.max(...gaps) + rest.hi, points: empties.length === 1 ? gaps : null };
}

/**
 * Score a reachable set of final gaps against the fated target. Exact points score by the best point.
 * A range is trusted only at its worst-case end (the end nearest losing): a range wholly on the fated
 * side scores by how far that end is from the target; one that straddles the line is a gamble.
 */
function outcomeScore(o: { lo: number; hi: number; points: number[] | null }, target: number, rightSide: (g: number) => boolean): number {
  if (o.points) return Math.min(...o.points.map((p) => (rightSide(p) ? 0 : 1000) + Math.abs(p - target)));
  const worst = rightSide(1) ? o.lo : o.hi; // bot must win: the low end is the risk; player must win: the high end
  if (rightSide(o.lo) && rightSide(o.hi)) return Math.abs(worst - target) * 0.5;
  return 200 + intervalScore(o.lo, o.hi, target, rightSide);
}

/** The match with the player's end fills applied (the bot's fills are still to choose). */
function withPlayerFills(s: MatchState): MatchState {
  const sim = cloneMatch(s);
  sim.sim = true;
  sim.botDecisions = NEUTRAL;
  fillEmpty(sim, sim.you);
  return sim;
}

function deckSlots(ss: SideState) {
  return deckOf(ss).slots;
}
import { deckOf } from './match';

/** Distance from a target to an interval, and whether the interval holds a point on the fated side. */
function intervalScore(lo: number, hi: number, target: number, rightSide: (g: number) => boolean): number {
  const holds = rightSide(lo) || rightSide(hi) || (lo < 0 && hi > 0);
  const dist = target < lo ? lo - target : target > hi ? target - hi : 0;
  return (holds ? 0 : 1000 + Math.min(Math.abs(lo - target), Math.abs(hi - target))) + dist;
}

export function makeBotDecisions(fate: RoundFate): BotDecisions {
  const targetGap = fate.playerWins ? -fate.margin : fate.margin;
  const rightSide = (gap: number) => (fate.playerWins ? gap < 0 : gap > 0);

  function candidatesFor(s: MatchState, pack: MPack): CardDef[] {
    const taken = allInPlayIds(s);
    const youPackIds = new Set<string>();
    for (const p of s.you.packs) for (const c of p.cards ?? []) youPackIds.add(c.id);
    return CARDS.filter((c) => c.cat !== 'special' && !taken.has(c.id) && !youPackIds.has(c.id) && (!pack.category || c.cat === pack.category));
  }

  /** What the bot's remaining packs and forced end fills can still add, given a simulated state. */
  function restBounds(sim: MatchState, pack: MPack): { min: number; max: number } {
    let min = 0;
    let max = 0;
    const slots = deckSlots(sim.bot);
    let empties = slots.filter((x) => !x.card).length;
    const lowestAll = Math.min(...slots.map((x) => x.card?.def.rating ?? 0));
    for (const p of unopened(sim.bot)) {
      if (p.id === pack.id) continue;
      if (p.category) {
        const pool = CARDS.filter((c) => c.cat === p.category);
        const catMax = Math.max(...pool.map((c) => c.rating));
        const catMin = Math.min(...pool.map((c) => c.rating));
        const fitting = slots.filter((x) => x.slot.accepts.includes(p.category!));
        const open = fitting.some((x) => !x.card);
        const lowest = Math.min(...fitting.map((x) => x.card?.def.rating ?? 0));
        min += open ? catMin : 0;
        max += open ? catMax : Math.max(0, catMax - lowest);
        if (open) empties--;
      } else {
        min += empties > 0 ? 40 : 0;
        max += empties > 0 ? 99 : Math.max(0, 99 - lowestAll);
        if (empties > 0) empties--;
      }
    }
    // whatever is still empty after the packs is force-filled with a common
    min += Math.max(0, empties) * 40;
    max += Math.max(0, empties) * 56;
    return { min, max };
  }

  /** The player total the bot plans against: pessimistic toward the fated side. */
  function planPoint(r: { lo: number; hi: number }): number {
    return fate.playerWins ? r.lo : r.hi;
  }

  function choose(s: MatchState, pack: MPack, cands: CardDef[], salt: number): CardDef {
    const rng = turnRng(s, salt);
    const botLeft = unopened(s.bot).filter((p) => p.id !== pack.id).length;
    const youLeft = unopened(s.you).length;
    const k = botLeft + 1;
    const range = playerRemainingRange(s);
    const isFinale = botLeft === 0;
    const base = gapNow(s);
    const needBefore = targetGap - (base - planPoint(range));
    const want = needBefore / k;
    type Sc = { def: CardDef; gap: number; penalty: number; info?: string };
    const scored: Sc[] = [];
    for (const def of cands) {
      const sim = simulatePick(s, pack, def);
      let gap: number;
      let penalty = 0;
      let info = '';
      if (isFinale && youLeft === 0) {
        const o = fillOutcomes(withPlayerFills(sim));
        gap = o.lo;
        penalty += outcomeScore(o, targetGap, rightSide);
      } else {
        gap = gapNow(sim);
        const r = playerRemainingRangeAfter(sim, range);
        if (isFinale) {
          // the player still has packs: hold against everything they can do
          const worst = gap - r.hi;
          const best = gap - r.lo;
          if (!rightSide(worst)) penalty += 1000 + Math.abs(worst - targetGap);
          if (!rightSide(best)) penalty += 500;
          penalty += Math.abs((worst + best) / 2 - targetGap);
        } else {
          const thisVal = gap - base;
          penalty += Math.abs(thisVal - want) * 0.6;
          const need = targetGap - (gap - planPoint(r)); // what the rest must add
          const rest = restBounds(sim, pack);
          const slack = 16;
          // past the floor: the only sane move is to add as little as possible (or as much, when it must win)
          if (need < rest.min + slack) penalty += (rest.min + slack - need) * 4 + Math.max(0, thisVal) * 2;
          if (need > rest.max - slack) penalty += (need - (rest.max - slack)) * 4 + Math.max(0, 120 - thisVal) * 2;
          info = `need ${need.toFixed(0)} rest ${rest.min}-${rest.max} r ${r.lo}-${r.hi}`;
        }
      }
      // keep it believable: ability cards and off-pack rarities are rarer finds
      if (def.ability) penalty += 12;
      if (pack.kind === 'basic' && def.rarity >= 5) penalty += 10;
      scored.push({ def, gap, penalty, info });
    }
    scored.sort((a, b) => a.penalty - b.penalty);
    const top = scored.slice(0, isFinale ? 1 : Math.min(4, scored.length));
    return rng.weighted(top, (t) => 1 / (1 + t.penalty)).def;
  }

  return {
    pickFor(s, pack) {
      const cands = candidatesFor(s, pack);
      if (!cands.length) return { def: neutralCard(s, pack.category) };
      const def = choose(s, pack, cands, 1);
      if (s.bot.flags.catNext) {
        const rest = cands.filter((c) => c.id !== def.id && c.cat === def.cat);
        if (rest.length) return { def, second: choose(s, pack, rest, 2) };
      }
      return { def };
    },
    fillFor(s, cat) {
      const taken = allInPlayIds(s);
      const pool = CARDS.filter((c) => c.cat === cat && c.rarity === 1 && !taken.has(c.id));
      if (!pool.length) return neutralCard(s, cat, 40);
      const scored = pool.map((def) => {
        const sim = cloneMatch(s);
        sim.sim = true;
        sim.botDecisions = NEUTRAL;
        acquire(sim, 'bot', def, 'fill');
        const g = gapNow(sim);
        const o = fillOutcomes(sim);
        // inside the reachable range, prefer the choice that leaves the target nearest the middle
        return { def, g, pen: outcomeScore(o, targetGap, rightSide) + (o.points ? 0 : Math.abs((o.lo + o.hi) / 2 - targetGap) * 0.05) };
      });
      scored.sort((a, b) => a.pen - b.pen);
      return scored[0].def;
    },
    catChoice(s) {
      if (!s.bot.catPair) return 'top';
      const now = gapNow(s);
      const sim = cloneMatch(s);
      sim.sim = true;
      sim.botDecisions = NEUTRAL;
      sim.turn = 'bot';
      flipCat(sim, 'bot');
      const flipped = gapNow(sim);
      const score = (g: number) => (rightSide(g) ? 0 : 1000) + Math.abs(g - targetGap);
      return score(flipped) < score(now) ? 'under' : 'top';
    },
  };
}

function playerRemainingRangeAfter(sim: MatchState, fallback: { lo: number; hi: number }): { lo: number; hi: number } {
  try {
    return playerRemainingRange(sim);
  } catch {
    return fallback;
  }
}
