import { useSyncExternalStore } from 'react';
import { Draft, PACK_PRICES, type DraftState } from '../engine/draft';
import { clearSlot, placeInSlot, type Deck } from '../engine/deck';
import {
  cashOut,
  createDraft,
  deckFromDraft,
  newGame,
  nextRound,
  settleRound,
  solitaireResult,
  startRound,
  botMove,
  type GameState,
  type Mode,
  STAKES,
} from '../engine/game';
import { playCard, swapPlace, type RoundState } from '../engine/round';
import { randomSeed } from '../engine/rng';
import type { CardDef, MainCategory } from '../engine/types';

export interface Toast {
  id: number;
  text: string;
  tone?: 'info' | 'good' | 'bad';
}

export interface OpeningPack {
  packId: string;
  cards: CardDef[];
  mode: 'open' | 'peek';
}

export interface BotDraft {
  opened: number;
  total: number;
  status: string;
  done: boolean;
}

export interface Snapshot {
  game: GameState | null;
  draft: DraftState | null;
  deck: Deck | null;
  round: RoundState | null;
  opening: OpeningPack | null;
  botThinking: boolean;
  botDraft: BotDraft | null;
  lastBotPlayUid: string | null;
  toasts: Toast[];
  tool: 'premonition' | 'dejavu' | 'delorean' | null;
  highScores: number[];
  version: number;
}

const SAVE_KEY = 'polypacks.save.v1';
const SCORES_KEY = 'polypacks.scores.v1';

const BOT_DRAFT_LINES = [
  'is opening a Basic pack…',
  'is weighing an Enhanced pack…',
  'is staring at a Baptized pack…',
  'picked something. Looked smug.',
  'is reading card text very slowly…',
  'rerolled. Regretted it.',
  'is building a combo (allegedly)…',
  'tapped a pack three times. It opened once.',
  'is choosing a category…',
  'found a ??? pack.',
];

class Controller {
  private snap: Snapshot;
  private draftObj: Draft | null = null;
  private listeners = new Set<() => void>();
  private toastId = 0;
  private timers: number[] = [];

  constructor() {
    this.snap = {
      game: null,
      draft: null,
      deck: null,
      round: null,
      opening: null,
      botThinking: false,
      botDraft: null,
      lastBotPlayUid: null,
      toasts: [],
      tool: null,
      highScores: loadScores(),
      version: 0,
    };
    this.load();
  }

  // ───────────── store plumbing ─────────────
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.snap;

  private commit(patch: Partial<Snapshot>) {
    this.snap = { ...this.snap, ...patch, draft: this.draftObj ? this.draftObj.state : patch.draft === undefined ? this.snap.draft : patch.draft, version: this.snap.version + 1 };
    for (const l of this.listeners) l();
    this.save();
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
    const t = window.setTimeout(fn, ms);
    this.timers.push(t);
  }
  private clearTimers() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  private save() {
    try {
      const { game, deck, round } = this.snap;
      if (!game) {
        localStorage.removeItem(SAVE_KEY);
        return;
      }
      const data = { game, deck, round, draft: this.draftObj ? this.draftObj.snapshot() : null };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable */
    }
  }

