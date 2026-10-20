import { useSyncExternalStore } from 'react';
import { PACK_PRICES, answer, botShouldAct, deckOf, flipCat, openPack, pickCard, runBotTurn, unopened, useDelorean, usePeek, type Answer, type MatchState, type MinigameOutcome, type SideState } from '../engine/match';
import { attachBot, cashOut, newGame, nextRound, seriesPrize, settleRound, solitaireResult, startMatch, STAKE_OPTIONS, type GameState, type Mode, STAKES } from '../engine/game';
import { randomSeed } from '../engine/rng';
import type { CardDef, MainCategory } from '../engine/types';
import { sfx, soundEnabled, setSoundEnabled } from './sound';

export interface Toast {
  id: number;
  text: string;
  tone?: 'info' | 'good' | 'bad';
}

export interface OpeningPack {
  packId: string;
  cards: CardDef[];
  mode: 'open' | 'peek';
  revealed: string[];
  stage: 'tear' | 'fan';
  catPack: boolean;
  divine?: string;
  firstPick?: string; // Schrödinger: the card chosen to stay up
}

export interface Snapshot {
  game: GameState | null;
  match: MatchState | null;
  wallet: number;
  dealing: boolean;
  opening: OpeningPack | null;
  autoReveal: boolean;
  botStatus: string;
  botBusy: boolean;
  specialFx: CardDef | null;
  minigameShow: MinigameOutcome | null;
  /** the end-of-match showdown is playing (the result waits for it) */
  showdown: boolean;
  /** a combo that was just completed: its cards flash on the board and the score pop names them */
  comboFlash: ComboFlash | null;
  freshUids: string[]; // cards that just arrived (animate)
  toasts: Toast[];
  tool: 'delorean' | 'peek' | null;
  highScores: number[];
  sound: boolean;
  menuOpen: boolean;
  version: number;
}

export interface ComboFlash {
  side: 'you' | 'bot';
  name: string;
  bonus: number;
  uids: string[];
  cards: string[];
  home?: boolean;
  key: number;
}

/** The combos a side has active right now, with the slotted cards that make each one. */
export function activeComboCards(ss: SideState): { id: string; name: string; bonus: number; uids: string[]; cards: string[] }[] {
  const deck = deckOf(ss);
  const slotted = deck.slots.map((x) => x.card).filter((c): c is NonNullable<typeof c> => !!c);
  return deck.combos
    .filter((k) => !ss.cancelledCombos.includes(k.id))
    .map((k) => {
      const inCombo = slotted.filter((c) => k.parts.some((alts) => alts.includes(c.def.id)));
      return { id: k.id, name: k.name, bonus: k.bonus, uids: inCombo.map((c) => c.uid), cards: inCombo.map((c) => c.def.name) };
    });
}

const SAVE_KEY = 'polypacks.save.v3';
const SCORES_KEY = 'polypacks.scores.v1';
const WALLET_KEY = 'polypacks.wallet.v1';
const AUTO_KEY = 'polypacks.autoreveal';
export const WALLET_FLOOR = 500;

/** What the wallet can stake: below the cheapest table, the house fronts the floor. */
export function stakeBudget(wallet: number, mode: 'series' | 'margin'): number {
  return wallet < STAKE_OPTIONS[mode][0] ? Math.max(wallet, WALLET_FLOOR) : wallet;
}

const BOT_LINES = ['is weighing options…', 'is reading card text very slowly…', 'is building a combo (allegedly)…', 'hesitated. Then committed.', 'is not telling.', 'is eyeing your set…'];

function readNum(key: string, def: number): number {
  try {
    const v = localStorage.getItem(key);
    return v === null ? def : Number(v) || def;
  } catch {
    return def;
  }
}
function writeNum(key: string, v: number) {
  try {
    localStorage.setItem(key, String(v));
  } catch {
    /* ignore */
  }
}

class Controller {
  private snap: Snapshot;
  private listeners = new Set<() => void>();
  private toastId = 0;
  private timers: number[] = [];
  private shownMinigames = 0;
  private shownEvents = 0;

