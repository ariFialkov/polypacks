import { describe, expect, it } from 'vitest';
import { Rng } from './rng';
import { CARDS, CARD_BY_ID } from '../data/cards';
import { PLACE_THEMES, THEMES, HOME_BONUS } from '../data/places';
import { buildDeck } from './deck';
import { showdown } from './finale';
import { COMBOS, findCombos } from '../data/combos';
import { CARD_ART } from '../data/art';
import { marginRate, newGame, seriesPrize, startMatch, roundFate, settleRound, STAKE_OPTIONS } from './game';
import { answer, botShouldAct, flipCat, openPack, pickCard, runBotTurn, unopened, useDelorean, usePeek, type MatchState } from './match';
import type { MainCategory } from './types';

const CATS: MainCategory[] = ['life', 'stuff', 'ideas', 'places', 'happenings'];

/** A random but legal player: opens packs in random order, takes random cards, answers prompts at random. */
function playRandom(m: MatchState, rng: Rng, log = false): MatchState {
  let guard = 0;
  while (m.phase === 'draft' && guard++ < 400) {
    if (m.prompt) {
      answerRandom(m, rng);
      continue;
    }
    if (botShouldAct(m)) {
      runBotTurn(m);
      continue;
    }
    if (m.turn !== 'you') throw new Error('stuck: bot turn without progress');
    const you = m.you;
    // free actions sometimes
    if (you.catPair && rng.chance(0.3)) flipCat(m, 'you');
    if (you.charges.peek > 0) {
      const t = unopened(you).filter((p) => p.kind !== 'baptized');
      if (t.length) usePeek(m, 'you', rng.pick(t).id);
    }
    if (you.charges.delorean > 0 && rng.chance(0.4)) {
      const t = you.packs.filter((p) => p.opened && p.picked && !p.destroyed);
      if (t.length) useDelorean(m, 'you', rng.pick(t).id);
    }
    const open = you.packs.find((p) => p.opened && !p.picked);
    if (open) {
      const cards = open.cards ?? [];
      const c = rng.pick(cards);
      const second = open.catPack ? cards.find((x) => x.id !== c.id && x.cat !== 'special' && c.cat !== 'special') : undefined;
      pickCard(m, 'you', open.id, c.id, second?.id);
      if (log) console.log('YOU take', c.name, c.rating, '->', m.you.cards.length);
      continue;
    }
    const packs = unopened(you).filter((p) => !p.locked);
    if (!packs.length) throw new Error('no packs but still my turn');
    const p = rng.pick(packs);
    openPack(m, 'you', p.id, p.kind === 'baptized' ? rng.pick(CATS) : undefined);
  }
  if (m.phase === 'draft') throw new Error('did not finish');
  return m;
}

function answerRandom(m: MatchState, rng: Rng) {
  const p = m.prompt!;
  switch (p.kind) {
    case 'bitcoin':
    case 'pentagon':
    case 'postnut':
      answer(m, { accept: rng.chance(0.6) });
      break;
    case 'area51':
      if (p.mode === 'initial') answer(m, p.targets.length && rng.chance(0.6) ? { uid: rng.pick(p.targets) } : {});
      else answer(m, { accept: rng.chance(0.6) });
      break;
    case 'flamethrower':
    case 'pretty':
      answer(m, { uid: rng.pick(p.targets) });
      break;
    case 'coup':
      answer(m, { uid: rng.pick(p.theirs), uid2: rng.pick(p.mine) });
      break;
    case 'trolley':
      if (p.packIds.length && (!p.cardUid || rng.chance(0.5))) answer(m, { option: 'pack', uid: rng.pick(p.packIds) });
      else answer(m, { option: 'card' });
      break;
    case 'wedding':
      answer(m, { uid: rng.pick(p.combos) });
      break;
    case 'defib':
      answer(m, { uid: rng.pick(p.graveyard) });
      break;
    case 'dui':
      answer(m, { option: rng.chance(0.5) ? 'vehicles' : 'impairments' });
      break;
    case 'champion':
      answer(m, { uid: rng.pick(p.animals) });
      break;
    case 'peek':
      answer(m, { uid: rng.pick(p.packIds) });
      break;
  }
}

describe('card data', () => {
  it('has unique ids, art for every card, and combos that reference real cards', () => {
    const ids = new Set(CARDS.map((c) => c.id));
    expect(ids.size).toBe(CARDS.length);
    for (const c of CARDS) expect(CARD_ART[c.id], `art for ${c.id}`).toBeTruthy();
    for (const combo of COMBOS) for (const alts of combo.parts) for (const id of alts) expect(ids.has(id), `${combo.id} -> ${id}`).toBe(true);
    expect(ids.has('divorce')).toBe(false);
  });
  it('rates every non-??? card on a 40–99 scale', () => {
    for (const c of CARDS) if (c.cat !== 'special') expect(c.rating >= 40 && c.rating <= 99, c.id).toBe(true);
  });
});

