import { useSyncExternalStore } from 'react';
import { Draft, PACK_PRICES, type DraftState, type PackKind } from '../engine/draft';
import { clearSlot, placeInSlot, type Deck } from '../engine/deck';
import { cashOut, createDraft, deckFromDraft, newGame, nextRound, settleRound, solitaireResult, startRound, botMove, type GameState, type Mode, STAKES } from '../engine/game';
import { playCard, swapPlace, type RoundState } from '../engine/round';
import { randomSeed } from '../engine/rng';
import { MAIN_CATEGORIES } from '../data/cards';
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
}

export interface BotPack {
  kind: PackKind;
  label: string;
  size: number;
  category?: MainCategory;
  opened: boolean;
}

export interface Snapshot {
  game: GameState | null;
  draft: DraftState | null;
  deck: Deck | null;
  round: RoundState | null;
  wallet: number;
  dealing: boolean;
  opening: OpeningPack | null;
  autoReveal: boolean;
  botPacks: BotPack[];
  botSlots: string[]; // slot ids holding a face-down card
  botStatus: string;
  specialFx: CardDef | null;
  botThinking: boolean;
  lastBotPlayUid: string | null;
  toasts: Toast[];
  tool: 'premonition' | 'dejavu' | 'delorean' | null;
  highScores: number[];
  sound: boolean;
  menuOpen: boolean;
  version: number;
}

const SAVE_KEY = 'polypacks.save.v2';
const SCORES_KEY = 'polypacks.scores.v1';
const WALLET_KEY = 'polypacks.wallet.v1';
const AUTO_KEY = 'polypacks.autoreveal';
export const SERIES_ENTRY = 100;
export const SERIES_PRIZE = 250;
export const WALLET_FLOOR = 500;

const ROW1 = ['place', 'event', 'flex'];
const ROW2 = ['life1', 'life2', 'stuff1', 'stuff2', 'stuff3', 'idea'];

