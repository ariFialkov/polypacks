import { CARDS, CARD_BY_ID, CATEGORY_META, GROUPS, MAIN_CATEGORIES, cardsOf } from '../data/cards';
import { COMBOS } from '../data/combos';
import { buildDeck, slotsFor, type Deck } from './deck';
import { finalTotals, showdown, type Showdown } from './finale';
import { Rng, hashString } from './rng';
import type { CardDef, CardInst, Category, MainCategory, Rarity, Side } from './types';

// ───────────────────────────── packs ─────────────────────────────
export type PackKind = 'basic' | 'enhanced' | 'baptized' | 'category' | 'redemption';

export interface MPack {
  id: string;
  kind: PackKind;
  label: string;
  size: number;
  category?: MainCategory;
  cards: CardDef[] | null;
  opened: boolean;
  picked: boolean;
  locked: boolean; // redemption packs open last
  peeked: boolean;
  destroyed: boolean;
  divine?: string; // card id marked by Divine Intervention
  catPack?: boolean; // Schrödinger: pick two
}

export const PACK_PRICES: Record<'basic' | 'enhanced' | 'baptized' | 'utility', number> = { basic: 30, enhanced: 60, baptized: 90, utility: 45 };
export const PACK_INFO: Record<PackKind, { label: string; desc: string }> = {
  basic: { label: 'Basic', desc: '5 cards, any category' },
  enhanced: { label: 'Enhanced', desc: '3 cards, better odds' },
  baptized: { label: 'Baptized', desc: '1 blessed card from a category you choose' },
  category: { label: 'Utility', desc: '2 cards from one category' },
  redemption: { label: 'Redemption', desc: '2 cards, opens last' },
};
export const STANDARD_LOADOUT = { basic: 5, enhanced: 2, baptized: 1, utility: 2 };
export type Loadout = typeof STANDARD_LOADOUT;

const RARITY_WEIGHTS: Record<PackKind, Record<Rarity, number>> = {
  basic: { 1: 50, 2: 27, 3: 13, 4: 6, 5: 3, 6: 1 },
  enhanced: { 1: 12, 2: 26, 3: 28, 4: 18, 5: 11, 6: 5 },
  baptized: { 1: 0, 2: 8, 3: 28, 4: 30, 5: 22, 6: 12 },
  category: { 1: 26, 2: 30, 3: 22, 4: 13, 5: 6, 6: 3 },
  redemption: { 1: 12, 2: 26, 3: 28, 4: 18, 5: 11, 6: 5 },
};
const CATEGORY_WEIGHTS: Record<MainCategory, number> = { life: 30, stuff: 28, places: 14, ideas: 14, happenings: 14 };
const SPECIAL_WEIGHTS: Record<string, number> = { redemption: 20, god: 7, aether: 15, karma: 20, devil: 20, premonition: 18 };

// ───────────────────────────── state ─────────────────────────────
export interface CatPair {
  topUid: string;
  underUid: string;
  slotCat: MainCategory;
}

export interface SideState {
  side: Side;
  name: string;
  packs: MPack[];
  cards: CardInst[];
  graveyard: CardInst[];
  protectedUids: string[];
  concealedUids: string[];
  cancelledCombos: string[];
  bouncer: number;
  firedUids: string[];
  trophies: CardDef[];
  charges: { delorean: number; peek: number };
  flags: { divineNext: boolean; catNext: boolean; area51Pending: boolean; devilPending: boolean; godMode: boolean };
  catPair: CatPair | null;
  luck: number;
}

export type Prompt =
  | { kind: 'bitcoin'; cardUid: string }
  | { kind: 'flamethrower'; targets: string[] }
  | { kind: 'area51'; mode: 'initial'; targets: string[] }
  | { kind: 'area51'; mode: 'pack'; cardUid: string }
  | { kind: 'pentagon' }
  | { kind: 'coup'; theirs: string[]; mine: string[] }
  | { kind: 'trolley'; cardUid: string | null; packIds: string[] }
  | { kind: 'wedding'; combos: string[] }
  | { kind: 'defib'; graveyard: string[] }
  | { kind: 'postnut'; cardUid: string }
  | { kind: 'pretty'; targets: string[] }
  | { kind: 'dui'; vehicles: string[]; impairments: string[] }
  | { kind: 'champion'; animals: string[] }
  | { kind: 'peek'; packIds: string[]; source: 'premonition' | 'dejavu' };

export interface Answer {
  accept?: boolean;
  uid?: string;
  uid2?: string;
  option?: string;
}

export interface MatchEvent {
  n: number;
  side: Side;
  kind: 'open' | 'pick' | 'ability' | 'minigame' | 'combo' | 'end' | 'info' | 'trigger';
  text: string;
  /** trigger events: the card whose ability fired */
  uid?: string;
  card?: string;
}

export interface MinigameOutcome {
  id: string;
  title: string;
  left: { side: Side; uid?: string; label: string; cardId?: string };
  right: { side: Side; uid?: string; label: string; cardId?: string };
  roll: number; // 0..1
  threshold: number; // left wins if roll < threshold
  winner: Side | 'none';
  text: string;
  n: number;
}

export interface MatchResult {
  youScore: number;
  botScore: number;
  winner: Side | 'tie';
  margin: number;
}

export interface MatchState {
  seed: number;
  solo: boolean;
  you: SideState;
  bot: SideState;
  turn: Side;
  turnNo: number;
  prompt: Prompt | null;
  promptFor: Side | null; // whose decision; the match waits for 'you'
  /** the card (and its owner) whose ability raised the current prompt, if any */
  promptFrom?: { card: string; side: Side } | null;
  resume: 'endTurn' | 'minigames' | null; // what to continue after a prompt
  minigames: MinigameOutcome[];
  pendingMinigame: { id: string; champion?: { you?: string; bot?: string } } | null;
  firedMinigames: string[];
  events: MatchEvent[];
  phase: 'draft' | 'fill' | 'done';
  result: MatchResult | null;
  rng: number;
  nextUid: number;
  botDecisions: BotDecisions | null; // steering hooks (set by the bot module)
  sim: boolean; // simulation: turns do not advance into the bot's play or the finish
}

/** Decisions the opponent module supplies when the engine runs the bot's turn. */
export interface BotDecisions {
  pickFor(state: MatchState, pack: MPack): { def: CardDef; second?: CardDef };
  fillFor(state: MatchState, cat: MainCategory): CardDef;
  catChoice(state: MatchState): 'top' | 'under';
}

// ───────────────────────────── helpers ─────────────────────────────
function rng(s: MatchState): Rng {
  const r = new Rng(0);
  r.state = s.rng;
  return r;
}
function saveRng(s: MatchState, r: Rng) {
  s.rng = r.state;
}
export function side(s: MatchState, who: Side): SideState {
  return who === 'you' ? s.you : s.bot;
}
/** Possessive for a side's name. */
function poss(ss: SideState): string {
  return ss.side === 'you' ? 'Your' : `${ss.name}'s`;
}

export function other(who: Side): Side {
  return who === 'you' ? 'bot' : 'you';
}
function log(s: MatchState, who: Side, kind: MatchEvent['kind'], text: string) {
  s.events.push({ n: s.events.length, side: who, kind, text });
}
function newInst(s: MatchState, def: CardDef): CardInst {
  return { uid: `c${s.nextUid++}`, def };
}
export function findCard(side_: SideState, uid: string): CardInst | undefined {
  return side_.cards.find((c) => c.uid === uid);
}
function ownedIds(ss: SideState): Set<string> {
  return new Set(ss.cards.map((c) => c.def.id));
}
export function allInPlayIds(s: MatchState): Set<string> {
  const ids = new Set<string>();
  for (const ss of [s.you, s.bot]) {
    for (const c of ss.cards) ids.add(c.def.id);
    for (const c of ss.graveyard) ids.add(c.def.id);
  }
  return ids;
}

