import { describe, expect, it } from 'vitest';
import { Rng } from './rng';
import { Draft } from './draft';
import { buildDeck, deckCards } from './deck';
import { newGame, createDraft, deckFromDraft, startRound, botMove, roundFate, settleRound } from './game';
import { playCard, swapPlace, type RoundState } from './round';
import { CARDS } from '../data/cards';
import { COMBOS } from '../data/combos';

function randomDraft(seed: number, rng: Rng): Draft {
  const draft = new Draft(seed);
  let guard = 0;
  while (!draft.isComplete() && guard++ < 100) {
    const open = draft.packs.filter((p) => !p.opened && !p.locked);
    if (open.length === 0) break;
    const pack = rng.pick(open);
    const cards = draft.open(pack.id, pack.kind === 'baptized' ? rng.pick(['life', 'stuff', 'ideas', 'places', 'happenings'] as const) : undefined);
    if (cards.length === 0) {
      pack.picked = 'none';
      continue;
    }
    if (draft.pack(pack.id).picked) continue; // god mode may have picked already
    draft.pick(pack.id, rng.pick(cards).id);
    // sometimes use charges
    if (draft.state.charges.premonition > 0) {
      const t = draft.packs.filter((p) => !p.opened && p.kind !== 'baptized');
      if (t.length) draft.peek(rng.pick(t).id);
    }
    if (draft.state.charges.dejavu > 0) {
      const t = draft.packs.filter((p) => !p.opened && p.kind !== 'baptized');
      if (t.length) draft.reroll(rng.pick(t).id);
    }
    if (draft.state.charges.delorean > 0 && rng.chance(0.5)) {
      const t = draft.packs.filter((p) => p.opened && p.picked && !p.picked.startsWith('taken'));
      if (t.length) draft.repick(rng.pick(t).id);
    }
  }
  return draft;
}

describe('card data', () => {
  it('has unique ids and every combo references real cards', () => {
    const ids = new Set(CARDS.map((c) => c.id));
    expect(ids.size).toBe(CARDS.length);
    for (const combo of COMBOS) for (const alts of combo.parts) for (const id of alts) expect(ids.has(id), `${combo.id} -> ${id}`).toBe(true);
  });
  it('is the same for the same seed', () => {
    const a = new Draft(42);
    const b = new Draft(42);
    expect(a.packs.map((p) => p.kind)).toEqual(b.packs.map((p) => p.kind));
    const pa = a.packs.find((p) => p.kind === 'basic')!;
    const pb = b.packs.find((p) => p.kind === 'basic')!;
    expect(a.open(pa.id).map((c) => c.id)).toEqual(b.open(pb.id).map((c) => c.id));
  });
});

describe('draft', () => {
  it('completes with a full set of picks for many seeds', () => {
    for (let seed = 1; seed < 300; seed++) {
      const rng = new Rng(seed * 17);
      const draft = randomDraft(seed, rng);
      expect(draft.isComplete()).toBe(true);
      expect(draft.state.picks.length).toBeGreaterThan(5);
      const deck = buildDeck(draft.state.picks, { unlocked: draft.state.godMode ? 3 : 0 });
      expect(deckCards(deck).length).toBeGreaterThan(0);
      for (const s of deck.slots) if (s.card) expect(s.slot.accepts).toContain(s.card.def.cat);
    }
  });
  it('delorean repick returns the same options', () => {
    const draft = new Draft(7);
    draft.state.charges.delorean = 1;
    const p = draft.packs.find((x) => x.kind === 'basic')!;
    const cards = draft.open(p.id);
    draft.pick(p.id, cards[0].id);
    draft.repick(p.id);
    expect(draft.state.picks.length).toBe(0);
    expect(draft.open(p.id).map((c) => c.id)).toEqual(cards.map((c) => c.id));
  });
});

function playRound(game: ReturnType<typeof newGame>, round: RoundState, rng: Rng): RoundState {
  let st = round;
  let guard = 0;
  while (!st.done && guard++ < 60) {
    if (st.turn === 'you') {
      if (st.you.altPlace && !st.you.swappedPlace && rng.chance(0.3)) st = swapPlace(st, 'you');
      st = playCard(st, 'you', rng.pick(st.you.hand).uid);
    } else {
      st = botMove(game, st).next;
    }
  }
  return st;
}

describe('fate', () => {
  it('always lands on the pre-sealed outcome', () => {
    let rounds = 0;
    let marginErr = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const game = newGame(seed % 2 ? 'series' : 'margin', seed * 1000 + 3);
      const rng = new Rng(seed);
      const draft = randomDraft(draftSeedOf(game), rng);
      const deck = deckFromDraft(draft.state);
      const round = startRound(game, deck);
      expect(round.bot.hand.length).toBe(round.you.hand.length);
      const done = playRound(game, round, rng);
      expect(done.done).toBe(true);
      const fate = roundFate(game);
      const expected = fate.playerWins ? 'you' : 'bot';
      expect(done.result!.winner, `seed ${seed}: you ${done.result!.youScore} bot ${done.result!.botScore} fate ${JSON.stringify(fate)}`).toBe(expected);
      marginErr += Math.abs(done.result!.margin - fate.margin);
      rounds++;
      const settled = settleRound(game, done);
      expect(settled.history.length).toBe(1);
    }
    expect(marginErr / rounds).toBeLessThan(12);
  });
});

function draftSeedOf(game: ReturnType<typeof newGame>) {
  return (game.seed + game.roundIndex * 7919 + 1) >>> 0;
}

describe('game helpers', () => {
  it('creates a draft from the game seed', () => {
    const game = newGame('series', 99);
    const d = createDraft(game);
    expect(d.packs.length).toBe(10);
  });
});