describe('places, combos and slots', () => {
  it('gives every place themes and every idea a combo', () => {
    for (const c of CARDS.filter((x) => x.cat === 'places')) expect(PLACE_THEMES[c.id]?.length, c.id).toBeGreaterThan(0);
    for (const ids of Object.values(THEMES)) for (const id of ids) expect(CARD_BY_ID[id], id).toBeTruthy();
    for (const c of CARDS.filter((x) => x.cat === 'ideas')) expect(COMBOS.some((k) => !k.home && k.parts.some((alts) => alts.includes(c.id))), c.id).toBe(true);
    for (const k of COMBOS.filter((x) => x.home)) expect(k.parts[0]).toEqual([k.home]);
    expect(findCombos(['las-vegas', 'open-mic-night']).some((k) => k.id === 'home-vegas')).toBe(false);
  });
  it('slots the newest card, replacing the old one of its kind', () => {
    const inst = (id: string, n: number) => ({ uid: `u${n}`, def: CARD_BY_ID[id] });
    const deck = buildDeck([inst('theory-of-relativity', 1), inst('algebra', 2)]);
    expect(deck.slots.find((x) => x.slot.id === 'idea')!.card!.def.id).toBe('algebra');
    expect(deck.bench.map((c) => c.def.id)).toEqual(['theory-of-relativity']);
    const lives = buildDeck([inst('harambe', 1), inst('the-pope', 2), inst('snail', 3)]);
    const slotted = lives.slots.filter((x) => x.card).map((x) => x.card!.def.id).sort();
    expect(slotted).toEqual(['harambe', 'snail'].sort()); // the weaker older life (the pope) is bumped
  });
  it('scores the showdown: home turf to the stronger home, ties for cards that fit', () => {
    const side = (ids: string[]) => ({ cards: ids.map((id, i) => ({ uid: `${id}-${i}`, def: CARD_BY_ID[id] })), cancelledCombos: [], flags: { godMode: false } });
    const sd = showdown(side(['las-vegas', 'frat-guy', 'open-mic-night', 'tornado']), side(['dmv', 'snail']));
    expect(sd.you.home!.def.id).toBe('las-vegas');
    expect(sd.homeWinner).toBe('you');
    expect(sd.you.homeBonus).toBe(HOME_BONUS);
    expect(sd.you.ties.length).toBe(2); // frat guy and open mic night fit the party
    expect(sd.you.homeCombos.map((k) => k.id)).toContain('home-vegas');
  });
  it('plants real combo chances in the player\'s packs', () => {
    let withChance = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const m = startMatch(newGame('series', seed * 31 + 7));
      const ids = new Set(m.you.packs.flatMap((p) => (p.cards ?? []).map((c) => c.id)));
      if (COMBOS.some((k) => k.parts.every((alts) => alts.some((id) => ids.has(id))))) withChance++;
    }
    expect(withChance).toBe(60);
  });
});

describe('stakes', () => {
  it('offers five stakes per versus mode, series higher', () => {
    expect(STAKE_OPTIONS.series).toHaveLength(5);
    expect(STAKE_OPTIONS.margin).toHaveLength(5);
    expect(STAKE_OPTIONS.series[4]).toBeGreaterThan(STAKE_OPTIONS.margin[4]);
    expect(seriesPrize(500)).toBe(1000);
    const z = settleRound(newGame('series', 9, 500), { youScore: 480, botScore: 470, winner: 'you', margin: 10 });
    expect(z.phase).toBe('gameOver');
    expect(z.winner).toBe('you');
  });
  it('scales margin payouts with the buy-in', () => {
    const r = { youScore: 500, botScore: 460, winner: 'you' as const, margin: 40 };
    expect(settleRound(newGame('margin', 7, 300), r).history[0].moneyDelta).toBe(40);
    expect(settleRound(newGame('margin', 7, 1000), r).history[0].moneyDelta).toBe(Math.round(40 * marginRate(1000)));
    expect(settleRound(newGame('margin', 7, 100), r).history[0].moneyDelta).toBe(13);
    const g = newGame('series', 7, 1000);
    expect(g.stake).toBe(1000);
    expect(g.you.money).toBe(0);
  });
});

describe('match', () => {
  it('a solitaire match completes and only scores the cards picked', () => {
    for (let seed = 1; seed < 60; seed++) {
      const game = newGame('solitaire', seed);
      game.loadout = { basic: 3, enhanced: 2, baptized: 1, utility: 1 };
      const m = playRandom(startMatch(game), new Rng(seed));
      expect(m.result!.youScore).toBeGreaterThan(150);
      expect(m.events.some((e) => e.text.includes('fill an empty'))).toBe(false);
    }
    const small = newGame('solitaire', 5);
    small.loadout = { basic: 2, enhanced: 0, baptized: 0, utility: 0 };
    const m = playRandom(startMatch(small), new Rng(5));
    expect(m.you.cards.length).toBeLessThanOrEqual(4);
    expect(m.result!.youScore).toBeLessThan(260);
  });
  it('always lands on the pre-sealed outcome', () => {
    let marginErr = 0;
    let n = 0;
    const N = Number(process.env.FATE_SEEDS || 300);
    for (let seed = 1; seed <= N; seed++) {
      const game = newGame(seed % 2 ? 'series' : 'margin', seed * 1000 + 3);
      const m = playRandom(startMatch(game), new Rng(seed));
      const fate = roundFate(game);
      const expected = fate.playerWins ? 'you' : 'bot';
      expect(m.result!.winner, `seed ${seed}: you ${m.result!.youScore} bot ${m.result!.botScore} fate ${JSON.stringify(fate)}`).toBe(expected);
      marginErr += Math.abs(m.result!.margin - fate.margin);
      const sd = showdown(m.you, m.bot);
      expect(m.result!.youScore).toBe(sd.you.total);
      expect(m.result!.botScore).toBe(sd.bot!.total);
      n++;
      const g = settleRound(game, m.result!);
      expect(g.history.length).toBe(1);
    }
    expect(marginErr / n).toBeLessThan(20);
  });
});