const BOT_LINES = ['is weighing options…', 'picked something. Looked smug.', 'is reading card text very slowly…', 'is building a combo (allegedly)…', 'tapped a pack three times.', 'is choosing a category…', 'hesitated. Then committed.', 'is not telling.'];

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
  private draftObj: Draft | null = null;
  private listeners = new Set<() => void>();
  private toastId = 0;
  private timers: number[] = [];

  constructor() {
    let auto = false;
    try {
      auto = localStorage.getItem(AUTO_KEY) === 'on';
    } catch {
      /* ignore */
    }
    this.snap = {
      game: null,
      draft: null,
      deck: null,
      round: null,
      wallet: readNum(WALLET_KEY, 1000),
      dealing: false,
      opening: null,
      autoReveal: auto,
      botPacks: [],
      botSlots: [],
      botStatus: '',
      specialFx: null,
      botThinking: false,
      lastBotPlayUid: null,
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
    }, 3000);
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
      const { game, deck, round, botPacks, botSlots } = this.snap;
      if (!game) {
        localStorage.removeItem(SAVE_KEY);
        return;
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify({ game, deck, round, botPacks, botSlots, draft: this.draftObj ? this.draftObj.snapshot() : null }));
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
      this.draftObj = data.draft ? Draft.restore(data.draft) : null;
      const round: RoundState | null = data.round ?? null;
      this.snap = { ...this.snap, game: data.game, deck: data.deck ?? null, round, draft: this.draftObj ? this.draftObj.state : null, botPacks: data.botPacks ?? [], botSlots: data.botSlots ?? [] };
      if (round && !round.done && round.turn === 'bot') this.later(() => this.runBot(), 800);
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
    this.draftObj = null;
    this.commit({ game: null, draft: null, deck: null, round: null, opening: null, botThinking: false, botPacks: [], botSlots: [], tool: null, lastBotPlayUid: null, dealing: false, specialFx: null, menuOpen: false });
  }

  start(mode: Mode) {
    this.clearTimers();
    const need = mode === 'series' ? SERIES_ENTRY : STAKES[mode];
    let wallet = this.snap.wallet;
    if (wallet < need) {
      wallet = Math.max(wallet, WALLET_FLOOR);
      this.toast(`The house fronts you $${WALLET_FLOOR}.`, 'good');
    }
    if (mode === 'series') wallet -= SERIES_ENTRY;
    if (mode === 'margin') wallet -= STAKES.margin;
    writeNum(WALLET_KEY, wallet);
    const game = newGame(mode, randomSeed());
    this.draftObj = null;
    sfx.cash();
    this.commit({ game, wallet, draft: null, deck: null, round: null, opening: null, botThinking: false, botPacks: [], botSlots: [], tool: null, lastBotPlayUid: null, menuOpen: false, specialFx: null });
    if (mode !== 'solitaire') this.beginDraft();
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

  beginDraft() {
    const game = this.snap.game;
    if (!game) return;
    if (game.mode === 'solitaire') {
      if (game.spent <= 0) {
        this.toast('Buy at least one pack.', 'bad');
        return;
      }
      this.setWallet(this.snap.wallet - game.spent);
    }
    this.draftObj = createDraft(game);
    const packs = this.draftObj.packs;
    const botPacks: BotPack[] =
      game.mode === 'solitaire'
        ? []
        : packs.map((p) => ({ kind: p.kind, label: p.label, size: p.size, opened: false, category: p.kind === 'category' ? (MAIN_CATEGORIES[Math.floor(Math.random() * 5)] as MainCategory) : undefined }));
    for (const bp of botPacks) if (bp.category) bp.label = bp.category[0].toUpperCase() + bp.category.slice(1);
    this.commit({ game: { ...game, phase: 'draft' }, deck: deckFromDraft(this.draftObj.state), round: null, opening: null, botPacks, botSlots: [], botStatus: 'is shuffling…', tool: null, dealing: true, lastBotPlayUid: null });
    for (let i = 0; i < packs.length; i++) this.later(() => sfx.deal(), 120 + i * 90);
    this.later(() => this.commit({ dealing: false, botStatus: botPacks.length ? 'is eyeing the packs…' : '' }), 1900);
  }

  // ───────────── draft ─────────────
  private get draft(): Draft {
    if (!this.draftObj) throw new Error('no draft');
    return this.draftObj;
  }
  private syncDeck() {
    if (!this.draftObj) return;
    this.commit({ deck: deckFromDraft(this.draftObj.state) });
  }

  setTool(tool: Snapshot['tool']) {
    sfx.tap();
    this.commit({ tool: this.snap.tool === tool ? null : tool });
  }

  tapPack(packId: string, category?: MainCategory) {
    if (this.snap.dealing) return;
    const d = this.draft;
    const pack = d.pack(packId);
    const tool = this.snap.tool;
    try {
      if (tool === 'premonition') {
        const cards = d.peek(packId);
        sfx.special();
        this.commit({ opening: { packId, cards, mode: 'peek', revealed: cards.map((c) => c.id), stage: 'fan' }, tool: null });
        return;
      }
      if (tool === 'dejavu') {
        d.reroll(packId);
        sfx.flip();
        this.toast('Déjà vu. The pack feels different now.');
        this.commit({ tool: null });
        return;
      }
      if (tool === 'delorean') {
        d.repick(packId);
        sfx.special();
        this.toast('88 mph. Back to this pack.');
        this.commit({ tool: null });
        this.syncDeck();
        return;
      }
      if (pack.opened) {
        if (pack.cards && !pack.picked) this.commit({ opening: { packId, cards: pack.cards, mode: 'open', revealed: pack.cards.map((c) => c.id), stage: 'fan' } });
        return;
      }
      if (pack.locked) {
        this.toast('Opens after every other pack.', 'bad');
        return;
      }
      if (pack.kind === 'baptized' && !pack.category && !category) {
        sfx.tap();
        this.commit({ opening: { packId, cards: [], mode: 'open', revealed: [], stage: 'fan' } });
        return;
      }
      const before = d.state.log.length;
      const cards = d.open(packId, category);
      for (const line of d.state.log.slice(before)) this.toast(line);
      sfx.tear();
      this.commit({ opening: { packId, cards, mode: 'open', revealed: [], stage: 'tear' } });
      this.syncDeck();
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

  reveal(cardId: string) {
    const o = this.snap.opening;
    if (!o || o.stage !== 'fan' || o.revealed.includes(cardId)) return;
    const def = o.cards.find((c) => c.id === cardId);
    if (!def) return;
    sfx.flip();
    if (def.cat === 'special') this.later(() => sfx.special(), 250);
    else if (def.rarity === 4) this.later(() => sfx.legendary(), 250);
    else if (def.rarity === 3) this.later(() => sfx.rare(), 250);
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
  }

  pickCard(packId: string, cardId: string) {
    const d = this.draft;
    try {
      const before = d.state.log.length;
      const def = d.pack(packId).cards?.find((c) => c.id === cardId);
      d.pick(packId, cardId);
      for (const line of d.state.log.slice(before)) this.toast(line, 'good');
      if (def?.cat === 'special') {
        sfx.special();
        this.commit({ opening: null, specialFx: def });
        this.later(() => this.commit({ specialFx: null }), 2300);
      } else {
        sfx.pick();
        this.commit({ opening: null });
      }
      this.syncDeck();
      this.botOpensOne();
      if (d.isComplete()) this.later(() => this.finishDraft(), 600);
    } catch (e) {
      this.toast((e as Error).message, 'bad');
    }
  }

  /** The opponent keeps pace: one of their packs goes shortly after one of yours. */
  private botOpensOne() {
    const left = this.snap.botPacks.filter((p) => !p.opened);
    if (left.length === 0) return;
    const delay = 500 + Math.random() * 1500;
    this.later(() => {
      const packs = this.snap.botPacks.map((p) => ({ ...p }));
      const candidates = packs.filter((p) => !p.opened && p.kind !== 'redemption');
      const pool = candidates.length ? candidates : packs.filter((p) => !p.opened);
      if (!pool.length) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      pick.opened = true;
      const empties = [...ROW1, ...ROW2].filter((s) => !this.snap.botSlots.includes(s));
      const botSlots = [...this.snap.botSlots];
      if (empties.length) botSlots.push(empties[Math.floor(Math.random() * empties.length)]);
      sfx.deal();
      const allDone = packs.every((p) => p.opened);
      this.commit({ botPacks: packs, botSlots, botStatus: allDone ? 'is done. Waiting on you.' : BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)] });
    }, delay);
  }

  finishDraft() {
    const game = this.snap.game;
    if (!game || !this.draftObj) return;
    const deck = deckFromDraft(this.draftObj.state);
    if (game.mode === 'solitaire') {
      const g = solitaireResult(game, deck);
      const profit = g.you.money - g.spent;
      const scores = [...this.snap.highScores, profit].sort((a, b) => b - a).slice(0, 10);
      saveScores(scores);
      this.draftObj = null;
      if (profit >= 0) sfx.win();
      else sfx.lose();
      this.setWallet(this.snap.wallet + g.you.money);
      this.commit({ game: g, deck, draft: null, highScores: scores });
      return;
    }
    // bot finishes any packs it has left
    const packs = this.snap.botPacks.map((p) => ({ ...p, opened: true }));
    this.commit({ game: { ...game, phase: 'deck', deck }, deck, botPacks: packs, botStatus: 'is ready.' });
  }

  // ───────────── deck ─────────────
  placeInSlot(slotId: string, uid: string) {
    const deck = this.snap.deck;
    if (!deck) return;
    try {
      sfx.pick();
      this.commit({ deck: placeInSlot(deck, slotId, uid) });
    } catch (e) {
      this.toast((e as Error).message, 'bad');
    }
  }
  clearSlot(slotId: string) {
    const deck = this.snap.deck;
    if (!deck) return;
    sfx.tap();
    this.commit({ deck: clearSlot(deck, slotId) });
  }

  lockDeck() {
    const game = this.snap.game;
    const deck = this.snap.deck;
    if (!game || !deck) return;
    const round = startRound(game, deck);
    // the opponent's concealed cards mirror your filled slots
    const botSlots = deck.slots.filter((s) => s.card && s.card.def.cat !== 'places').map((s) => s.slot.id);
    if (!botSlots.includes('flex')) botSlots.push('flex'); // their concealed second place
    this.draftObj = null;
    sfx.deal();
    this.commit({ game: { ...game, phase: 'play', deck }, round, draft: null, botSlots, botStatus: '', lastBotPlayUid: null });
  }

  // ───────────── play ─────────────
  play(uid: string) {
    const round = this.snap.round;
    if (!round || round.done || round.turn !== 'you' || this.snap.botThinking) return;
    try {
      const card = round.you.hand.find((c) => c.uid === uid);
      const next = playCard(round, 'you', uid);
      if (card?.def.cat === 'happenings') {
        const k = card.def.effect?.kind;
        if (k === 'hitOpp' || k === 'fieldShake' || k === 'halveOppTop' || k === 'steal') sfx.hit();
        else sfx.boost();
      } else sfx.play();
      this.commit({ round: next, lastBotPlayUid: null });
      if (next.done) this.later(() => this.settle(), 1300);
      else if (next.turn === 'bot') this.runBot();
    } catch (e) {
      this.toast((e as Error).message, 'bad');
    }
  }

  swapPlace() {
    const round = this.snap.round;
    if (!round || round.done || round.turn !== 'you' || this.snap.botThinking) return;
    try {
      sfx.flip();
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
      // a face-down card leaves a slot that could have held it
      const cat = choice.def.cat;
      const prefer = cat === 'life' ? ['life1', 'life2', 'sp1', 'sp3'] : cat === 'stuff' ? ['stuff1', 'stuff2', 'stuff3', 'sp1', 'sp3'] : cat === 'ideas' ? ['idea', 'sp2', 'sp3'] : ['event', 'flex', 'sp2', 'sp3'];
      const slots = [...this.snap.botSlots];
      if (choice.swapTo) {
        const fi = slots.indexOf('flex');
        if (fi >= 0) slots.splice(fi, 1);
        this.toast(`${game.bot.name} moves the scene to ${choice.swapTo.name}.`);
      }
      const idx = slots.findIndex((s) => prefer.includes(s) && !(s === 'flex' && cat !== 'happenings'));
      if (idx >= 0) slots.splice(idx, 1);
      else if (slots.length) slots.pop();
      sfx.flip();
      this.commit({ round: next, botThinking: false, lastBotPlayUid: choice.uid, botSlots: slots });
      if (next.done) this.later(() => this.settle(), 1500);
      else if (next.turn === 'bot') this.later(() => this.runBot(), 500);
    }, choice.thinkMs);
  }

  private settle() {
    const game = this.snap.game;
    const round = this.snap.round;
    if (!game || !round || !round.done) return;
    const g = settleRound(game, round);
    const youWon = round.result?.winner === 'you';
    if (youWon) sfx.win();
    else sfx.lose();
    let wallet = this.snap.wallet;
    if (g.phase === 'gameOver') {
      if (g.mode === 'series' && g.winner === 'you') wallet += SERIES_PRIZE;
      if (g.mode === 'margin') wallet += g.you.money;
      writeNum(WALLET_KEY, wallet);
    }
    this.commit({ game: g, wallet });
  }

  continueGame() {
    const game = this.snap.game;
    if (!game || game.phase !== 'roundResult') return;
    sfx.tap();
    this.commit({ game: nextRound(game), round: null, deck: null, botSlots: [] });
    this.beginDraft();
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
export { STAKES, ROW1, ROW2 };
