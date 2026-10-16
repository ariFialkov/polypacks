import { CARDS, MAIN_CATEGORIES, cardsOf } from '../data/cards';
import { Rng } from './rng';
import type { CardDef, CardInst, Category, MainCategory, Rarity } from './types';
import { buildDeck } from './deck';

export type PackKind = 'basic' | 'enhanced' | 'baptized' | 'category' | 'mystery' | 'redemption';

export interface Pack {
  id: string;
  kind: PackKind;
  label: string;
  size: number;
  category?: Category; // for category packs; set on baptized after choosing
  cards: CardDef[] | null;
  opened: boolean;
  picked?: string;
  peeked: boolean;
  locked: boolean; // redemption packs unlock after all others are opened
  bonusCard: boolean; // flash mob applied
}

export interface Charges {
  delorean: number;
  dejavu: number;
  flashmob: number; // pending "next pack +1"
  premonition: number;
}

export interface DraftState {
  packs: Pack[];
  picks: CardInst[];
  trophies: CardDef[]; // ??? cards claimed
  luck: number;
  charges: Charges;
  godMode: boolean;
  devilPending: boolean;
  log: string[];
  nextUid: number;
}

export const PACK_PRICES: Record<'basic' | 'enhanced' | 'baptized' | 'utility', number> = {
  basic: 30,
  enhanced: 60,
  baptized: 90,
  utility: 45,
};

export const PACK_INFO: Record<PackKind, { label: string; desc: string }> = {
  basic: { label: 'Basic', desc: '5 cards, any category' },
  enhanced: { label: 'Enhanced', desc: '3 cards, better odds' },
  baptized: { label: 'Baptized', desc: '1 blessed card from a category you choose' },
  category: { label: 'Utility', desc: '2 cards from one category' },
  mystery: { label: '???', desc: '1 card from beyond' },
  redemption: { label: 'Redemption', desc: '2 cards, opens last' },
};

export const STANDARD_LOADOUT = { basic: 5, enhanced: 2, baptized: 1, utility: 2 };

const RARITY_WEIGHTS: Record<'basic' | 'enhanced' | 'baptized' | 'category' | 'redemption', Record<Rarity, number>> = {
  basic: { 1: 50, 2: 27, 3: 13, 4: 6, 5: 3, 6: 1 },
  enhanced: { 1: 12, 2: 26, 3: 28, 4: 18, 5: 11, 6: 5 },
  baptized: { 1: 0, 2: 8, 3: 28, 4: 30, 5: 22, 6: 12 },
  category: { 1: 26, 2: 30, 3: 22, 4: 13, 5: 6, 6: 3 },
  redemption: { 1: 12, 2: 26, 3: 28, 4: 18, 5: 11, 6: 5 },
};

const CATEGORY_WEIGHTS: Record<MainCategory, number> = { life: 30, stuff: 28, places: 14, ideas: 14, happenings: 14 };

const SPECIAL_WEIGHTS: Record<string, number> = { redemption: 20, god: 7, aether: 15, karma: 20, devil: 20, premonition: 18 };

function rarityWeight(base: Record<Rarity, number>, luck: number): (r: Rarity) => number {
  // luck in [-1, 1] skews odds towards (or away from) higher rarities
  return (r) => Math.max(0.3, base[r] * (1 + luck * (r - 3.5) * 0.4));
}

export class Draft {
  state: DraftState;
  private rng: Rng;