  constructor() {
    let auto = false;
    try {
      auto = localStorage.getItem(AUTO_KEY) === 'on';
    } catch {
      /* ignore */
    }
    this.snap = {
      game: null,
      match: null,
      wallet: readNum(WALLET_KEY, 1000),
      dealing: false,
      opening: null,
      autoReveal: auto,
      botStatus: '',
      botBusy: false,
      specialFx: null,
      minigameShow: null, showdown: false, comboFlash: null,
      freshUids: [],
      toasts: [],
      tool: null,
      highScores: loadScores(),
      sound: soundEnabled(),
      menuOpen: false,
      version: 0,
    };
    this.load();
  }

  // ───────────── plumbing ─────────────
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.snap;

  private commit(patch: Partial<Snapshot>) {
    this.snap = { ...this.snap, ...patch, version: this.snap.version + 1 };
    for (const l of this.listeners) l();
    this.save();
  }
  /** The match object is mutated by the engine; bump the snapshot so React sees it. */
  private touch(patch: Partial<Snapshot> = {}) {
    const m = this.snap.match;
    this.commit({ ...patch, match: m ? { ...m } : null });
  }
  private toast(text: string, tone: Toast['tone'] = 'info') {
    const id = ++this.toastId;
    this.snap = { ...this.snap, toasts: [...this.snap.toasts, { id, text, tone }], version: this.snap.version + 1 };
    for (const l of this.listeners) l();
    this.later(() => {
      this.snap = { ...this.snap, toasts: this.snap.toasts.filter((t) => t.id !== id), version: this.snap.version + 1 };
      for (const l of this.listeners) l();
    }, 3200);
  }
  private later(fn: () => void, ms: number) {
    this.timers.push(window.setTimeout(fn, ms));
  }
  private clearTimers() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }
  private setWallet(v: number) {
    writeNum(WALLET_KEY, v);
    this.commit({ wallet: v });
  }

  private save() {
    try {
      const { game, match } = this.snap;
      if (!game) {
        localStorage.removeItem(SAVE_KEY);
        return;
      }
      const m = match ? { ...match, botDecisions: null } : null;
      localStorage.setItem(SAVE_KEY, JSON.stringify({ game, match: m, shownMinigames: this.shownMinigames, shownEvents: this.shownEvents }));
    } catch {
      /* ignore */
    }
  }
  private load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data.game) return;
      const match: MatchState | null = data.match ? attachBot(data.game, data.match) : null;
      this.shownMinigames = data.shownMinigames ?? match?.minigames.length ?? 0;
      this.shownEvents = data.shownEvents ?? match?.events.length ?? 0;
      this.snap = { ...this.snap, game: data.game, match };
      if (match) this.later(() => this.afterEngine(), 600);
    } catch {
      /* ignore */
    }
  }

  // ───────────── home / wallet ─────────────
  openMenu(open: boolean) {
    if (open) sfx.tap();
    this.commit({ menuOpen: open });
  }
  toggleSound() {
    const v = !this.snap.sound;
    setSoundEnabled(v);
    this.commit({ sound: v });
  }
  toggleAutoReveal() {
    const v = !this.snap.autoReveal;
    try {
      localStorage.setItem(AUTO_KEY, v ? 'on' : 'off');
    } catch {
      /* ignore */
    }
    this.commit({ autoReveal: v });
    if (v && this.snap.opening && this.snap.opening.stage === 'fan') this.autoFlip();
  }

  home() {
    this.clearTimers();
    this.commit({ game: null, match: null, opening: null, botBusy: false, tool: null, dealing: false, specialFx: null, menuOpen: false, minigameShow: null, showdown: false, comboFlash: null, freshUids: [] });
  }

  start(mode: Mode, stakeChoice?: number) {
    this.clearTimers();
    let wallet = this.snap.wallet;
    let stake = STAKES[mode];
    if (mode !== 'solitaire') {
      const options = STAKE_OPTIONS[mode];
      stake = stakeChoice && options.includes(stakeChoice) ? stakeChoice : options[0];
      const budget = stakeBudget(wallet, mode);
      if (budget > wallet) {
        wallet = budget;
        this.toast(`The house fronts you $${WALLET_FLOOR}.`, 'good');
      }
      if (stake > wallet) {
        this.toast(`That table needs $${stake}.`, 'bad');
        return;
      }
      wallet -= stake;
    } else if (wallet < stake) {
      wallet = Math.max(wallet, WALLET_FLOOR);
      this.toast(`The house fronts you $${WALLET_FLOOR}.`, 'good');
    }
    writeNum(WALLET_KEY, wallet);
    const game = newGame(mode, randomSeed(), stake);
    sfx.cash();
    this.commit({ game, wallet, match: null, opening: null, botBusy: false, tool: null, menuOpen: false, specialFx: null, minigameShow: null, showdown: false, comboFlash: null, freshUids: [] });
    if (mode !== 'solitaire') this.beginMatch();
  }

  // ───────────── solitaire shop ─────────────
  setLoadout(kind: keyof typeof PACK_PRICES, delta: number) {
    const game = this.snap.game;
    if (!game || game.phase !== 'shop') return;
    const loadout = { ...game.loadout };
    const next = Math.max(0, loadout[kind] + delta);
    const cost = Object.entries({ ...loadout, [kind]: next }).reduce((s, [k, n]) => s + PACK_PRICES[k as keyof typeof PACK_PRICES] * n, 0);
    const budget = Math.max(this.snap.wallet, game.stake);
    if (cost > budget) {
      this.toast('Not enough in the wallet for that.', 'bad');
      return;
    }
    sfx.tap();
    loadout[kind] = next;
    this.commit({ game: { ...game, loadout, spent: cost } });
  }

  beginMatch() {
    const game = this.snap.game;
    if (!game) return;
    if (game.mode === 'solitaire') {
      if (game.spent <= 0) {
        this.toast('Buy at least one pack.', 'bad');
        return;
      }
      this.setWallet(this.snap.wallet - game.spent);
    }
    const match = startMatch(game);
    this.shownMinigames = 0;
    this.shownEvents = match.events.length;
    this.knownCombos = { you: [], bot: [] };
    this.commit({ game: { ...game, phase: 'match' }, match, opening: null, botStatus: game.mode === 'solitaire' ? '' : 'is shuffling…', tool: null, dealing: true, freshUids: [] });
    for (let i = 0; i < match.you.packs.length; i++) this.later(() => sfx.deal(), 120 + i * 90);
    this.later(() => this.commit({ dealing: false, botStatus: game.mode === 'solitaire' ? '' : 'is eyeing the packs…' }), 1900);
  }

  // ───────────── after every engine call ─────────────
  /** Surface new events, minigames, prompts; schedule the opponent; settle when done. */
  private afterEngine() {
    const m = this.snap.match;
    const game = this.snap.game;
    if (!m || !game) return;
    // fresh cards: anything acquired in the new events
    const newEvents = m.events.slice(this.shownEvents);
    this.shownEvents = m.events.length;
    for (const e of newEvents) if (e.kind === 'ability' || e.kind === 'minigame') this.toast(e.text, e.side === 'you' ? 'good' : 'info');
    // a newly completed combo flashes its cards and names them by the score
    this.checkCombos(m);
    // minigames queue
    if (m.minigames.length > this.shownMinigames && !this.snap.minigameShow) {
      const mg = m.minigames[this.shownMinigames];
      this.shownMinigames++;
      sfx.special();
      this.touch({ minigameShow: mg });
      return; // the bot waits for the ack
    }
    if (m.phase === 'done') {
      // the showdown plays first; the result is settled when it is acknowledged
      if (game.phase === 'match' && !this.snap.showdown) this.later(() => this.touch({ showdown: true }), 700);
      else this.touch();
      return;
    }
    if (botShouldAct(m) && !this.snap.minigameShow && !this.snap.opening) this.scheduleBot();
    else this.touch();
  }

  private scheduleBot() {
    const m = this.snap.match;
    if (!m || this.snap.botBusy) return;
    const ms = 900 + Math.random() * 1400;
    this.touch({ botBusy: true, botStatus: BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)] });
    this.later(() => {
      const mm = this.snap.match;
      if (!mm || !botShouldAct(mm)) {
        this.touch({ botBusy: false });
        return;
      }
      const before = new Set(mm.bot.cards.map((c) => c.uid));
      runBotTurn(mm);
      const fresh = mm.bot.cards.filter((c) => !before.has(c.uid)).map((c) => c.uid);
      sfx.flip();
      this.touch({ botBusy: false, botStatus: 'picked.', freshUids: fresh });
      this.afterEngine();
    }, ms);
  }

  private knownCombos: { you: string[]; bot: string[] } | null = null;
  private checkCombos(m: MatchState) {
    const now = { you: activeComboCards(m.you), bot: m.solo ? [] : activeComboCards(m.bot) };
    const known = this.knownCombos;
    this.knownCombos = { you: now.you.map((k) => k.id), bot: now.bot.map((k) => k.id) };
    if (!known) return; // first look after a restore: nothing is new
    for (const side of ['you', 'bot'] as const) {
      const fresh = now[side].find((k) => !known[side].includes(k.id));
      if (!fresh) continue;
      const flash: ComboFlash = { side, name: fresh.name, bonus: fresh.bonus, uids: fresh.uids, cards: fresh.cards, key: Date.now() };
      sfx.special();
      this.snap = { ...this.snap, comboFlash: flash };
      this.later(() => {
        if (this.snap.comboFlash?.key === flash.key) this.touch({ comboFlash: null });
      }, 3200);
      return;
    }
  }

  ackShowdown() {
    sfx.tap();
    this.commit({ showdown: false });
    this.settle();
  }

  ackMinigame() {
    sfx.tap();
    this.commit({ minigameShow: null });
    this.afterEngine();
  }

  // ───────────── player actions ─────────────
  private get match(): MatchState {
    if (!this.snap.match) throw new Error('no match');
    return this.snap.match;
  }

  setTool(tool: Snapshot['tool']) {
    sfx.tap();
    this.commit({ tool: this.snap.tool === tool ? null : tool });
  }

  tapPack(packId: string, category?: MainCategory) {
    if (this.snap.dealing) return;
    const m = this.match;
    const pack = m.you.packs.find((p) => p.id === packId);
    if (!pack) return;
    try {
      if (m.prompt?.kind === 'peek' && m.promptFor === 'you') {
        answer(m, { uid: packId });
        sfx.special();
        this.showPeek(packId);
        this.afterEngine();
        return;
      }
      if (this.snap.tool === 'peek') {
        usePeek(m, 'you', packId);
        sfx.special();
        this.commit({ tool: null });
        this.showPeek(packId);
        this.touch();
        return;
      }
      if (this.snap.tool === 'delorean') {
        useDelorean(m, 'you', packId);
        sfx.special();
        this.toast('88 mph. Back to this pack.');
        this.touch({ tool: null });
        return;
      }
      if (pack.opened && !pack.picked && pack.cards) {
        this.commit({ opening: { packId, cards: pack.cards, mode: 'open', revealed: pack.cards.map((c) => c.id), stage: 'fan', catPack: !!pack.catPack, divine: pack.divine } });
        return;
      }
      if (pack.opened) return;
      if (pack.locked) {
        this.toast('Opens after every other pack.', 'bad');
        return;
      }
      if (m.turn !== 'you' || m.prompt || this.snap.botBusy) {
        this.toast('Not your turn yet.', 'bad');
        return;
      }
      if (pack.kind === 'baptized' && !pack.category && !category) {
        sfx.tap();
        this.commit({ opening: { packId, cards: [], mode: 'open', revealed: [], stage: 'fan', catPack: false } });
        return;
      }
      const cards = openPack(m, 'you', packId, category);
      sfx.tear();
      const p = m.you.packs.find((x) => x.id === packId)!;
      this.touch({ opening: { packId, cards, mode: 'open', revealed: [], stage: 'tear', catPack: !!p.catPack, divine: p.divine } });
      this.later(() => {
        const o = this.snap.opening;
        if (o && o.packId === packId) {
          this.commit({ opening: { ...o, stage: 'fan' } });
          if (this.snap.autoReveal) this.autoFlip();
        }
      }, 750);
    } catch (e) {
      this.toast((e as Error).message, 'bad');
      this.commit({ tool: null });
    }
  }

  private showPeek(packId: string) {
    const pack = this.match.you.packs.find((p) => p.id === packId);
    if (pack?.cards) this.commit({ opening: { packId, cards: pack.cards, mode: 'peek', revealed: pack.cards.map((c) => c.id), stage: 'fan', catPack: false } });
  }

  reveal(cardId: string) {
    const o = this.snap.opening;
    if (!o || o.stage !== 'fan' || o.revealed.includes(cardId)) return;
    const def = o.cards.find((c) => c.id === cardId);
    if (!def) return;
    sfx.flip();
    if (def.cat === 'special') this.later(() => sfx.special(), 250);
    else if (def.rarity >= 5) this.later(() => sfx.legendary(), 250);
    else if (def.rarity >= 3) this.later(() => sfx.rare(), 250);
    this.commit({ opening: { ...o, revealed: [...o.revealed, cardId] } });
  }

  private autoFlip() {
    const o = this.snap.opening;
    if (!o) return;
    const todo = o.cards.filter((c) => !o.revealed.includes(c.id));
    todo.forEach((c, i) =>
      this.later(() => {
        const cur = this.snap.opening;
        if (cur && cur.packId === o.packId) this.reveal(c.id);
      }, 200 + i * 260),
    );
  }

  closeOpening() {
    this.commit({ opening: null });
    this.afterEngine();
  }

  /** Take a card from the open pack. For a Schrödinger pack the first tap sets the face-up card, the second the one underneath. */
  pickCard(cardId: string) {
    const o = this.snap.opening;
    const m = this.match;
    if (!o || o.mode !== 'open') return;
    const def = o.cards.find((c) => c.id === cardId);
    if (!def) return;
    if (o.catPack && def.cat !== 'special') {
      if (!o.firstPick) {
        sfx.tap();
        this.commit({ opening: { ...o, firstPick: cardId } });
        return;
      }
      if (o.firstPick === cardId) return;
    }
    try {
      const before = new Set(m.you.cards.map((c) => c.uid));
      pickCard(m, 'you', o.packId, o.catPack && o.firstPick ? o.firstPick : cardId, o.catPack && o.firstPick ? cardId : undefined);
      const fresh = m.you.cards.filter((c) => !before.has(c.uid)).map((c) => c.uid);
      if (def.cat === 'special') {
        sfx.special();
        this.touch({ opening: null, specialFx: def, freshUids: fresh });
        this.later(() => this.commit({ specialFx: null }), 2300);
      } else {
        sfx.pick();
        this.touch({ opening: null, freshUids: fresh });
      }
      this.afterEngine();
    } catch (e) {
      this.toast((e as Error).message, 'bad');
    }
  }

  answer(a: Answer) {
    const m = this.match;
    if (!m.prompt) return;
    try {
      sfx.tap();
      answer(m, a);
      this.touch();
      this.afterEngine();
    } catch (e) {
      this.toast((e as Error).message, 'bad');
    }
  }

  flipCat() {
    const m = this.match;
    if (m.turn !== 'you' || m.prompt || this.snap.botBusy) return;
    sfx.flip();
    flipCat(m, 'you');
    this.touch();
    this.afterEngine();
  }

  // ───────────── end of match ─────────────
  private settle() {
    const game = this.snap.game;
    const m = this.snap.match;
    if (!game || !m || !m.result) return;
    if (game.mode === 'solitaire') {
      const g = solitaireResult(game, m.result.youScore);
      const profit = g.you.money - g.spent;
      const scores = [...this.snap.highScores, profit].sort((a, b) => b - a).slice(0, 10);
      saveScores(scores);
      if (profit >= 0) sfx.win();
      else sfx.lose();
      this.setWallet(this.snap.wallet + g.you.money);
      this.commit({ game: g, highScores: scores });
      return;
    }
    const g = settleRound(game, m.result);
    if (m.result.winner === 'you') sfx.win();
    else sfx.lose();
    let wallet = this.snap.wallet;
    if (g.phase === 'gameOver') {
      if (g.mode === 'series' && g.winner === 'you') wallet += seriesPrize(g.stake);
      if (g.mode === 'series' && g.winner === null) wallet += g.stake; // dead heat: stake back
      if (g.mode === 'margin') wallet += g.you.money;
      writeNum(WALLET_KEY, wallet);
    }
    this.commit({ game: g, wallet });
  }

  continueGame() {
    const game = this.snap.game;
    if (!game || game.phase !== 'roundResult') return;
    sfx.tap();
    this.commit({ game: nextRound(game), match: null });
    this.beginMatch();
  }

  cashOut() {
    const game = this.snap.game;
    if (!game) return;
    const g = cashOut(game);
    sfx.cash();
    writeNum(WALLET_KEY, this.snap.wallet + g.you.money);
    this.commit({ game: g, wallet: this.snap.wallet + g.you.money });
  }

  restartSame() {
    const game = this.snap.game;
    if (!game) return;
    this.start(game.mode, game.stake);
  }

  unopenedCount(): number {
    return this.snap.match ? unopened(this.snap.match.you).length : 0;
  }
}

function loadScores(): number[] {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveScores(scores: number[]) {
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  } catch {
    /* ignore */
  }
}

export const controller = new Controller();
export function useGame(): Snapshot {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
}
export { STAKES };