/** The cards that actually count: the best slot assignment of what a side holds. */
export function deckOf(ss: SideState): Deck {
  return buildDeck(ss.cards, { unlocked: ss.flags.godMode ? 3 : 0 });
}

/** Final totals for the match as it stands (base + showdown). */
export function matchTotals(s: MatchState): { you: number; bot: number } {
  return finalTotals(s.you, s.solo ? null : s.bot);
}

/** The full showdown breakdown (for the end-of-match animation). */
export function matchShowdown(s: MatchState): Showdown {
  return showdown(s.you, s.solo ? null : s.bot);
}

/** Running total during the draft: slot ratings plus regular combos. */
export function sideScore(ss: SideState): number {
  const deck = deckOf(ss);
  let total = 0;
  for (const slot of deck.slots) if (slot.card) total += slot.card.def.rating;
  for (const c of deck.combos) if (!ss.cancelledCombos.includes(c.id)) total += c.bonus;
  return total;
}

export function activeCombos(ss: SideState) {
  return deckOf(ss).combos.filter((c) => !ss.cancelledCombos.includes(c.id));
}

export function isProtected(ss: SideState, uid: string): boolean {
  if (ss.protectedUids.includes(uid)) return true;
  const c = findCard(ss, uid);
  if (!c) return false;
  if (GROUPS.money.includes(c.def.id as (typeof GROUPS.money)[number]) && ss.cards.some((x) => x.def.id === 'cayman-islands')) return true;
  return false;
}

function vulnerable(ss: SideState): CardInst[] {
  return ss.cards.filter((c) => !isProtected(ss, c.uid));
}

function rarityWeight(base: Record<Rarity, number>, luck: number) {
  return (r: Rarity) => Math.max(0.3, base[r] * (1 + luck * (r - 3.5) * 0.4));
}

// ───────────────────────────── creation ─────────────────────────────
function makePacks(r: Rng, loadout: Loadout, prefix: string): MPack[] {
  const packs: MPack[] = [];
  let n = 0;
  const add = (kind: PackKind, size: number, extra: Partial<MPack> = {}) =>
    packs.push({ id: `${prefix}${++n}`, kind, label: PACK_INFO[kind].label, size, cards: null, opened: false, picked: false, locked: false, peeked: false, destroyed: false, ...extra });
  for (let i = 0; i < loadout.basic; i++) add('basic', 5);
  for (let i = 0; i < loadout.enhanced; i++) add('enhanced', 3);
  for (let i = 0; i < loadout.baptized; i++) add('baptized', 1);
  for (let i = 0; i < loadout.utility; i++) {
    if (r.chance(0.2)) add('redemption', 2, { locked: true });
    else {
      const cat = r.pick(MAIN_CATEGORIES) as MainCategory;
      add('category', 2, { category: cat, label: CATEGORY_META[cat].label });
    }
  }
  return packs;
}

function makeSide(who: Side, name: string, packs: MPack[]): SideState {
  return {
    side: who,
    name,
    packs,
    cards: [],
    graveyard: [],
    protectedUids: [],
    concealedUids: [],
    cancelledCombos: [],
    bouncer: 0,
    firedUids: [],
    trophies: [],
    charges: { delorean: 0, peek: 0 },
    flags: { divineNext: false, catNext: false, area51Pending: false, devilPending: false, godMode: false },
    catPair: null,
    luck: 0,
  };
}

export function createMatch(seed: number, loadout: Loadout, botName: string, solo: boolean): MatchState {
  const r = new Rng(seed);
  const youPacks = makePacks(r, loadout, 'p');
  const botPacks = solo ? [] : makePacks(r, loadout, 'b');
  const s: MatchState = {
    seed,
    solo,
    you: makeSide('you', 'You', youPacks),
    bot: makeSide('bot', botName, botPacks),
    turn: 'you',
    turnNo: 0,
    prompt: null,
    promptFor: null,
    resume: null,
    minigames: [],
    pendingMinigame: null,
    firedMinigames: [],
    events: [],
    phase: 'draft',
    result: null,
    rng: r.state,
    nextUid: 1,
    botDecisions: null,
    sim: false,
  };
  // the player's pack contents are fixed up front (baptized packs wait for a category)
  for (const p of s.you.packs) if (p.kind !== 'baptized') p.cards = generateCards(s, s.you, p);
  plantCombos(s);
  refreshLocks(s.you);
  return s;
}

/**
 * Seed a few real combo chances into the player's packs: the parts of up to three combos (one with an
 * idea card, one any, one home combo) are spread across different packs, so every game offers some.
 */
function plantCombos(s: MatchState) {
  const packs = s.you.packs.filter((p) => p.cards && p.cards.length && (p.kind === 'basic' || p.kind === 'enhanced' || p.kind === 'category'));
  const want = Math.min(3, Math.floor(packs.length / 2));
  if (want < 1) return;
  const r = rng(s);
  const planted = new Set<string>(); // `${packId}:${index}`
  const inPacks = () => new Set(s.you.packs.flatMap((p) => (p.cards ?? []).map((c) => c.id)));
  const fits = (pk: MPack, id: string) => !pk.category || CARD_BY_ID[id].cat === pk.category;
  const pools = [
    COMBOS.filter((k) => !k.home && k.parts.length <= packs.length && k.parts.some((alts) => alts.some((id) => CARD_BY_ID[id]?.cat === 'ideas'))),
    COMBOS.filter((k) => !k.home && k.parts.length <= packs.length),
    COMBOS.filter((k) => !!k.home),
  ];
  const tried = new Set<string>();
  for (let n = 0; n < want; n++) {
    const pool = pools[n].filter((k) => !tried.has(k.id));
    if (!pool.length) continue;
    const combo = r.pick(pool);
    tried.add(combo.id);
    const have = inPacks();
    const ids = combo.parts.map((alts) => {
      const fresh = alts.filter((id) => CARD_BY_ID[id] && !have.has(id));
      return fresh.length ? r.pick(fresh) : null;
    });
    if (ids.some((id) => !id)) continue;
    // one pack per part, never two parts in the same pack
    const order = r.shuffle(packs.slice());
    const usedPacks = new Set<string>();
    const moves: { pk: MPack; i: number; id: string }[] = [];
    for (const id of ids as string[]) {
      const pk = order.find((p) => !usedPacks.has(p.id) && fits(p, id));
      if (!pk) break;
      const spots = pk.cards!.map((_c, i) => i).filter((i) => pk.cards![i].cat !== 'special' && !planted.has(`${pk.id}:${i}`));
      if (!spots.length) break;
      usedPacks.add(pk.id);
      moves.push({ pk, i: r.pick(spots), id });
    }
    if (moves.length !== ids.length) continue;
    for (const mv of moves) {
      mv.pk.cards![mv.i] = CARD_BY_ID[mv.id];
      planted.add(`${mv.pk.id}:${mv.i}`);
    }
  }
  saveRng(s, r);
}

function generateCards(s: MatchState, ss: SideState, pack: MPack): CardDef[] {
  const r = rng(s);
  const owned = ownedIds(ss);
  const out: CardDef[] = [];
  const rw = rarityWeight(RARITY_WEIGHTS[pack.kind], ss.luck);
  const pool = CARDS.filter((c) => c.cat !== 'special' && !owned.has(c.id));
  const specialChance = pack.kind === 'basic' ? 0.04 : pack.kind === 'enhanced' ? 0.12 : 0;
  if (specialChance > 0 && r.chance(specialChance + Math.max(0, ss.luck) * 0.05)) out.push(r.weighted(cardsOf('special'), (c) => SPECIAL_WEIGHTS[c.id] ?? 10));
  for (let i = out.length; i < pack.size; i++) {
    const cat = pack.category ?? (r.weighted(MAIN_CATEGORIES as MainCategory[], (c) => CATEGORY_WEIGHTS[c]) as MainCategory);
    const candidates = pool.filter((c) => c.cat === cat && !out.includes(c));
    if (!candidates.length) continue;
    out.push(r.weighted(candidates, (c) => rw(c.rarity)));
  }
  saveRng(s, r);
  return out;
}

