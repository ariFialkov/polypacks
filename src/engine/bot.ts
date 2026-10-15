import { CARDS, cardsOf } from '../data/cards';
import { Rng } from './rng';
import { cloneRound, playCard, sideScore, swapPlace, type RoundState, type SideState } from './round';
import { placeMult } from './deck';
import type { CardDef, CardInst, MainCategory, Side } from './types';

export interface RoundFate {
  playerWins: boolean;
  margin: number;
}

const BOT_NAMES = [
  'xX_Dale_Xx', 'capybara_mom', 'pack_goblin', 'florida_dan', 'notabot_42', 'ohio_final_boss', 'sippycup_sam', 'the_real_harambe',
  'lil_timeshare', 'jetski_jerry', 'post_nut_pete', 'mall_cop_mike', 'bees_bees_bees', 'uncle_bitcoin', 'queen_karen', 'trawler_tina',
  'peasant_paul', 'nepo_nate', 'dmv_survivor', 'pope_enjoyer', 'raccoon_rick', 'waffle_witch', 'crab_dad', 'tube_man_tony',
];

export function botIdentity(rng: Rng): { name: string } {
  return { name: rng.pick(BOT_NAMES) };
}

export const FLEX_CATS: MainCategory[] = ['life', 'stuff', 'ideas'];

/**
 * Build the bot's concealed hand to mirror the player's hand categories. The actual identities of
 * the bot's cards are only decided when they are revealed, which is what lets the round land on the
 * pre-computed result while every move still looks like a choice.
 */
export function buildBotSide(rng: Rng, you: SideState, name: string, excludeIds: Set<string>): Omit<SideState, 'field' | 'penalty' | 'swappedPlace'> {
  const cats = you.hand.map((c) => c.def.cat as MainCategory);
  const hand: CardInst[] = rng.shuffle(cats).map((cat, i) => ({ uid: `b${i + 1}`, def: placeholder(cat) }));
  const places = cardsOf('places').filter((c) => !excludeIds.has(c.id));
  const place = rng.weighted(places, (c) => 40 - Math.abs(c.rating - 28));
  return { side: 'bot', name, place: { uid: 'bp1', def: place }, altPlace: null, hand };
}

function placeholder(cat: MainCategory): CardDef {
  return { id: `?${cat}`, name: '???', cat, rating: 0, rarity: 1 };
}

function usedIds(state: RoundState): Set<string> {
  const ids = new Set<string>();
  for (const s of [state.you, state.bot]) {
    for (const f of s.field) ids.add(f.inst.def.id);
    for (const h of s.hand) ids.add(h.def.id);
    if (s.place) ids.add(s.place.def.id);
    if (s.altPlace) ids.add(s.altPlace.def.id);
  }
  return ids;
}

/** Score gap (bot - you) if the player immediately dumped every remaining card, under a given place choice. */
function dumpGap(state: RoundState, swapFirst: boolean): number {
  let st = cloneRound(state);
  st.turn = 'you';
  st.done = false;
  if (swapFirst) st = swapPlace(st, 'you');
  for (const c of [...st.you.hand]) {
    const s2 = cloneRound(st);
    s2.turn = 'you';
    s2.done = false;
    st = playCard(s2, 'you', c.uid);
    st.done = false;
  }
  return sideScore(st.bot) - sideScore(st.you);
}

/** Range of final gaps the player can still force with their remaining choices. */
function projectedGapRange(state: RoundState): { lo: number; hi: number; mid: number } {
  const a = dumpGap(state, false);
  const canSwap = state.you.hand.length > 0 && !!state.you.altPlace && !state.you.swappedPlace;
  const b = canSwap ? dumpGap(state, true) : a;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return { lo, hi, mid: (lo + hi) / 2 };
}

function contributionOf(state: RoundState, uid: string, def: CardDef): number {
  const st = cloneRound(state);
  const h = st.bot.hand.find((c) => c.uid === uid)!;
  h.def = def;
  st.turn = 'bot';
  st.done = false;
  const after = playCard(st, 'bot', uid);
  after.done = false;
  return projectedGapRange(after).mid;
}