  constructor(seed: number, loadout: Partial<typeof STANDARD_LOADOUT> = STANDARD_LOADOUT) {
    this.rng = new Rng(seed);
    this.state = {
      packs: [],
      picks: [],
      trophies: [],
      luck: 0,
      charges: { delorean: 0, dejavu: 0, flashmob: 0, premonition: 0 },
      godMode: false,
      devilPending: false,
      log: [],
      nextUid: 1,
    };
    const lo = { ...STANDARD_LOADOUT, ...loadout };
    let n = 0;
    const add = (kind: PackKind, size: number, extra: Partial<Pack> = {}) => {
      this.state.packs.push({
        id: `p${++n}`,
        kind,
        label: PACK_INFO[kind].label,
        size,
        cards: null,
        opened: false,
        peeked: false,
        locked: false,
        bonusCard: false,
        ...extra,
      });
    };
    for (let i = 0; i < lo.basic; i++) add('basic', 5);
    for (let i = 0; i < lo.enhanced; i++) add('enhanced', 3);
    for (let i = 0; i < lo.baptized; i++) add('baptized', 1);
    for (let i = 0; i < lo.utility; i++) {
      if (this.rng.chance(0.2)) add('redemption', 2, { locked: true });
      else {
        const cat = this.rng.pick(MAIN_CATEGORIES) as MainCategory;
        add('category', 2, { category: cat, label: `${cat[0].toUpperCase()}${cat.slice(1)}` });
      }
    }
    this.refreshLocks();
  }

  // ───────────── persistence ─────────────
  snapshot(): { state: DraftState; rng: number } {
    return { state: JSON.parse(JSON.stringify(this.state)), rng: this.rng.state };
  }
  static restore(snap: { state: DraftState; rng: number }): Draft {
    const d = new Draft(0, { basic: 0, enhanced: 0, baptized: 0, utility: 0 });
    d.state = JSON.parse(JSON.stringify(snap.state));
    d.rng.state = snap.rng;
    return d;
  }

  // ───────────── queries ─────────────
  get packs() {
    return this.state.packs;
  }
  pack(id: string): Pack {
    const p = this.state.packs.find((x) => x.id === id);
    if (!p) throw new Error(`no pack ${id}`);
    return p;
  }
  isComplete(): boolean {
    return this.state.packs.every((p) => p.opened && p.picked);
  }
  unopenedCount(): number {
    return this.state.packs.filter((p) => !p.opened).length;
  }
  private ownedIds(): Set<string> {
    return new Set(this.state.picks.map((c) => c.def.id));
  }

  // ───────────── generation ─────────────
  private weightsFor(pack: Pack): Record<Rarity, number> {
    if (pack.kind === 'mystery') return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    return RARITY_WEIGHTS[pack.kind];
  }

  private generateCards(pack: Pack): CardDef[] {
    const size = pack.size + (pack.bonusCard ? 1 : 0);
    if (pack.kind === 'mystery') {
      const specials = cardsOf('special');
      return [this.rng.weighted(specials, (c) => SPECIAL_WEIGHTS[c.id] ?? 10)];
    }
    const owned = this.ownedIds();
    const out: CardDef[] = [];
    const rw = rarityWeight(this.weightsFor(pack), this.state.luck);
    const pool = CARDS.filter((c) => c.cat !== 'special' && !owned.has(c.id));
    const specialChance = pack.kind === 'basic' ? 0.04 : pack.kind === 'enhanced' ? 0.12 : 0;
    if (specialChance > 0 && this.rng.chance(specialChance + Math.max(0, this.state.luck) * 0.05)) {
      const specials = cardsOf('special');
      out.push(this.rng.weighted(specials, (c) => SPECIAL_WEIGHTS[c.id] ?? 10));
    }
    for (let i = out.length; i < size; i++) {
      let cat: Category;
      if (pack.category) cat = pack.category;
      else cat = this.rng.weighted(MAIN_CATEGORIES as MainCategory[], (c) => CATEGORY_WEIGHTS[c]);
      const candidates = pool.filter((c) => c.cat === cat && !out.includes(c));
      if (candidates.length === 0) continue;
      out.push(this.rng.weighted(candidates, (c) => rw(c.rarity)));
    }
    return out;
  }

  private refreshLocks() {
    const othersOpen = this.state.packs.filter((p) => p.kind !== 'redemption').every((p) => p.opened);
    for (const p of this.state.packs) if (p.kind === 'redemption') p.locked = !othersOpen;
  }

  private newInst(def: CardDef): CardInst {
    return { uid: `c${this.state.nextUid++}`, def };
  }

  private log(msg: string) {
    this.state.log.push(msg);
  }