function refreshLocks(ss: SideState) {
  const othersOpen = ss.packs.filter((p) => p.kind !== 'redemption' && !p.destroyed).every((p) => p.opened);
  for (const p of ss.packs) if (p.kind === 'redemption') p.locked = !othersOpen;
}

export function unopened(ss: SideState): MPack[] {
  return ss.packs.filter((p) => !p.opened && !p.destroyed);
}

// ───────────────────────────── turn flow ─────────────────────────────
export function canAct(s: MatchState, who: Side): boolean {
  return s.phase === 'draft' && s.turn === who && !s.prompt;
}

/** Open one of your packs. Baptized packs need a category. Returns the revealed cards. */
export function openPack(s: MatchState, who: Side, packId: string, category?: MainCategory): CardDef[] {
  const ss = side(s, who);
  if (!canAct(s, who)) throw new Error('not your turn');
  const pack = ss.packs.find((p) => p.id === packId);
  if (!pack || pack.destroyed) throw new Error('no such pack');
  if (pack.opened) return pack.cards ?? [];
  if (pack.locked) throw new Error('that pack opens after every other pack');
  if (ss.packs.some((p) => p.opened && !p.picked)) throw new Error('finish the pack you already opened');
  if (pack.kind === 'baptized' && !pack.category) {
    if (!category) throw new Error('choose a category');
    pack.category = category;
  }
  if (ss.flags.devilPending && unopened(ss).length === 1) collectDevilDebt(s, ss);
  if (!pack.cards) pack.cards = generateCards(s, ss, pack);
  pack.opened = true;
  if (ss.flags.divineNext) {
    ss.flags.divineNext = false;
    pack.divine = bestCardFor(ss, pack.cards);
    log(s, who, 'ability', `Guidance: ${CARD_BY_ID[pack.divine]?.name ?? 'a card'} glows.`);
  }
  if (ss.flags.catNext && pack.cards.length >= 2) {
    ss.flags.catNext = false;
    pack.catPack = true;
  }
  log(s, who, 'open', `${ss.name} ${who === 'you' ? 'open' : 'opens'} a ${pack.label} pack.`);
  return pack.cards;
}

function bestCardFor(ss: SideState, cards: CardDef[]): string {
  let best = cards[0]?.id ?? '';
  let bestScore = -Infinity;
  for (const c of cards) {
    if (c.cat === 'special') continue;
    const trial = buildDeck([...ss.cards, { uid: 'trial', def: c }], { unlocked: ss.flags.godMode ? 3 : 0 });
    if (trial.potential > bestScore) {
      bestScore = trial.potential;
      best = c.id;
    }
  }
  return best;
}

/** Take a card from an opened pack. Resolves its ability; may leave a prompt for the player. */
export function pickCard(s: MatchState, who: Side, packId: string, cardId: string, secondId?: string): void {
  const ss = side(s, who);
  if (!canAct(s, who)) throw new Error('not your turn');
  const pack = ss.packs.find((p) => p.id === packId);
  if (!pack || !pack.opened || !pack.cards) throw new Error('pack not open');
  if (pack.picked) throw new Error('already picked');
  const def = pack.cards.find((c) => c.id === cardId);
  if (!def) throw new Error('card not in pack');
  pack.picked = true;
  refreshLocks(ss);
  if (pack.catPack && secondId && secondId !== cardId) {
    const second = pack.cards.find((c) => c.id === secondId);
    if (second && second.cat !== 'special' && def.cat !== 'special') {
      const top = acquire(s, who, def, 'pick');
      const under = newInst(s, second);
      ss.catPair = { topUid: top.uid, underUid: under.uid, slotCat: def.cat as MainCategory };
      ss.cards.push(under); // held but hidden: removed from the counting set below
      ss.cards.splice(ss.cards.indexOf(under), 1);
      ss.graveyard.push(under); // parked in the graveyard until it is flipped up
      log(s, who, 'ability', `Superposition: ${def.name} is up, ${second.name} is under.`);
      afterPick(s, who);
      return;
    }
  }
  if (def.cat === 'special') {
    ss.trophies.push(def);
    log(s, who, 'pick', `${ss.name} ${who === 'you' ? 'claim' : 'claims'} ${def.name}.`);
    applySpecial(s, who, def);
    afterPick(s, who);
    return;
  }
  const inst = acquire(s, who, def, 'pick');
  if (ss.flags.area51Pending && !s.prompt && who === 'you') {
    s.prompt = { kind: 'area51', mode: 'pack', cardUid: inst.uid };
    s.promptFor = 'you';
    s.promptFrom = { card: 'area-51', side: 'you' };
    s.resume = 'endTurn';
    return;
  }
  if (ss.flags.area51Pending && who === 'bot') {
    protect(s, who, inst.uid);
    ss.flags.area51Pending = false;
  }
  afterPick(s, who);
}

/** A card enters a side's set (picked, stolen, swapped, revived). Its ability fires for the new owner. */
export function acquire(s: MatchState, who: Side, def: CardDef, how: 'pick' | 'steal' | 'swap' | 'revive' | 'gift' | 'fill', existing?: CardInst): CardInst {
  const ss = side(s, who);
  const inst = existing ?? newInst(s, def);
  if (!ss.cards.includes(inst)) ss.cards.push(inst);
  if (how === 'pick') log(s, who, 'pick', `${ss.name} ${who === 'you' ? 'take' : 'takes'} ${def.name} (${def.rating}).`);
  if (how !== 'fill') fireAbility(s, who, inst);
  return inst;
}

function afterPick(s: MatchState, who: Side) {
  void who;
  if (s.prompt) {
    s.resume = 'endTurn';
    return;
  }
  checkMinigames(s);
  if (s.prompt) {
    s.resume = 'endTurn';
    return;
  }
  endTurn(s);
}

function endTurn(s: MatchState) {
  s.resume = null;
  s.turnNo++;
  const next = other(s.turn);
  if (s.sim) {
    s.turn = next;
    return;
  }
  if (s.solo) {
    if (unopened(s.you).length === 0) finish(s);
    return;
  }
  const youLeft = unopened(s.you).length;
  const botLeft = unopened(s.bot).length;
  if (youLeft === 0 && botLeft === 0) {
    finish(s);
    return;
  }
  if (next === 'bot' && botLeft > 0) {
    // the opponent keeps its last pack sealed until you are done, so the last reveal is always theirs
    if (botLeft === 1 && youLeft > 0) {
      s.turn = 'you';
      return;
    }
    s.turn = 'bot'; // the UI (or test harness) calls runBotTurn when it is ready
    return;
  }
  if (next === 'bot' && botLeft === 0) {
    s.turn = 'you';
    return;
  }
  // next === 'you'
  if (youLeft > 0) s.turn = 'you';
  else s.turn = 'bot';
}

/** True when the engine is waiting for the opponent to take its turn. */
export function botShouldAct(s: MatchState): boolean {
  return s.phase === 'draft' && s.turn === 'bot' && !s.prompt && !s.sim;
}

