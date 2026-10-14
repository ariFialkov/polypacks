import { hashString, Rng } from './rng';
import { Draft, type DraftState, STANDARD_LOADOUT } from './draft';
import { buildDeck, deckCards, type Deck } from './deck';
import { botIdentity, buildBotSide, chooseBotCard, applyBotChoice, type RoundFate } from './bot';
import { createRound, type RoundState, type SideState } from './round';
import type { CardInst } from './types';

export type Mode = 'series' | 'margin' | 'solitaire';
export type Phase = 'shop' | 'draft' | 'deck' | 'play' | 'roundResult' | 'gameOver';

export interface Fate {
  seed: number;
  rounds: RoundFate[];
  seal: string;
}

export interface RoundSummary {
  index: number;
  youScore: number;
  botScore: number;
  winner: 'you' | 'bot' | 'tie';
  margin: number;
  moneyDelta: number;
}

export interface GameState {
  mode: Mode;
  seed: number;
  fate: Fate;
  phase: Phase;
  roundIndex: number;
  you: { money: number; roundsWon: number };
  bot: { money: number; roundsWon: number; name: string; avatar: string };
  stake: number;
  spent: number;
  history: RoundSummary[];
  deck: Deck | null;
  round: RoundState | null;
  loadout: typeof STANDARD_LOADOUT;
  winner: 'you' | 'bot' | null;
  cashedOut: boolean;
}

export const MODE_INFO: Record<Mode, { title: string; tagline: string; rules: string[] }> = {
  series: {
    title: 'Zero-sum Series',
    tagline: 'Best of three. Most money on the table wins the round.',
    rules: ['Both start at $0.', 'Open packs, build a set, play it out.', 'Win 2 rounds to take the series.'],
  },
  margin: {
    title: 'Margin of Victory',
    tagline: 'Same stake, same packs. Take as much from them as you can.',
    rules: ['Both buy in with the same stake.', 'The loser pays the winner the score margin each round.', 'Cash out whenever, or play until someone is broke.'],
  },
  solitaire: {
    title: 'Solitaire',
    tagline: 'No opponent. Spend your stake on packs. Build the most valuable set.',
    rules: ['Buy packs with your stake.', 'Open them and pick the best cards.', 'Your set value is your score.'],
  },
};

export const STAKES: Record<Mode, number> = { series: 0, margin: 300, solitaire: 300 };

function sealFate(seed: number, rounds: RoundFate[]): string {
  return hashString(seed + ':' + rounds.map((r) => (r.playerWins ? 'W' : 'L') + r.margin).join(',')).toString(16).padStart(8, '0');
}

export function makeFate(seed: number, mode: Mode): Fate {
  const rng = new Rng(seed ^ 0x9e3779b9);
  const count = mode === 'series' ? 3 : mode === 'margin' ? 24 : 1;
  const rounds: RoundFate[] = [];
  for (let i = 0; i < count; i++) {
    const playerWins = rng.chance(0.49);
    // margins skew small with an occasional blowout
    const r = rng.next();
    const margin = r < 0.6 ? rng.range(3, 24) : r < 0.9 ? rng.range(25, 55) : rng.range(56, 110);
    rounds.push({ playerWins, margin });
  }
  return { seed, rounds, seal: sealFate(seed, rounds) };
}

export function newGame(mode: Mode, seed: number): GameState {
  const rng = new Rng(seed ^ 0x51ed270b);
  const bot = botIdentity(rng);
  const stake = STAKES[mode];
  return {
    mode,
    seed,
    fate: makeFate(seed, mode),
    phase: mode === 'solitaire' ? 'shop' : 'draft',
    roundIndex: 0,
    you: { money: stake, roundsWon: 0 },
    bot: { money: stake, roundsWon: 0, name: bot.name, avatar: bot.avatar },
    stake,
    spent: 0,
    history: [],
    deck: null,
    round: null,
    loadout: mode === 'solitaire' ? { basic: 0, enhanced: 0, baptized: 0, utility: 0 } : { ...STANDARD_LOADOUT },
    winner: null,
    cashedOut: false,
  };
}

export function draftSeed(game: GameState): number {
  return (game.seed + game.roundIndex * 7919 + 1) >>> 0;
}

export function createDraft(game: GameState): Draft {
  return new Draft(draftSeed(game), game.loadout);
}

