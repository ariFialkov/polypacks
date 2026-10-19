import { hashString, Rng } from './rng';
import { botIdentity, makeBotDecisions, type RoundFate } from './bot';
import { createMatch, STANDARD_LOADOUT, type Loadout, type MatchResult, type MatchState } from './match';

export type Mode = 'series' | 'margin' | 'solitaire';
export type Phase = 'shop' | 'match' | 'roundResult' | 'gameOver';

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
  bot: { money: number; roundsWon: number; name: string };
  stake: number;
  spent: number;
  history: RoundSummary[];
  loadout: Loadout;
  winner: 'you' | 'bot' | null;
  cashedOut: boolean;
}

export const MODE_INFO: Record<Mode, { title: string; tagline: string; rules: string[] }> = {
  series: {
    title: 'Zero-sum',
    tagline: 'One game, winner takes all. Match their stake and take it.',
    rules: ['Pick a stake from $100 to $2,500; your opponent matches it.', 'Open packs, build a set, outplay them.', 'The higher set wins both stakes.'],
  },
  margin: {
    title: 'Margin of Victory',
    tagline: 'Same stake, same packs. Take as much from them as you can.',
    rules: ['Pick a buy-in from $100 to $1,000; both sides start with it.', 'The loser pays the winner the score margin each round, at $1 a point for a $300 buy-in and scaled to yours.', 'Cash out whenever, or play until someone is broke.'],
  },
  solitaire: {
    title: 'Solitaire',
    tagline: 'No opponent. Spend your stake on packs. Build the most valuable set.',
    rules: ['Buy packs with your stake.', 'Open them and pick the best cards.', 'Only the cards you pick count: empty slots score nothing.', 'Your set value minus what you spent is your score.'],
  },
};

export const STAKES: Record<Mode, number> = { series: 100, margin: 300, solitaire: 300 };

/** Stake choices for the two versus modes. Zero-sum is all-or-nothing on one game, so its stakes run higher. */
export const STAKE_OPTIONS: Record<'series' | 'margin', number[]> = {
  series: [100, 250, 500, 1000, 2500],
  margin: [100, 200, 300, 500, 1000],
};
/** Zero-sum is winner-takes-all: the winner gets their own stake back plus the opponent's matching stake. */
export function seriesPrize(entry: number): number {
  return (entry || STAKES.series) * 2;
}
/** Margin of Victory pays the score margin in dollars at a $300 buy-in, scaled to the buy-in chosen. */
export function marginRate(buyIn: number): number {
  return (buyIn || STAKES.margin) / STAKES.margin;
}

function sealFate(seed: number, rounds: RoundFate[]): string {
  return hashString(seed + ':' + rounds.map((r) => (r.playerWins ? 'W' : 'L') + r.margin).join(',')).toString(16).padStart(8, '0');
}

export function makeFate(seed: number, mode: Mode): Fate {
  const rng = new Rng(seed ^ 0x9e3779b9);
  const count = mode === 'margin' ? 24 : 1;
  const rounds: RoundFate[] = [];
  for (let i = 0; i < count; i++) {
    const playerWins = rng.chance(0.49);
    const r = rng.next();
    const margin = r < 0.6 ? rng.range(3, 24) : r < 0.9 ? rng.range(25, 55) : rng.range(56, 110);
    rounds.push({ playerWins, margin });
  }
  return { seed, rounds, seal: sealFate(seed, rounds) };
}

export function newGame(mode: Mode, seed: number, stakeChoice?: number): GameState {
  const rng = new Rng(seed ^ 0x51ed270b);
  const bot = botIdentity(rng);
  const stake = stakeChoice ?? STAKES[mode];
  const money = mode === 'series' ? 0 : stake;
  return {
    mode,
    seed,
    fate: makeFate(seed, mode),
    phase: mode === 'solitaire' ? 'shop' : 'match',
    roundIndex: 0,
    you: { money, roundsWon: 0 },
    bot: { money, roundsWon: 0, name: bot.name },
    stake,
    spent: 0,
    history: [],
    loadout: mode === 'solitaire' ? { basic: 0, enhanced: 0, baptized: 0, utility: 0 } : { ...STANDARD_LOADOUT },
    winner: null,
    cashedOut: false,
  };
}

export function roundFate(game: GameState): RoundFate {
  return game.fate.rounds[Math.min(game.roundIndex, game.fate.rounds.length - 1)];
}

export function matchSeed(game: GameState): number {
  return (game.seed + game.roundIndex * 7919 + 1) >>> 0;
}

/** Start the round's match with the opponent wired to the sealed fate. */
export function startMatch(game: GameState): MatchState {
  const m = createMatch(matchSeed(game), game.loadout, game.bot.name, game.mode === 'solitaire');
  m.botDecisions = makeBotDecisions(roundFate(game));
  return m;
}

/** Re-attach steering to a restored match. */
export function attachBot(game: GameState, m: MatchState): MatchState {
  m.botDecisions = makeBotDecisions(roundFate(game));
  return m;
}

/** Settle a finished match into money / series state. */
export function settleRound(game: GameState, r: MatchResult): GameState {
  const g: GameState = { ...game, you: { ...game.you }, bot: { ...game.bot }, history: [...game.history] };
  let moneyDelta = 0;
  if (g.mode === 'series') {
    g.you.money = r.youScore;
    g.bot.money = r.botScore;
    if (r.winner === 'you') g.you.roundsWon++;
    if (r.winner === 'bot') g.bot.roundsWon++;
    moneyDelta = r.winner === 'you' ? r.margin : r.winner === 'bot' ? -r.margin : 0;
  } else if (g.mode === 'margin') {
    const owed = r.margin > 0 ? Math.max(1, Math.round(r.margin * marginRate(g.stake))) : 0;
    if (r.winner === 'you') moneyDelta = Math.min(owed, g.bot.money);
    else if (r.winner === 'bot') moneyDelta = -Math.min(owed, g.you.money);
    g.you.money += moneyDelta;
    g.bot.money -= moneyDelta;
    if (r.winner === 'you') g.you.roundsWon++;
    if (r.winner === 'bot') g.bot.roundsWon++;
  }
  g.history.push({ index: g.roundIndex, youScore: r.youScore, botScore: r.botScore, winner: r.winner, margin: r.margin, moneyDelta });
  g.phase = 'roundResult';
  if (g.mode === 'series') {
    // one game: the result is final (a dead heat returns both stakes)
    g.phase = 'gameOver';
    g.winner = r.winner === 'tie' ? null : r.winner;
  } else if (g.mode === 'margin' && (g.you.money <= 0 || g.bot.money <= 0 || g.roundIndex >= g.fate.rounds.length - 1)) {
    g.phase = 'gameOver';
    g.winner = g.you.money > g.bot.money ? 'you' : 'bot';
  }
  return g;
}

export function nextRound(game: GameState): GameState {
  return { ...game, roundIndex: game.roundIndex + 1, phase: 'match' };
}

export function cashOut(game: GameState): GameState {
  return { ...game, phase: 'gameOver', cashedOut: true, winner: game.you.money >= game.bot.money ? 'you' : 'bot' };
}

export function solitaireResult(game: GameState, value: number): GameState {
  return { ...game, phase: 'gameOver', you: { ...game.you, money: value }, winner: value - game.spent > 0 ? 'you' : 'bot' };
}