/** Continue after the player answered a prompt. */
export function answer(s: MatchState, a: Answer): void {
  const p = s.prompt;
  if (!p) return;
  const who = s.promptFor ?? 'you';
  const ss = side(s, who);
  const opp = side(s, other(who));
  s.prompt = null;
  s.promptFor = null;
  s.promptFrom = null;
  switch (p.kind) {
    case 'bitcoin': {
      if (a.accept) {
        const c = findCard(ss, p.cardUid);
        if (c) {
          ss.cards.splice(ss.cards.indexOf(c), 1);
          ss.packs.push({ id: `${who === 'you' ? 'p' : 'b'}x${s.nextUid++}`, kind: 'enhanced', label: 'Enhanced', size: 3, cards: null, opened: false, picked: false, locked: false, peeked: false, destroyed: false });
          const np = ss.packs[ss.packs.length - 1];
          if (who === 'you') np.cards = generateCards(s, ss, np);
          log(s, who, 'ability', `${ss.name} ${who === 'you' ? 'spend' : 'spends'} the Bitcoin on an Enhanced pack.`);
          refreshLocks(ss);
        }
      } else log(s, who, 'ability', `${ss.name} ${who === 'you' ? 'hold' : 'holds'} the Bitcoin.`);
      break;
    }
    case 'flamethrower': {
      if (a.uid && p.targets.includes(a.uid)) destroy(s, other(who), a.uid, 'burned');
      break;
    }
    case 'area51': {
      if (p.mode === 'initial') {
        if (a.uid && p.targets.includes(a.uid)) {
          protect(s, who, a.uid);
          ss.flags.area51Pending = false;
        } else ss.flags.area51Pending = true;
      } else {
        if (a.accept) {
          protect(s, who, p.cardUid);
          ss.flags.area51Pending = false;
        }
      }
      break;
    }
    case 'pentagon': {
      if (a.accept) {
        const coup = acquire(s, who, CARD_BY_ID['military-coup'], 'gift');
        log(s, who, 'ability', `${ss.name} ${who === 'you' ? 'accept' : 'accepts'} the Military Coup.`);
        void coup;
      }
      break;
    }
    case 'coup': {
      if (a.uid && a.uid2 && p.theirs.includes(a.uid) && p.mine.includes(a.uid2)) swapCards(s, who, a.uid2, a.uid);
      break;
    }
    case 'trolley': {
      if (a.option === 'pack' && a.uid && p.packIds.includes(a.uid)) {
        const pk = opp.packs.find((x) => x.id === a.uid);
        if (pk) {
          pk.destroyed = true;
          log(s, who, 'ability', `The Lever: one of ${poss(opp)} Basic packs is gone.`);
          refreshLocks(opp);
        }
      } else if (p.cardUid) destroy(s, other(who), p.cardUid, 'removed');
      break;
    }
    case 'wedding': {
      if (a.uid && p.combos.includes(a.uid)) {
        opp.cancelledCombos.push(a.uid);
        log(s, who, 'ability', `Objection! ${poss(opp)} combo is cancelled.`);
      }
      break;
    }
    case 'defib': {
      if (a.uid) revive(s, who, a.uid);
      break;
    }
    case 'postnut': {
      if (a.accept) reroll(s, who, p.cardUid);
      break;
    }
    case 'pretty': {
      if (a.uid && p.targets.includes(a.uid)) steal(s, who, a.uid);
      break;
    }
    case 'dui': {
      // the victim decides which group to lose
      const group = a.option === 'vehicles' ? p.vehicles : p.impairments;
      for (const uid of group) destroy(s, who, uid, 'confiscated');
      break;
    }
    case 'champion': {
      if (a.uid && p.animals.includes(a.uid)) {
        s.pendingMinigame = { ...(s.pendingMinigame ?? { id: 'animal-kingdom' }), champion: { ...(s.pendingMinigame?.champion ?? {}), [who]: a.uid } };
      }
      break;
    }
    case 'peek': {
      if (a.uid) {
        const pk = ss.packs.find((x) => x.id === a.uid);
        if (pk && !pk.opened) {
          if (!pk.cards && pk.kind !== 'baptized') pk.cards = generateCards(s, ss, pk);
          pk.peeked = true;
          log(s, who, 'ability', `${p.source === 'dejavu' ? 'Seen It' : 'Premonition'}: ${ss.name} ${who === 'you' ? 'glimpse' : 'glimpses'} a sealed pack.`);
        }
      }
      break;
    }
  }
  // the ability chain may need more answers (e.g. a minigame champion)
  if (s.prompt) return;
  if (s.resume === 'minigames' || s.pendingMinigame) {
    resolvePendingMinigame(s);
    if (s.prompt) return;
    checkMinigames(s);
    if (s.prompt) return;
    if (s.resume === 'endTurn' || s.resume === 'minigames') endTurn(s);
    return;
  }
  if (s.resume === 'endTurn') {
    checkMinigames(s);
    if (s.prompt) return;
    endTurn(s);
  }
}

// ───────────────────────────── free actions ─────────────────────────────
export function flipCat(s: MatchState, who: Side) {
  const ss = side(s, who);
  if (!ss.catPair || s.turn !== who || s.prompt) return;
  const top = findCard(ss, ss.catPair.topUid);
  const under = ss.graveyard.find((c) => c.uid === ss.catPair!.underUid);
  if (!top || !under) return;
  ss.cards.splice(ss.cards.indexOf(top), 1, under);
  ss.graveyard.splice(ss.graveyard.indexOf(under), 1, top);
  ss.catPair = { topUid: under.uid, underUid: top.uid, slotCat: ss.catPair.slotCat };
  log(s, who, 'ability', `${ss.name} ${who === 'you' ? 'flip' : 'flips'} the box: ${under.def.name} is up.`);
  // a card's ability fires the first time it is shown
  fireAbility(s, who, under);
  if (s.prompt) s.resume = null;
}

export function useDelorean(s: MatchState, who: Side, packId: string) {
  const ss = side(s, who);
  if (!canAct(s, who) || ss.charges.delorean <= 0) throw new Error('no time travel charge');
  const pack = ss.packs.find((p) => p.id === packId);
  if (!pack || !pack.opened || !pack.picked) throw new Error('nothing to go back to');
  ss.charges.delorean--;
  // the card taken from it leaves (its ability stays spent)
  const taken = ss.cards.find((c) => pack.cards?.some((d) => d.id === c.def.id));
  if (taken) ss.cards.splice(ss.cards.indexOf(taken), 1);
  pack.picked = false;
  pack.opened = false;
  refreshLocks(ss);
  log(s, who, 'ability', `88 mph. ${ss.name} ${who === 'you' ? 'return' : 'returns'} to the ${pack.label} pack.`);
}

export function usePeek(s: MatchState, who: Side, packId: string) {
  const ss = side(s, who);
  if (ss.charges.peek <= 0) throw new Error('no peek charge');
  const pk = ss.packs.find((x) => x.id === packId);
  if (!pk || pk.opened || pk.kind === 'baptized') throw new Error('cannot peek there');
  ss.charges.peek--;
  if (!pk.cards) pk.cards = generateCards(s, ss, pk);
  pk.peeked = true;
  log(s, who, 'ability', `${ss.name} ${who === 'you' ? 'glimpse' : 'glimpses'} a sealed pack.`);
}

// ───────────────────────────── card operations ─────────────────────────────
function protect(s: MatchState, who: Side, uid: string) {
  const ss = side(s, who);
  if (!ss.protectedUids.includes(uid)) ss.protectedUids.push(uid);
  if (!ss.concealedUids.includes(uid)) ss.concealedUids.push(uid);
  const c = findCard(ss, uid);
  log(s, who, 'ability', `Classified: ${c?.def.name ?? 'a card'} is protected and concealed.`);
}

function destroy(s: MatchState, victim: Side, uid: string, how: string): boolean {
  const vs = side(s, victim);
  const c = findCard(vs, uid);
  if (!c || isProtected(vs, uid)) return false;
  vs.cards.splice(vs.cards.indexOf(c), 1);
  vs.graveyard.push(c);
  vs.protectedUids = vs.protectedUids.filter((x) => x !== uid);
  if (vs.catPair && vs.catPair.topUid === uid) vs.catPair = null;
  log(s, victim, 'ability', `${poss(vs)} ${c.def.name} is ${how}.`);
  return true;
}