/** Rough range of gap shift a concealed bot card of this category can still produce. */
function cardRange(state: RoundState, cat: MainCategory, used: Set<string>): { min: number; max: number } {
  if (cat === 'happenings') {
    const m = placeMult(state.bot.place, 'happenings');
    return { min: Math.round(8 * m), max: Math.round(55 * m) };
  }
  const m = placeMult(state.bot.place, cat);
  let min = Infinity;
  let max = -Infinity;
  for (const c of CARDS) {
    if (c.cat !== cat || used.has(c.id)) continue;
    const v = Math.round(c.rating * m);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!isFinite(min)) return { min: 0, max: 0 };
  return { min, max };
}

export interface BotChoice {
  uid: string;
  def: CardDef;
  thinkMs: number;
}

/**
 * Pick the bot's next card. The bot steers the gap toward the fated margin, spreading the
 * correction across its remaining cards so the final reveal looks like any other play. It
 * plans against everything the player could still do, so the last card always has room.
 */
export function chooseBotCard(state: RoundState, fate: RoundFate, rng: Rng): BotChoice {
  const bot = state.bot;
  const hand = bot.hand;
  if (hand.length === 0) throw new Error('bot has no cards');
  const targetGap = fate.playerWins ? -fate.margin : fate.margin;
  const gap = projectedGapRange(state);
  const k = hand.length;
  const used = usedIds(state);

  // keep at least one flexible card for the finale
  const flexInHand = hand.filter((c) => FLEX_CATS.includes(c.def.cat as MainCategory));
  let playable = hand;
  if (k > 1 && flexInHand.length === 1) playable = hand.filter((c) => c !== flexInHand[0]);
  if (k > 1 && state.you.hand.length > 0 && playable.some((c) => c.def.cat === 'happenings') && rng.chance(0.5)) {
    // happenings feel natural mid-round; bias to play them before the end
    playable = playable.filter((c) => c.def.cat === 'happenings');
  }

  type Cand = { uid: string; def: CardDef; contrib: number };
  const cands: Cand[] = [];
  for (const h of playable) {
    const pool = CARDS.filter((c) => c.cat === h.def.cat && !used.has(c.id));
    for (const def of pool) cands.push({ uid: h.uid, def, contrib: contributionOf(state, h.uid, def) });
  }
  if (cands.length === 0) {
    const h = playable[0];
    return { uid: h.uid, def: CARDS.find((c) => c.cat === h.def.cat)!, thinkMs: 900 };
  }

  let chosen: Cand;
  if (k === 1) {
    // final reveal: must land on the right side of zero, as close to the fated margin as possible
    const right = cands.filter((c) => (fate.playerWins ? c.contrib < 0 : c.contrib > 0));
    const pool = right.length ? right : cands;
    pool.sort((a, b) => Math.abs(a.contrib - targetGap) - Math.abs(b.contrib - targetGap));
    chosen = pool[0];
  } else {
    const share = (targetGap - gap.mid) / k;
    const scored = cands.map((c) => {
      // what the rest of the hand would have to cover, after this card, across the player's options
      const rest = hand.filter((h) => h.uid !== c.uid);
      let restMin = 0;
      let restMax = 0;
      const usedNow = new Set(used);
      usedNow.add(c.def.id);
      for (const h of rest) {
        const r = cardRange(state, h.def.cat as MainCategory, usedNow);
        restMin += r.min;
        restMax += r.max;
      }
      const shift = c.contrib - gap.mid;
      const needLo = targetGap - (gap.hi + shift); // player maximises their own score
      const needHi = targetGap - (gap.lo + shift); // player minimises it
      const slack = Math.max(6, (restMax - restMin) * 0.12);
      let penalty = Math.abs(shift - share);
      if (needLo < restMin + slack) penalty += (restMin + slack - needLo) * 5;
      if (needHi > restMax - slack) penalty += (needHi - (restMax - slack)) * 5;
      return { c, penalty };
    });
    scored.sort((a, b) => a.penalty - b.penalty);
    const top = scored.slice(0, Math.min(3, scored.length));
    chosen = rng.weighted(top, (t) => 1 / (1 + t.penalty)).c;
  }
  const thinkMs = 700 + rng.int(1400) + (k === 1 ? 600 : 0);
  return { uid: chosen.uid, def: chosen.def, thinkMs };
}

/** Apply the bot's choice: reveal the identity and play it. */
export function applyBotChoice(state: RoundState, choice: BotChoice): RoundState {
  const st = cloneRound(state);
  const h = st.bot.hand.find((c) => c.uid === choice.uid);
  if (!h) throw new Error('bot card missing');
  h.def = choice.def;
  return playCard(st, 'bot', choice.uid);
}

export function sideFor(s: Side) {
  return s;
}
