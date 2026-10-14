import { findCombos } from '../data/combos';
import { placeMult } from './deck';
import type { CardInst, Combo, Side } from './types';

export interface FieldCard {
  inst: CardInst;
  delta: number;
  halved: boolean;
  doubled: boolean;
  stolen: boolean;
}

export interface SideState {
  side: Side;
  name: string;
  place: CardInst | null;
  altPlace: CardInst | null;
  swappedPlace: boolean;
  hand: CardInst[];
  field: FieldCard[];
  penalty: number;
}

export interface RoundEvent {
  n: number;
  side: Side;
  kind: 'flip' | 'play' | 'effect' | 'swapPlace' | 'combo' | 'end';
  text: string;
  cardUid?: string;
  targetSide?: Side;
  targetUid?: string;
}

export interface RoundResult {
  youScore: number;
  botScore: number;
  winner: Side | 'tie';
  margin: number;
}

export interface RoundState {
  you: SideState;
  bot: SideState;
  turn: Side;
  events: RoundEvent[];
  done: boolean;
  result?: RoundResult;
  turnNo: number;
}

export function cardValue(fc: FieldCard, place: CardInst | null): number {
  const def = fc.inst.def;
  let v = def.rating * placeMult(place, def.cat);
  if (fc.halved) v /= 2;
  if (fc.doubled) v *= 2;
  v = Math.round(v) + fc.delta;
  return Math.max(0, v);
}

export function sideCombos(s: SideState): Combo[] {
  const ids = s.field.map((f) => f.inst.def.id);
  if (s.place) ids.push(s.place.def.id);
  return findCombos(ids);
}

export function sideScore(s: SideState): number {
  let total = s.place ? s.place.def.rating : 0;
  for (const f of s.field) total += cardValue(f, s.place);
  for (const c of sideCombos(s)) total += c.bonus;
  return Math.max(0, total - s.penalty);
}

export function other(side: Side): Side {
  return side === 'you' ? 'bot' : 'you';
}

export function sideOf(state: RoundState, side: Side): SideState {
  return side === 'you' ? state.you : state.bot;
}

export function cloneRound(state: RoundState): RoundState {
  const cs = (s: SideState): SideState => ({ ...s, hand: [...s.hand], field: s.field.map((f) => ({ ...f })) });
  return { ...state, you: cs(state.you), bot: cs(state.bot), events: [...state.events] };
}

export function createRound(you: Omit<SideState, 'field' | 'penalty' | 'swappedPlace'>, bot: Omit<SideState, 'field' | 'penalty' | 'swappedPlace'>): RoundState {
  const mk = (s: Omit<SideState, 'field' | 'penalty' | 'swappedPlace'>): SideState => ({ ...s, hand: [...s.hand], field: [], penalty: 0, swappedPlace: false });
  const state: RoundState = { you: mk(you), bot: mk(bot), turn: 'you', events: [], done: false, turnNo: 0 };
  for (const side of ['you', 'bot'] as Side[]) {
    const s = sideOf(state, side);
    if (s.place) push(state, { side, kind: 'flip', text: `${s.name} sets the scene: ${s.place.def.name}.`, cardUid: s.place.uid });
    else push(state, { side, kind: 'flip', text: `${s.name} has no place card.` });
  }
  return state;
}

function push(state: RoundState, ev: Omit<RoundEvent, 'n'>) {
  state.events.push({ n: state.events.length, ...ev });
}

export function remainingActions(s: SideState): number {
  return s.hand.length;
}

/** Swap in the alternate place card. A free action (does not use the turn). */
export function swapPlace(state: RoundState, side: Side): RoundState {
  const st = cloneRound(state);
  const s = sideOf(st, side);
  if (!s.altPlace || s.swappedPlace) throw new Error('no alternate place');
  const old = s.place;
  s.place = s.altPlace;
  s.altPlace = old;
  s.swappedPlace = true;
  push(st, { side, kind: 'swapPlace', text: `${s.name} moves the scene to ${s.place.def.name}.`, cardUid: s.place.uid });
  return st;
}