function steal(s: MatchState, thief: Side, uid: string): boolean {
  const vs = side(s, other(thief));
  const ts = side(s, thief);
  const c = findCard(vs, uid);
  if (!c || isProtected(vs, uid)) return false;
  if (vs.bouncer > 0) {
    vs.bouncer--;
    log(s, other(thief), 'ability', `Rebuffed: ${poss(vs)} Bouncer stops the steal.`);
    return false;
  }
  vs.cards.splice(vs.cards.indexOf(c), 1);
  if (vs.catPair && vs.catPair.topUid === uid) vs.catPair = null;
  log(s, thief, 'ability', `${ts.name} ${thief === 'you' ? 'take' : 'takes'} ${c.def.name} from ${vs.name}.`);
  acquire(s, thief, c.def, 'steal', c);
  return true;
}

function swapCards(s: MatchState, who: Side, mineUid: string, theirsUid: string): boolean {
  const ss = side(s, who);
  const opp = side(s, other(who));
  const mine = findCard(ss, mineUid);
  const theirs = findCard(opp, theirsUid);
  if (!mine || !theirs || isProtected(opp, theirsUid)) return false;
  if (opp.bouncer > 0) {
    opp.bouncer--;
    log(s, other(who), 'ability', `Rebuffed: ${poss(opp)} Bouncer stops the swap.`);
    return false;
  }
  ss.cards.splice(ss.cards.indexOf(mine), 1);
  opp.cards.splice(opp.cards.indexOf(theirs), 1);
  ss.protectedUids = ss.protectedUids.filter((x) => x !== mineUid);
  if (ss.catPair?.topUid === mineUid) ss.catPair = null;
  if (opp.catPair?.topUid === theirsUid) opp.catPair = null;
  log(s, who, 'ability', `${ss.name} ${who === 'you' ? 'trade' : 'trades'} ${mine.def.name} for ${poss(opp)} ${theirs.def.name}.`);
  acquire(s, who, theirs.def, 'swap', theirs);
  acquire(s, other(who), mine.def, 'swap', mine);
  return true;
}

function revive(s: MatchState, who: Side, uid: string) {
  const ss = side(s, who);
  const c = ss.graveyard.find((x) => x.uid === uid);
  if (!c || (ss.catPair && ss.catPair.underUid === uid)) return;
  ss.graveyard.splice(ss.graveyard.indexOf(c), 1);
  log(s, who, 'ability', `CLEAR. ${c.def.name} is back.`);
  acquire(s, who, c.def, 'revive', c);
}

function reroll(s: MatchState, who: Side, uid: string) {
  const ss = side(s, who);
  const c = findCard(ss, uid);
  if (!c) return;
  const r = rng(s);
  const taken = allInPlayIds(s);
  const pool = CARDS.filter((x) => x.cat === c.def.cat && !taken.has(x.id));
  const fresh = r.pick(pool);
  saveRng(s, r);
  ss.cards.splice(ss.cards.indexOf(c), 1);
  ss.graveyard.push(c);
  log(s, who, 'ability', `Clarity: ${c.def.name} out, ${fresh.name} in.`);
  acquire(s, who, fresh, 'gift');
}

// ───────────────────────────── abilities ─────────────────────────────
function fireAbility(s: MatchState, who: Side, inst: CardInst) {
  const def = inst.def;
  if (!def.ability) return;
  const ss = side(s, who);
  const opp = side(s, other(who));
  if (ss.firedUids.includes(inst.uid)) return;
  ss.firedUids.push(inst.uid);
  const isYou = who === 'you';
  if (def.cat !== 'special') s.events.push({ n: s.events.length, side: who, kind: 'trigger', text: `${def.name}`, uid: inst.uid, card: def.id });
  const prompt = (p: Prompt) => {
    s.prompt = p;
    s.promptFor = 'you';
    s.promptFrom = { card: def.id, side: who };
  };
  switch (def.ability) {
    case 'delorean':
      ss.charges.delorean++;
      log(s, who, 'ability', `${ss.name} can now travel back to a picked pack.`);
      break;
    case 'bitcoin':
      if (s.solo || isYou) prompt({ kind: 'bitcoin', cardUid: inst.uid });
      else answerAs(s, 'bot', { kind: 'bitcoin', cardUid: inst.uid }, { accept: true });
      break;
    case 'cat':
      ss.flags.catNext = true;
      log(s, who, 'ability', `Superposition armed: ${poss(ss)} next pack yields two.`);
      break;
    case 'flamethrower': {
      const targets = s.solo ? [] : vulnerable(opp).map((c) => c.uid);
      if (!targets.length) break;
      if (isYou) prompt({ kind: 'flamethrower', targets });
      else destroy(s, 'you', highest(opp, targets), 'burned');
      break;
    }
    case 'divine':
      ss.flags.divineNext = true;
      log(s, who, 'ability', `Guidance: ${poss(ss)} next pack will show the way.`);
      break;
    case 'area51': {
      const targets = ss.cards.filter((c) => c.uid !== inst.uid && !ss.protectedUids.includes(c.uid)).map((c) => c.uid);
      if (isYou) prompt({ kind: 'area51', mode: 'initial', targets });
      else if (targets.length) protect(s, who, highest(ss, targets));
      else ss.flags.area51Pending = true;
      break;
    }
    case 'pentagon': {
      const comm = s.solo ? undefined : opp.cards.find((c) => c.def.id === 'communism');
      if (!comm) {
        log(s, who, 'ability', 'Containment: no Communism found.');
        break;
      }
      if (destroy(s, other(who), comm.uid, 'contained')) {
        if (isYou) prompt({ kind: 'pentagon' });
        else acquire(s, who, CARD_BY_ID['military-coup'], 'gift');
      }
      break;
    }
    case 'rapture': {
      const targets = s.solo ? [] : vulnerable(opp).map((c) => c.uid);
      if (targets.length) destroy(s, other(who), highest(opp, targets), 'taken up');
      else log(s, who, 'ability', 'The Rapture finds nothing to take.');
      break;
    }
    case 'cayman':
      log(s, who, 'ability', `${poss(ss)} money is offshore now.`);
      break;
    case 'ponzi': {
      if (s.solo) break;
      const my50 = ss.cards.find((c) => c.def.id === 'fifty-bucks');
      const theirNinja = opp.cards.find((c) => c.def.id === 'ninja-loan');
      const myNinja = ss.cards.find((c) => c.def.id === 'ninja-loan');
      const theirBtc = opp.cards.find((c) => c.def.id === 'bitcoin');
      if (my50 && theirNinja) swapCards(s, who, my50.uid, theirNinja.uid);
      else if (myNinja && theirBtc) swapCards(s, who, myNinja.uid, theirBtc.uid);
      else log(s, who, 'ability', 'Trade Up: nobody to trade with.');
      break;
    }
    case 'bermuda': {
      if (s.solo) break;
      const boats = opp.cards.filter((c) => (GROUPS.boats as readonly string[]).includes(c.def.id)).map((c) => c.uid);
      let n = 0;
      for (const uid of boats) if (destroy(s, other(who), uid, 'lost at sea')) n++;
      if (!n) log(s, who, 'ability', 'The Triangle finds no boats.');
      break;
    }
    case 'coup': {
      if (s.solo) break;
      const theirs = vulnerable(opp).map((c) => c.uid);
      const mine = ss.cards.filter((c) => c.uid !== inst.uid).map((c) => c.uid);
      if (!theirs.length || !mine.length) break;
      if (isYou) prompt({ kind: 'coup', theirs, mine });
      else swapCards(s, who, lowest(ss, mine), highest(opp, theirs));
      break;
    }
    case 'dejavu':
    case 'premonition': {
      const packIds = unopened(ss).filter((p) => p.kind !== 'baptized').map((p) => p.id);
      if (!packIds.length) break;
      if (isYou) prompt({ kind: 'peek', packIds, source: def.ability === 'dejavu' ? 'dejavu' : 'premonition' });
      break;
    }
    case 'trolley': {
      if (s.solo) break;
      const targets = vulnerable(opp).map((c) => c.uid);
      const packIds = unopened(opp).filter((p) => p.kind === 'basic').map((p) => p.id);
      const cardUid = targets.length ? lowest(opp, targets) : null;
      if (!cardUid && !packIds.length) break;
      if (isYou) prompt({ kind: 'trolley', cardUid, packIds });
      else if (cardUid) destroy(s, 'you', cardUid, 'removed');
      else answerAs(s, 'bot', { kind: 'trolley', cardUid, packIds }, { option: 'pack', uid: packIds[0] });
      break;
    }
    case 'wedding': {
      if (s.solo) break;
      const combos = activeCombos(opp).map((c) => c.id);
      if (!combos.length) {
        log(s, who, 'ability', 'Objection: nothing to object to.');
        break;
      }
      if (isYou) prompt({ kind: 'wedding', combos });
      else {
        const best = activeCombos(opp).sort((a, b) => b.bonus - a.bonus)[0];
        opp.cancelledCombos.push(best.id);
        log(s, who, 'ability', `Objection! ${poss(opp)} ${best.name} is cancelled.`);
      }
      break;
    }
    case 'defib': {
      const graveyard = ss.graveyard.filter((c) => c.uid !== ss.catPair?.underUid).map((c) => c.uid);
      if (!graveyard.length) {
        log(s, who, 'ability', 'Revive: nothing to bring back.');
        break;
      }
      if (isYou) prompt({ kind: 'defib', graveyard });
      else revive(s, who, highestIn(ss.graveyard, graveyard));
      break;
    }
    case 'bouncer':
      ss.bouncer++;
      log(s, who, 'ability', `${poss(ss)} Bouncer is on the door.`);
      break;
    case 'postnut': {
      const mine = ss.cards.filter((c) => c.uid !== inst.uid).map((c) => c.uid);
      if (!mine.length) break;
      const low = lowest(ss, mine);
      if (isYou) prompt({ kind: 'postnut', cardUid: low });
      else if ((findCard(ss, low)?.def.rating ?? 99) < 50) reroll(s, who, low);
      break;
    }
    case 'pretty': {
      if (s.solo) break;
      const targets = opp.cards.filter((c) => (GROUPS.prettyTargets as readonly string[]).includes(c.def.id) && !isProtected(opp, c.uid)).map((c) => c.uid);
      if (!targets.length) {
        log(s, who, 'ability', 'Comped: nothing worth taking.');
        break;
      }
      if (isYou) prompt({ kind: 'pretty', targets });
      else steal(s, who, highest(opp, targets));
      break;
    }
    case 'dui': {
      if (s.solo) break;
      const vehicles = opp.cards.filter((c) => (GROUPS.vehicles as readonly string[]).includes(c.def.id) && !isProtected(opp, c.uid)).map((c) => c.uid);
      const impairments = opp.cards.filter((c) => (GROUPS.impairments as readonly string[]).includes(c.def.id) && !isProtected(opp, c.uid)).map((c) => c.uid);
      if (!vehicles.length || !impairments.length) {
        log(s, who, 'ability', 'Checkpoint: they pass.');
        break;
      }
      if (other(who) === 'you') {
        s.prompt = { kind: 'dui', vehicles, impairments };
        s.promptFor = 'you';
        s.promptFrom = { card: def.id, side: who };
      } else {
        // the bot loses the cheaper group
        const vSum = vehicles.reduce((t, u) => t + (findCard(opp, u)?.def.rating ?? 0), 0);
        const iSum = impairments.reduce((t, u) => t + (findCard(opp, u)?.def.rating ?? 0), 0);
        for (const uid of vSum <= iSum ? vehicles : impairments) destroy(s, 'bot', uid, 'confiscated');
      }
      break;
    }
    case 'redemption':
    case 'god':
    case 'aether':
    case 'karma':
    case 'devil':
      break; // handled in applySpecial
  }
}