export function deckFromDraft(draft: DraftState): Deck {
  return buildDeck(draft.picks, { unlocked: draft.godMode ? 3 : 0 });
}

export function youSide(deck: Deck, name = 'You'): Omit<SideState, 'field' | 'penalty' | 'swappedPlace'> {
  const cards = deckCards(deck);
  const places = cards.filter((c) => c.def.cat === 'places').sort((a, b) => b.def.rating - a.def.rating);
  const hand = cards.filter((c) => c.def.cat !== 'places');
  return { side: 'you', name, place: places[0] ?? null, altPlace: places[1] ?? null, hand };
}

export function startRound(game: GameState, deck: Deck): RoundState {
  const rng = new Rng((game.seed + game.roundIndex * 104729 + 7) >>> 0);
  const you = youSide(deck);
  const exclude = new Set(deckCards(deck).map((c) => c.def.id));
  const bot = buildBotSide(rng, { ...you, field: [], penalty: 0, swappedPlace: false }, game.bot.name, exclude);
  return createRound(you, bot);
}

export function roundFate(game: GameState): RoundFate {
  return game.fate.rounds[Math.min(game.roundIndex, game.fate.rounds.length - 1)];
}

export function botRng(game: GameState, state: RoundState): Rng {
  return new Rng((game.seed + game.roundIndex * 31 + state.turnNo * 977 + 13) >>> 0);
}

export function botMove(game: GameState, state: RoundState) {
  const rng = botRng(game, state);
  const choice = chooseBotCard(state, roundFate(game), rng);
  return { choice, next: applyBotChoice(state, choice) };
}

/** Settle a finished round into money / series state. */
export function settleRound(game: GameState, round: RoundState): GameState {
  if (!round.done || !round.result) throw new Error('round not finished');
  const r = round.result;
  const g: GameState = { ...game, you: { ...game.you }, bot: { ...game.bot }, history: [...game.history] };
  let moneyDelta = 0;
  if (g.mode === 'series') {
    g.you.money = r.youScore;
    g.bot.money = r.botScore;
    if (r.winner === 'you') g.you.roundsWon++;
    if (r.winner === 'bot') g.bot.roundsWon++;
    moneyDelta = r.winner === 'you' ? r.margin : r.winner === 'bot' ? -r.margin : 0;
  } else if (g.mode === 'margin') {
    if (r.winner === 'you') {
      moneyDelta = Math.min(r.margin, g.bot.money);
    } else if (r.winner === 'bot') {
      moneyDelta = -Math.min(r.margin, g.you.money);
    }
    g.you.money += moneyDelta;
    g.bot.money -= moneyDelta;
    if (r.winner === 'you') g.you.roundsWon++;
    if (r.winner === 'bot') g.bot.roundsWon++;
  }
  g.history.push({ index: g.roundIndex, youScore: r.youScore, botScore: r.botScore, winner: r.winner, margin: r.margin, moneyDelta });
  g.round = round;
  g.phase = 'roundResult';

  if (g.mode === 'series' && (g.you.roundsWon >= 2 || g.bot.roundsWon >= 2)) {
    g.phase = 'gameOver';
    g.winner = g.you.roundsWon >= 2 ? 'you' : 'bot';
  } else if (g.mode === 'margin' && (g.you.money <= 0 || g.bot.money <= 0 || g.roundIndex >= g.fate.rounds.length - 1)) {
    g.phase = 'gameOver';
    g.winner = g.you.money > g.bot.money ? 'you' : 'bot';
  }
  return g;
}

export function nextRound(game: GameState): GameState {
  return { ...game, roundIndex: game.roundIndex + 1, phase: 'draft', deck: null, round: null };
}

export function cashOut(game: GameState): GameState {
  return { ...game, phase: 'gameOver', cashedOut: true, winner: game.you.money >= game.bot.money ? 'you' : 'bot' };
}

export function solitaireResult(game: GameState, deck: Deck): GameState {
  const value = deck.potential;
  return { ...game, deck, phase: 'gameOver', you: { ...game.you, money: value }, winner: value - game.spent > 0 ? 'you' : 'bot' };
}

export function handCards(deck: Deck): CardInst[] {
  return deckCards(deck).filter((c) => c.def.cat !== 'places');
}