  // ───────────── actions ─────────────
  /** Open a pack. Baptized packs require a category. Returns the revealed cards. */
  open(packId: string, category?: MainCategory): CardDef[] {
    const pack = this.pack(packId);
    if (pack.opened) throw new Error('pack already opened');
    if (pack.locked) throw new Error('pack is locked until every other pack is opened');
    if (pack.kind === 'baptized' && !pack.category) {
      if (!category) throw new Error('baptized pack needs a category');
      pack.category = category;
    }
    if (this.state.devilPending && this.unopenedCount() === 1) this.collectDevilDebt();
    if (!pack.cards) {
      if (this.state.charges.flashmob > 0 && pack.kind !== 'mystery') {
        pack.bonusCard = true;
        this.state.charges.flashmob--;
        this.log('Flash mob! An extra card shows up in this pack.');
      }
      pack.cards = this.generateCards(pack);
    }
    pack.opened = true;
    return pack.cards;
  }

  /** Peek at an unopened pack (Premonition). */
  peek(packId: string): CardDef[] {
    const pack = this.pack(packId);
    if (pack.opened) throw new Error('already opened');
    if (this.state.charges.premonition <= 0) throw new Error('no premonition charge');
    if (pack.kind === 'baptized') throw new Error('a baptized pack has no contents until you choose');
    this.state.charges.premonition--;
    if (!pack.cards) pack.cards = this.generateCards(pack);
    pack.peeked = true;
    this.log(`Premonition: you glimpse the ${pack.label} pack.`);
    return pack.cards;
  }

  /** Reroll the contents of an unopened pack (Déjà Vu). */
  reroll(packId: string) {
    const pack = this.pack(packId);
    if (pack.opened) throw new Error('already opened');
    if (this.state.charges.dejavu <= 0) throw new Error('no déjà vu charge');
    if (pack.kind === 'baptized') throw new Error('nothing to reroll yet');
    this.state.charges.dejavu--;
    pack.cards = this.generateCards(pack);
    pack.peeked = false;
    this.log(`Déjà vu... the ${pack.label} pack feels different now.`);
  }

  /** Re-open an already picked pack (DeLorean). The same options come back. */
  repick(packId: string) {
    const pack = this.pack(packId);
    if (!pack.opened || !pack.picked) throw new Error('pack was never picked');
    if (this.state.charges.delorean <= 0) throw new Error('no DeLorean charge');
    this.state.charges.delorean--;
    const idx = this.state.picks.findIndex((c) => c.def.id === pack.picked);
    if (idx >= 0) this.state.picks.splice(idx, 1);
    pack.picked = undefined;
    pack.opened = false;
    this.log(`88 mph. You return to the ${pack.label} pack.`);
    this.refreshLocks();
  }

  /** Choose one card from an opened pack. */
  pick(packId: string, cardId: string): CardInst | null {
    const pack = this.pack(packId);
    if (!pack.opened || !pack.cards) throw new Error('pack not open');
    if (pack.picked) throw new Error('already picked from this pack');
    const def = pack.cards.find((c) => c.id === cardId);
    if (!def) throw new Error('card not in pack');
    pack.picked = cardId;
    this.refreshLocks();
    if (def.cat === 'special') {
      this.state.trophies.push(def);
      this.applySpecial(def);
      return null;
    }
    const inst = this.newInst(def);
    this.state.picks.push(inst);
    this.applyAbility(def);
    return inst;
  }

  private applyAbility(def: CardDef) {
    switch (def.ability) {
      case 'delorean':
        this.state.charges.delorean++;
        this.log('DeLorean acquired: you may repick one opened pack.');
        break;
      case 'dejavu':
        this.state.charges.dejavu++;
        this.log('Déjà Vu: you may reroll one unopened pack.');
        break;
      case 'flashmob':
        this.state.charges.flashmob++;
        this.log('Flash Mob: your next pack shows an extra card.');
        break;
    }
  }