/** Let the engine answer a prompt on the bot's behalf. */
function answerAs(s: MatchState, who: Side, p: Prompt, a: Answer) {
  const saved = { prompt: s.prompt, promptFor: s.promptFor, resume: s.resume };
  s.prompt = p;
  s.promptFor = who;
  void who;
  s.resume = null;
  answer(s, a);
  if (!s.prompt) {
    s.prompt = saved.prompt;
    s.promptFor = saved.promptFor;
    s.resume = saved.resume;
  }
}

function highest(ss: SideState, uids: string[]): string {
  return uids.slice().sort((a, b) => (findCard(ss, b)?.def.rating ?? 0) - (findCard(ss, a)?.def.rating ?? 0))[0];
}
function lowest(ss: SideState, uids: string[]): string {
  return uids.slice().sort((a, b) => (findCard(ss, a)?.def.rating ?? 0) - (findCard(ss, b)?.def.rating ?? 0))[0];
}
function highestIn(list: CardInst[], uids: string[]): string {
  return uids.slice().sort((a, b) => (list.find((c) => c.uid === b)?.def.rating ?? 0) - (list.find((c) => c.uid === a)?.def.rating ?? 0))[0];
}

function applySpecial(s: MatchState, who: Side, def: CardDef) {
  const ss = side(s, who);
  switch (def.ability) {
    case 'redemption':
      ss.packs.push({ id: `${who === 'you' ? 'p' : 'b'}r${s.nextUid++}`, kind: 'redemption', label: 'Redemption', size: 2, cards: null, opened: false, picked: false, locked: true, peeked: false, destroyed: false });
      if (who === 'you') ss.packs[ss.packs.length - 1].cards = generateCards(s, ss, ss.packs[ss.packs.length - 1]);
      refreshLocks(ss);
      log(s, who, 'ability', 'Redemption: a pack of 2 appears. It opens last.');
      break;
    case 'god':
      ss.flags.godMode = true;
      log(s, who, 'ability', 'God: every slot opens. Every pack opens.');
      openEverything(s, who);
      break;
    case 'aether':
      log(s, who, 'ability', 'Aether. Nothing happens.');
      break;
    case 'karma': {
      let seen = 0;
      let seenSum = 0;
      let pickSum = 0;
      let picks = 0;
      for (const p of ss.packs) {
        if (!p.opened || !p.cards) continue;
        for (const c of p.cards) {
          if (c.cat === 'special') continue;
          seen++;
          seenSum += c.rating;
        }
      }
      for (const c of ss.cards) {
        picks++;
        pickSum += c.def.rating;
      }
      const avgSeen = seen ? seenSum / seen : 60;
      const avgPick = picks ? pickSum / picks : avgSeen;
      const well = avgPick > avgSeen * 1.1;
      ss.luck = well ? -0.7 : 0.7;
      log(s, who, 'ability', well ? 'Karma: too lucky. The universe corrects.' : 'Karma: the universe owes you one.');
      for (const p of ss.packs) if (!p.opened && !p.peeked && p.kind !== 'baptized') p.cards = who === 'you' ? generateCards(s, ss, p) : null;
      break;
    }
    case 'devil': {
      const r = rng(s);
      const cat = r.pick(['life', 'stuff', 'ideas'] as MainCategory[]);
      const taken = allInPlayIds(s);
      const pool = CARDS.filter((c) => c.cat === cat && c.rarity >= 4 && !taken.has(c.id));
      const gift = r.pick(pool);
      saveRng(s, r);
      acquire(s, who, gift, 'gift');
      ss.flags.devilPending = unopened(ss).length > 0;
      log(s, who, 'ability', `Deal with the Devil: ${gift.name} is ${who === 'you' ? 'yours' : 'theirs'}. ${ss.flags.devilPending ? 'He collects before the last pack.' : ''}`);
      break;
    }
    case 'premonition':
      ss.charges.peek++;
      log(s, who, 'ability', `Premonition: ${ss.name} may peek at one sealed pack.`);
      break;
  }
}