/** Play a card from hand. Happenings resolve immediately. */
export function playCard(state: RoundState, side: Side, uid: string): RoundState {
  if (state.done) throw new Error('round over');
  if (state.turn !== side) throw new Error('not your turn');
  const st = cloneRound(state);
  const s = sideOf(st, side);
  const o = sideOf(st, other(side));
  const idx = s.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) throw new Error('card not in hand');
  const [card] = s.hand.splice(idx, 1);
  const before = sideCombos(s).map((c) => c.id);
  const fc: FieldCard = { inst: card, delta: 0, halved: false, doubled: false, stolen: false };

  if (card.def.cat === 'happenings' && card.def.effect) {
    const e = card.def.effect;
    const mult = placeMult(s.place, 'happenings');
    switch (e.kind) {
      case 'boostSelf': {
        fc.delta = Math.round(e.amount * mult);
        s.field.push(fc);
        push(st, { side, kind: 'play', text: `${s.name} plays ${card.def.name} (+${fc.delta}).`, cardUid: card.uid });
        break;
      }
      case 'hitOpp': {
        const dmg = Math.round(e.amount * mult);
        o.penalty += dmg;
        s.field.push(fc);
        push(st, { side, kind: 'play', text: `${s.name} plays ${card.def.name}.`, cardUid: card.uid });
        push(st, { side, kind: 'effect', text: `${o.name} takes -${dmg}.`, targetSide: other(side) });
        break;
      }
      case 'fieldShake': {
        const dmg = Math.round(e.amount * mult);
        for (const f of [...s.field, ...o.field]) f.delta -= dmg;
        s.field.push(fc);
        push(st, { side, kind: 'play', text: `${s.name} plays ${card.def.name}. Every card on the table takes -${dmg}.`, cardUid: card.uid });
        break;
      }
      case 'halveOppTop': {
        s.field.push(fc);
        push(st, { side, kind: 'play', text: `${s.name} plays ${card.def.name}.`, cardUid: card.uid });
        const top = topCard(o);
        if (top) {
          top.halved = true;
          push(st, { side, kind: 'effect', text: `${o.name}'s ${top.inst.def.name} is halved.`, targetSide: other(side), targetUid: top.inst.uid });
        } else push(st, { side, kind: 'effect', text: 'Nothing to halve yet.' });
        break;
      }
      case 'doubleLast': {
        const last = [...s.field].reverse().find((f) => f.inst.def.cat !== 'happenings' && !f.doubled);
        s.field.push(fc);
        push(st, { side, kind: 'play', text: `${s.name} plays ${card.def.name}.`, cardUid: card.uid });
        if (last) {
          last.doubled = true;
          push(st, { side, kind: 'effect', text: `${last.inst.def.name} is doubled.`, targetSide: side, targetUid: last.inst.uid });
        } else push(st, { side, kind: 'effect', text: 'Nothing to bless yet.' });
        break;
      }
      case 'steal': {
        s.field.push(fc);
        push(st, { side, kind: 'play', text: `${s.name} plays ${card.def.name}.`, cardUid: card.uid });
        const low = lowestCard(o);
        if (low) {
          o.field.splice(o.field.indexOf(low), 1);
          low.stolen = true;
          s.field.push(low);
          push(st, { side, kind: 'effect', text: `${s.name} takes ${low.inst.def.name} from ${o.name}.`, targetSide: other(side), targetUid: low.inst.uid });
        } else push(st, { side, kind: 'effect', text: 'Nothing to take yet.' });
        break;
      }
    }
  } else {
    s.field.push(fc);
    push(st, { side, kind: 'play', text: `${s.name} plays ${card.def.name} (${cardValue(fc, s.place)}).`, cardUid: card.uid });
  }

  const after = sideCombos(s);
  for (const c of after) if (!before.includes(c.id)) push(st, { side, kind: 'combo', text: `${s.name} completes ${c.name}! +${c.bonus}` });

  st.turnNo++;
  advance(st);
  return st;
}

function topCard(s: SideState): FieldCard | null {
  let best: FieldCard | null = null;
  let bv = -1;
  for (const f of s.field) {
    if (f.inst.def.cat === 'happenings' || f.halved) continue;
    const v = cardValue(f, s.place);
    if (v > bv) {
      bv = v;
      best = f;
    }
  }
  return best;
}

function lowestCard(s: SideState): FieldCard | null {
  let best: FieldCard | null = null;
  let bv = Infinity;
  for (const f of s.field) {
    if (f.inst.def.cat === 'happenings') continue;
    const v = cardValue(f, s.place);
    if (v < bv) {
      bv = v;
      best = f;
    }
  }
  return best;
}

function advance(st: RoundState) {
  const youLeft = st.you.hand.length;
  const botLeft = st.bot.hand.length;
  if (youLeft === 0 && botLeft === 0) {
    finish(st);
    return;
  }
  const next = other(st.turn);
  if (sideOf(st, next).hand.length > 0) st.turn = next;
  // otherwise the same side keeps playing
}

function finish(st: RoundState) {
  const youScore = sideScore(st.you);
  const botScore = sideScore(st.bot);
  const winner: Side | 'tie' = youScore > botScore ? 'you' : botScore > youScore ? 'bot' : 'tie';
  st.done = true;
  st.result = { youScore, botScore, winner, margin: Math.abs(youScore - botScore) };
  push(st, { side: 'you', kind: 'end', text: winner === 'tie' ? 'Dead heat.' : `${sideOf(st, winner as Side).name} takes the round.` });
}