  private applySpecial(def: CardDef) {
    switch (def.ability) {
      case 'redemption': {
        this.state.packs.push({
          id: `p${this.state.packs.length + 1}`,
          kind: 'redemption',
          label: 'Redemption',
          size: 2,
          cards: null,
          opened: false,
          peeked: false,
          locked: true,
          bonusCard: false,
        });
        this.refreshLocks();
        this.log('Redemption: a pack of 2 appears. It opens last.');
        break;
      }
      case 'god':
        this.state.godMode = true;
        this.log('God: every slot opens. Every pack opens. The best set is chosen.');
        this.openEverything();
        break;
      case 'aether':
        this.log('Aether. Nothing happens. Nothing at all.');
        break;
      case 'karma':
        this.applyKarma();
        break;
      case 'devil':
        this.applyDevil();
        break;
      case 'premonition':
        this.state.charges.premonition++;
        this.log('Premonition: peek at one unopened pack.');
        break;
    }
  }

  private applyKarma() {
    // Compare the player's picks to the average of what they saw.
    let seen = 0;
    let seenSum = 0;
    let pickSum = 0;
    let picks = 0;
    for (const p of this.state.packs) {
      if (!p.opened || !p.cards || p.kind === 'mystery') continue;
      for (const c of p.cards) {
        seen++;
        seenSum += c.rating;
      }
      const picked = p.cards.find((c) => c.id === p.picked);
      if (picked) {
        picks++;
        pickSum += picked.rating;
      }
    }
    const avgSeen = seen ? seenSum / seen : 35;
    const avgPick = picks ? pickSum / picks : avgSeen;
    const playingWell = avgPick > avgSeen * 1.15;
    this.state.luck = playingWell ? -0.7 : 0.7;
    this.log(playingWell ? 'Karma: you have been too lucky. The universe corrects.' : 'Karma: the universe owes you one. Luck improves.');
    for (const p of this.state.packs) if (!p.opened && !p.peeked && p.kind !== 'baptized' && p.kind !== 'mystery') p.cards = null;
  }

  private applyDevil() {
    const cat = this.rng.pick(['life', 'stuff', 'ideas'] as MainCategory[]);
    const owned = this.ownedIds();
    const pool = CARDS.filter((c) => c.cat === cat && c.rarity >= 4 && !owned.has(c.id));
    const gift = this.rng.pick(pool);
    this.state.picks.push(this.newInst(gift));
    this.applyAbility(gift);
    this.state.devilPending = this.unopenedCount() > 0;
    this.log(`Deal with the Devil: ${gift.name} is yours. ${this.state.devilPending ? 'He collects before your last pack.' : 'He had nothing left to take.'}`);
  }

  private collectDevilDebt() {
    this.state.devilPending = false;
    if (this.state.picks.length === 0) return;
    const idx = this.rng.int(this.state.picks.length);
    const [taken] = this.state.picks.splice(idx, 1);
    const pack = this.state.packs.find((p) => p.picked === taken.def.id);
    if (pack) pack.picked = `taken:${taken.def.id}`;
    this.log(`The Devil collects: ${taken.def.name} is gone.`);
  }

  /** God: open all remaining packs at once and auto-pick for the highest potential. */
  private openEverything() {
    for (const p of this.state.packs) p.locked = false;
    this.state.devilPending = false;
    let guard = 0;
    while (this.state.packs.some((p) => !p.opened || !p.picked) && guard++ < 50) {
      const p = this.state.packs.find((x) => !x.opened || !x.picked)!;
      if (!p.opened) {
        if (p.kind === 'baptized' && !p.category) p.category = this.rng.pick(['life', 'stuff', 'ideas'] as MainCategory[]);
        if (!p.cards) p.cards = this.generateCards(p);
        p.opened = true;
      }
      if (!p.cards || p.cards.length === 0) {
        p.picked = 'none';
        continue;
      }
      let best: CardDef | null = null;
      let bestScore = -Infinity;
      for (const c of p.cards) {
        if (c.cat === 'special') continue;
        const trial = [...this.state.picks, { uid: 'trial', def: c }];
        const score = buildDeck(trial, { unlocked: 3 }).potential;
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      if (!best) best = p.cards[0];
      p.picked = best.id;
      if (best.cat === 'special') {
        this.state.trophies.push(best);
        if (best.ability === 'redemption') this.applySpecial(best);
      } else {
        this.state.picks.push(this.newInst(best));
      }
    }
    this.refreshLocks();
  }
}