function collectDevilDebt(s: MatchState, ss: SideState) {
  ss.flags.devilPending = false;
  const targets = ss.cards.filter((c) => !ss.protectedUids.includes(c.uid));
  if (!targets.length) return;
  const r = rng(s);
  const taken = r.pick(targets);
  saveRng(s, r);
  ss.cards.splice(ss.cards.indexOf(taken), 1);
  ss.graveyard.push(taken);
  log(s, ss.side, 'ability', `The Devil collects: ${taken.def.name} is gone.`);
}

function openEverything(s: MatchState, who: Side) {
  const ss = side(s, who);
  for (const p of ss.packs) p.locked = false;
  ss.flags.devilPending = false;
  let guard = 0;
  while (unopened(ss).length > 0 && guard++ < 40) {
    const p = unopened(ss)[0];
    if (p.kind === 'baptized' && !p.category) p.category = 'stuff';
    if (!p.cards) p.cards = generateCards(s, ss, p);
    p.opened = true;
    const pickable = p.cards.filter((c) => c.cat !== 'special');
    if (!pickable.length) {
      p.picked = true;
      continue;
    }
    const best = who === 'bot' && s.botDecisions ? s.botDecisions.pickFor(s, p).def : CARD_BY_ID[bestCardFor(ss, pickable)];
    p.picked = true;
    acquire(s, who, best, 'pick');
  }
  refreshLocks(ss);
}

// ───────────────────────────── minigames ─────────────────────────────
function has(ss: SideState, id: string) {
  return ss.cards.some((c) => c.def.id === id);
}
function ofGroup(ss: SideState, group: readonly string[]) {
  return ss.cards.filter((c) => group.includes(c.def.id));
}

/** Seeded roll for a minigame so the opponent's simulation sees the same outcome. */
function roll(s: MatchState, key: string): number {
  const r = new Rng(hashString(`${s.seed}:${key}:${s.turnNo}`));
  return r.next();
}

function checkMinigames(s: MatchState) {
  if (s.solo || s.phase !== 'draft') return;
  const fired = (id: string) => s.firedMinigames.includes(id);
  // Animal Kingdom
  if (!fired('animal-kingdom') && (has(s.you, 'natural-selection') || has(s.bot, 'natural-selection'))) {
    const ya = ofGroup(s.you, GROUPS.animals);
    const ba = ofGroup(s.bot, GROUPS.animals);
    if (ya.length && ba.length) {
      s.pendingMinigame = { id: 'animal-kingdom', champion: {} };
      if (ya.length > 1) {
        s.prompt = { kind: 'champion', animals: ya.map((c) => c.uid) };
        s.promptFor = 'you';
        s.promptFrom = null;
        s.resume = s.resume ?? 'minigames';
        return;
      }
      resolvePendingMinigame(s);
      return;
    }
  }
  // Act of God: each disaster fires once
  for (const d of GROUPS.disasters) {
    const key = `act-of-god:${d}`;
    if (fired(key)) continue;
    const owner: Side | null = has(s.you, d) ? 'you' : has(s.bot, d) ? 'bot' : null;
    if (!owner) continue;
    const yp = s.you.cards.filter((c) => c.def.cat === 'places');
    const bp = s.bot.cards.filter((c) => c.def.cat === 'places');
    if (!yp.length || !bp.length) continue;
    s.firedMinigames.push(key);
    const wiped: string[] = [];
    let i = 0;
    for (const who of ['you', 'bot'] as Side[]) {
      const ss = side(s, who);
      for (const c of ss.cards.filter((x) => x.def.cat === 'places')) {
        const survive = Math.min(0.95, c.def.rating / 110 + (who === owner ? 0.15 : 0));
        const rr = roll(s, `${key}:${i++}`);
        if (rr >= survive && !isProtected(ss, c.uid)) {
          wiped.push(`${poss(ss)} ${c.def.name}`);
          destroy(s, who, c.uid, 'wiped off the map');
        }
      }
    }
    s.minigames.push({
      id: 'act-of-god',
      title: 'Act of God',
      left: { side: 'you', label: 'Your places' },
      right: { side: 'bot', label: `${s.bot.name}'s places` },
      roll: 0,
      threshold: 0,
      winner: 'none',
      text: wiped.length ? `${CARD_BY_ID[d].name} hits. Gone: ${wiped.join(', ')}.` : `${CARD_BY_ID[d].name} hits. Every place holds.`,
      n: s.events.length,
    });
    log(s, owner, 'minigame', `Act of God: ${CARD_BY_ID[d].name}. ${wiped.length ? wiped.join(', ') + ' wiped.' : 'Everything holds.'}`);
  }
  // Fish On!
  if (!fired('fish-on')) {
    const tSide: Side | null = has(s.you, 'fishing-trawler') ? 'you' : has(s.bot, 'fishing-trawler') ? 'bot' : null;
    const uSide: Side | null = has(s.you, 'bluefin-tuna') ? 'you' : has(s.bot, 'bluefin-tuna') ? 'bot' : null;
    if (tSide && uSide && tSide !== uSide) {
      s.firedMinigames.push('fish-on');
      const ts = side(s, tSide);
      const us = side(s, uSide);
      const trawler = ts.cards.find((c) => c.def.id === 'fishing-trawler')!;
      const tuna = us.cards.find((c) => c.def.id === 'bluefin-tuna')!;
      const rr = roll(s, 'fish-on');
      const landed = rr < 0.55;
      let text: string;
      if (landed && !isProtected(us, tuna.uid) && us.bouncer === 0) {
        steal(s, tSide, tuna.uid);
        text = `${ts.name} lands the tuna!`;
      } else if (landed) text = `${ts.name} hooks it, but it will not come aboard.`;
      else {
        destroy(s, tSide, trawler.uid, 'lost with all hands');
        text = `The trawler goes down with all hands.`;
      }
      s.minigames.push({ id: 'fish-on', title: 'Fish On!', left: { side: tSide, uid: trawler.uid, label: 'Fishing Trawler', cardId: 'fishing-trawler' }, right: { side: uSide, uid: tuna.uid, label: 'Bluefin Tuna', cardId: 'bluefin-tuna' }, roll: rr, threshold: 0.55, winner: landed ? tSide : uSide, text, n: s.events.length });
      log(s, tSide, 'minigame', `Fish On! ${text}`);
    }
  }
  // Crime Pays (per side)
  for (const who of ['you', 'bot'] as Side[]) {
    const key = `crime-pays:${who}`;
    if (fired(key)) continue;
    const ss = side(s, who);
    const opp = side(s, other(who));
    const crimes = ofGroup(ss, GROUPS.crimes);
    if (crimes.length < 2) continue;
    s.firedMinigames.push(key);
    let p = 0.5 + 0.1 * (crimes.length - 2) - (has(opp, 'surprise-drug-test') ? 0.2 : 0);
    const rr = roll(s, key);
    let text: string;
    if (rr < p) {
      const targets = vulnerable(opp);
      if (targets.length && opp.bouncer === 0) {
        const r2 = rng(s);
        const t = r2.pick(targets);
        saveRng(s, r2);
        steal(s, who, t.uid);
        text = `The heist pays: ${ss.name} ${who === 'you' ? 'walk' : 'walks'} off with ${t.def.name}.`;
      } else text = `The heist pays, but there was nothing to take.`;
    } else if (has(ss, 'plausible-deniability')) text = `Busted. Plausible Deniability: no charges stick.`;
    else {
      const r2 = rng(s);
      const lost = r2.pick(crimes);
      saveRng(s, r2);
      destroy(s, who, lost.uid, 'seized');
      text = `Busted. ${ss.name} ${who === 'you' ? 'lose' : 'loses'} ${lost.def.name}.`;
    }
    s.minigames.push({ id: 'crime-pays', title: 'Crime Pays', left: { side: who, label: `${poss(ss)} crew` }, right: { side: other(who), label: 'The law' }, roll: rr, threshold: p, winner: rr < p ? who : other(who), text, n: s.events.length });
    log(s, who, 'minigame', `Crime Pays: ${text}`);
  }
  // Bar Fight
  if (!fired('bar-fight')) {
    const bSide: Side | null = has(s.you, 'bouncer') ? 'you' : has(s.bot, 'bouncer') ? 'bot' : null;
    const fSide: Side | null = has(s.you, 'frat-guy') ? 'you' : has(s.bot, 'frat-guy') ? 'bot' : null;
    if (bSide && fSide && bSide !== fSide) {
      s.firedMinigames.push('bar-fight');
      const b = side(s, bSide).cards.find((c) => c.def.id === 'bouncer')!;
      const f = side(s, fSide).cards.find((c) => c.def.id === 'frat-guy')!;
      const p = b.def.rating / (b.def.rating + f.def.rating);
      const rr = roll(s, 'bar-fight');
      const bouncerWins = rr < p;
      if (bouncerWins) destroy(s, fSide, f.uid, 'thrown out');
      else destroy(s, bSide, b.uid, 'knocked out');
      const text = bouncerWins ? 'The Bouncer wins. Frat Guy is thrown out.' : 'Frat Guy wins. The Bouncer is out cold.';
      s.minigames.push({ id: 'bar-fight', title: 'Bar Fight', left: { side: bSide, uid: b.uid, label: 'Bouncer', cardId: 'bouncer' }, right: { side: fSide, uid: f.uid, label: 'Frat Guy', cardId: 'frat-guy' }, roll: rr, threshold: p, winner: bouncerWins ? bSide : fSide, text, n: s.events.length });
      log(s, bSide, 'minigame', `Bar Fight: ${text}`);
    }
  }
}