  private load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data.game) return;
      this.draftObj = data.draft ? Draft.restore(data.draft) : null;
      const round: RoundState | null = data.round ?? null;
      this.snap = {
        ...this.snap,
        game: data.game,
        deck: data.deck ?? null,
        round,
        draft: this.draftObj ? this.draftObj.state : null,
        botDraft: this.draftObj && data.game.mode !== 'solitaire' ? { opened: 0, total: 10, status: 'is back at the table.', done: false } : null,
      };
      if (round && !round.done && round.turn === 'bot') this.later(() => this.runBot(), 600);
      if (this.snap.botDraft) this.tickBotDraft();
    } catch {
      /* ignore corrupt save */
    }
  }

  // ───────────── navigation ─────────────
  home() {
    this.clearTimers();
    this.draftObj = null;
    this.commit({ game: null, draft: null, deck: null, round: null, opening: null, botThinking: false, botDraft: null, tool: null, lastBotPlayUid: null });
  }

  start(mode: Mode) {
    this.clearTimers();
    const game = newGame(mode, randomSeed());
    this.draftObj = null;
    this.commit({ game, draft: null, deck: null, round: null, opening: null, botThinking: false, botDraft: null, tool: null, lastBotPlayUid: null });
    if (mode !== 'solitaire') this.beginDraft();
  }

  // ───────────── solitaire shop ─────────────
  setLoadout(kind: keyof typeof PACK_PRICES, delta: number) {
    const game = this.snap.game;
    if (!game || game.phase !== 'shop') return;
    const loadout = { ...game.loadout };
    const next = Math.max(0, loadout[kind] + delta);
    const cost = Object.entries({ ...loadout, [kind]: next }).reduce((s, [k, n]) => s + PACK_PRICES[k as keyof typeof PACK_PRICES] * n, 0);
    if (cost > game.stake) {
      this.toast('Not enough stake for that.', 'bad');
      return;
    }
    loadout[kind] = next;
    this.commit({ game: { ...game, loadout, spent: cost } });
  }

  beginDraft() {
    const game = this.snap.game;
    if (!game) return;
    if (game.mode === 'solitaire' && game.spent <= 0) {
      this.toast('Buy at least one pack.', 'bad');
      return;
    }
    this.draftObj = createDraft(game);
    const total = this.draftObj.packs.length;
    const botDraft = game.mode === 'solitaire' ? null : { opened: 0, total, status: 'is shuffling packs…', done: false };
    this.commit({ game: { ...game, phase: 'draft' }, deck: null, round: null, opening: null, botDraft, tool: null });
    if (botDraft) this.tickBotDraft();
  }

  private tickBotDraft() {
    const step = () => {
      const bd = this.snap.botDraft;
      const game = this.snap.game;
      if (!bd || !game || game.phase !== 'draft') return;
      if (bd.done) return;
      const opened = Math.min(bd.total, bd.opened + 1);
      const status = opened >= bd.total ? 'is done. Waiting on you.' : BOT_DRAFT_LINES[Math.floor(Math.random() * BOT_DRAFT_LINES.length)];
      this.commit({ botDraft: { ...bd, opened, status, done: opened >= bd.total } });
      if (opened < bd.total) this.later(step, 2500 + Math.random() * 5000);
    };
    this.later(step, 1800 + Math.random() * 2500);
  }

  // ───────────── draft ─────────────
  private get draft(): Draft {
    if (!this.draftObj) throw new Error('no draft');
    return this.draftObj;
  }

  setTool(tool: Snapshot['tool']) {
    this.commit({ tool: this.snap.tool === tool ? null : tool });
  }

  tapPack(packId: string, category?: MainCategory) {
    const d = this.draft;
    const pack = d.pack(packId);
    const tool = this.snap.tool;
    try {
      if (tool === 'premonition') {
        const cards = d.peek(packId);
        this.commit({ opening: { packId, cards, mode: 'peek' }, tool: null });
        return;
      }
      if (tool === 'dejavu') {
        d.reroll(packId);
        this.toast('Déjà vu. The pack feels different now.');
        this.commit({ tool: null });
        return;
      }
      if (tool === 'delorean') {
        d.repick(packId);
        this.toast('88 mph. Back to this pack.');
        this.commit({ tool: null });
        return;
      }
      if (pack.opened) {
        if (pack.cards && !pack.picked) this.commit({ opening: { packId, cards: pack.cards, mode: 'open' } });
        return;
      }
      if (pack.locked) {
        this.toast('Opens after every other pack.', 'bad');
        return;
      }
      if (pack.kind === 'baptized' && !pack.category && !category) {
        this.commit({ opening: { packId, cards: [], mode: 'open' } });
        return;
      }
      const before = d.state.log.length;
      const cards = d.open(packId, category);
      for (const line of d.state.log.slice(before)) this.toast(line);
      this.commit({ opening: { packId, cards, mode: 'open' } });
    } catch (e) {
      this.toast((e as Error).message, 'bad');
      this.commit({ tool: null });
    }
  }

  closeOpening() {
    this.commit({ opening: null });
  }

  pickCard(packId: string, cardId: string) {
    const d = this.draft;
    try {
      const before = d.state.log.length;
      d.pick(packId, cardId);
      for (const line of d.state.log.slice(before)) this.toast(line, 'good');
      this.commit({ opening: null });
      if (d.isComplete()) this.later(() => this.finishDraft(), 500);
    } catch (e) {
      this.toast((e as Error).message, 'bad');
    }
  }

  finishDraft() {
    const game = this.snap.game;
    if (!game || !this.draftObj) return;
    const deck = deckFromDraft(this.draftObj.state);
    if (game.mode === 'solitaire') {
      const g = solitaireResult(game, deck);
      const scores = [...this.snap.highScores, g.you.money - g.spent].sort((a, b) => b - a).slice(0, 10);
      saveScores(scores);
      this.draftObj = null;
      this.commit({ game: g, deck, draft: null, highScores: scores, botDraft: null });
      return;
    }
    this.commit({ game: { ...game, phase: 'deck', deck }, deck, botDraft: this.snap.botDraft ? { ...this.snap.botDraft, done: true, opened: this.snap.botDraft.total, status: 'is ready.' } : null });
  }

  // ───────────── deck ─────────────
  placeInSlot(slotId: string, uid: string) {
    const deck = this.snap.deck;
    if (!deck) return;
    try {
      this.commit({ deck: placeInSlot(deck, slotId, uid) });
    } catch (e) {
      this.toast((e as Error).message, 'bad');
    }
  }
  clearSlot(slotId: string) {
    const deck = this.snap.deck;
    if (!deck) return;
    this.commit({ deck: clearSlot(deck, slotId) });
  }

  lockDeck() {
    const game = this.snap.game;
    const deck = this.snap.deck;
    if (!game || !deck) return;
    const round = startRound(game, deck);
    this.draftObj = null;
    this.commit({ game: { ...game, phase: 'play', deck }, round, draft: null, botDraft: null, lastBotPlayUid: null });
  }

  // ───────────── play ─────────────
  play(uid: string) {
    const round = this.snap.round;
    if (!round || round.done || round.turn !== 'you' || this.snap.botThinking) return;
    try {
      const next = playCard(round, 'you', uid);
      this.commit({ round: next, lastBotPlayUid: null });
      if (next.done) this.later(() => this.settle(), 1200);
      else if (next.turn === 'bot') this.runBot();
    } catch (e) {
      this.toast((e as Error).message, 'bad');
    }
  }

  swapPlace() {
    const round = this.snap.round;
    if (!round || round.done || round.turn !== 'you' || this.snap.botThinking) return;
    try {
      this.commit({ round: swapPlace(round, 'you') });
    } catch (e) {
      this.toast((e as Error).message, 'bad');
    }
  }

  private runBot() {
    const game = this.snap.game;
    const round = this.snap.round;
    if (!game || !round || round.done || round.turn !== 'bot') return;
    this.commit({ botThinking: true });
    const { choice, next } = botMove(game, round);
    this.later(() => {
      this.commit({ round: next, botThinking: false, lastBotPlayUid: choice.uid });
      if (next.done) this.later(() => this.settle(), 1400);
      else if (next.turn === 'bot') this.later(() => this.runBot(), 400);
    }, choice.thinkMs);
  }

  private settle() {
    const game = this.snap.game;
    const round = this.snap.round;
    if (!game || !round || !round.done) return;
    this.commit({ game: settleRound(game, round) });
  }

  continueGame() {
    const game = this.snap.game;
    if (!game) return;
    if (game.phase === 'roundResult') {
      const g = nextRound(game);
      this.commit({ game: g, round: null, deck: null });
      this.beginDraft();
    }
  }

  cashOut() {
    const game = this.snap.game;
    if (!game) return;
    this.commit({ game: cashOut(game) });
  }

  restartSame() {
    const game = this.snap.game;
    if (!game) return;
    this.start(game.mode);
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
