import { describe, expect, it } from 'vitest';
import { Rng } from './rng';
import { CARDS } from '../data/cards';
import { COMBOS } from '../data/combos';
import { CARD_ART } from '../data/art';
import { newGame, startMatch, roundFate, settleRound } from './game';
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

describe('match', () => {
  it('a solitaire match completes with a full set', () => {
    for (let seed = 1; seed < 60; seed++) {
      const game = newGame('solitaire', seed);
      game.loadout = { basic: 3, enhanced: 2, baptized: 1, utility: 1 };
      const m = playRandom(startMatch(game), new Rng(seed));
      expect(m.result!.youScore).toBeGreaterThan(300);
    }
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
      n++;
      const g = settleRound(game, m.result!);
      expect(g.history.length).toBe(1);
    }
    expect(marginErr / n).toBeLessThan(20);
  });
});