function resolvePendingMinigame(s: MatchState) {
  const pm = s.pendingMinigame;
  if (!pm || pm.id !== 'animal-kingdom') return;
  const ya = ofGroup(s.you, GROUPS.animals);
  const ba = ofGroup(s.bot, GROUPS.animals);
  if (!ya.length || !ba.length) {
    s.pendingMinigame = null;
    return;
  }
  const yc = (pm.champion?.you && ya.find((c) => c.uid === pm.champion!.you)) || ya.slice().sort((a, b) => b.def.rating - a.def.rating)[0];
  const bc = ba.slice().sort((a, b) => b.def.rating - a.def.rating)[0];
  s.firedMinigames.push('animal-kingdom');
  s.pendingMinigame = null;
  const p = yc.def.rating / (yc.def.rating + bc.def.rating);
  const rr = roll(s, 'animal-kingdom');
  const youWin = rr < p;
  if (youWin) destroy(s, 'bot', bc.uid, 'eaten');
  else destroy(s, 'you', yc.uid, 'eaten');
  const text = youWin ? `${yc.def.name} takes down ${bc.def.name}.` : `${bc.def.name} takes down ${yc.def.name}.`;
  s.minigames.push({ id: 'animal-kingdom', title: 'Animal Kingdom', left: { side: 'you', uid: yc.uid, label: yc.def.name, cardId: yc.def.id }, right: { side: 'bot', uid: bc.uid, label: bc.def.name, cardId: bc.def.id }, roll: rr, threshold: p, winner: youWin ? 'you' : 'bot', text, n: s.events.length });
  log(s, 'you', 'minigame', `Animal Kingdom: ${text}`);
}

// ───────────────────────────── the bot's turn ─────────────────────────────
export function runBotTurn(s: MatchState) {
  if (s.prompt || s.phase !== 'draft') return;
  const bs = s.bot;
  const packs = unopened(bs).filter((p) => !p.locked);
  if (!packs.length) {
    endTurn(s);
    return;
  }
  // any order is allowed: single-category packs first, an Enhanced pack kept for the finale
  const order: Record<PackKind, number> = { category: 0, baptized: 1, basic: 2, redemption: 3, enhanced: 4 };
  const pack = packs.slice().sort((a, b) => order[a.kind] - order[b.kind])[0];
  if (pack.kind === 'baptized' && !pack.category) pack.category = 'stuff';
  if (bs.flags.devilPending && unopened(bs).length === 1) collectDevilDebt(s, bs);
  pack.opened = true;
  log(s, 'bot', 'open', `${bs.name} opens a ${pack.label} pack.`);
  const decisions = s.botDecisions;
  if (!decisions) throw new Error('bot has no decisions');
  const choice = decisions.pickFor(s, pack);
  pack.cards = [choice.def];
  if (bs.flags.catNext && choice.second) {
    bs.flags.catNext = false;
    pack.catPack = true;
    pack.cards = [choice.def, choice.second];
    s.turn = 'bot';
    pickCard(s, 'bot', pack.id, choice.def.id, choice.second.id);
    return;
  }
  bs.flags.catNext = false;
  pickCard(s, 'bot', pack.id, choice.def.id);
}

// ───────────────────────────── the end ─────────────────────────────
function finish(s: MatchState) {
  if (s.phase !== 'draft') return;
  s.phase = 'fill';
  // against an opponent, empty slots get a random common of the slot's category; in Solitaire only
  // the cards you paid for count, so buying too few packs leaves slots (and combos) empty
  if (!s.solo) for (const who of ['you', 'bot'] as Side[]) fillEmpty(s, side(s, who));
  // the box resolves: whatever is up counts (the bot chooses)
  if (!s.solo && s.bot.catPair && s.botDecisions) {
    if (s.botDecisions.catChoice(s) === 'under') {
      s.turn = 'bot';
      flipCat(s, 'bot');
    }
  }
  // the showdown: home turf, home ties and home combos settle the final totals
  const totals = matchTotals(s);
  const youScore = totals.you;
  const botScore = s.solo ? 0 : totals.bot;
  const winner: Side | 'tie' = s.solo ? 'you' : youScore > botScore ? 'you' : botScore > youScore ? 'bot' : 'tie';
  s.phase = 'done';
  s.result = { youScore, botScore, winner, margin: Math.abs(youScore - botScore) };
  log(s, 'you', 'end', s.solo ? `Set value ${youScore}.` : winner === 'tie' ? 'Dead heat.' : `${side(s, winner as Side).name} ${winner === 'you' ? 'take' : 'takes'} it, ${youScore} to ${botScore}.`);
}

export function fillEmpty(s: MatchState, ss: SideState) {
  let guard = 0;
  while (guard++ < 12) {
    const deck = deckOf(ss);
    const empty = deck.slots.find((x) => !x.card);
    if (!empty) break;
    const cat = empty.slot.accepts[0] as MainCategory;
    let def: CardDef;
    if (ss.side === 'bot' && s.botDecisions) def = s.botDecisions.fillFor(s, cat);
    else {
      const r = rng(s);
      const taken = allInPlayIds(s);
      const pool = CARDS.filter((c) => c.cat === cat && c.rarity === 1 && !taken.has(c.id));
      def = r.pick(pool.length ? pool : CARDS.filter((c) => c.cat === cat));
      saveRng(s, r);
    }
    acquire(s, ss.side, def, 'fill');
    log(s, ss.side, 'info', `${ss.name} ${ss.side === 'you' ? 'fill' : 'fills'} an empty ${empty.slot.label} slot with ${def.name}.`);
  }
}

/** Snapshot (JSON-safe) for simulation. */
export function cloneMatch(s: MatchState): MatchState {
  const { botDecisions, ...rest } = s;
  const copy = JSON.parse(JSON.stringify(rest)) as MatchState;
  copy.botDecisions = botDecisions;
  return copy;
}

/** Deterministic tie-break source for the bot, derived from the match seed and turn. */
export function turnRng(s: MatchState, salt = 0): Rng {
  return new Rng(hashString(`${s.seed}:bot:${s.turnNo}:${salt}`));
}

export { slotsFor };
export type { Category };
