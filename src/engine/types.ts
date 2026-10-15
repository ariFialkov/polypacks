export type Category = 'life' | 'stuff' | 'places' | 'ideas' | 'happenings' | 'special';
export type MainCategory = Exclude<Category, 'special'>;
export type Rarity = 1 | 2 | 3 | 4; // common, uncommon, rare, legendary

/** Effects a happenings card triggers when played. */
export type HappeningEffect =
  | { kind: 'boostSelf'; amount: number }
  | { kind: 'hitOpp'; amount: number }
  | { kind: 'fieldShake'; amount: number }
  | { kind: 'halveOppTop' }
  | { kind: 'doubleLast' }
  | { kind: 'steal' };

/** Draft-time abilities a card can carry. */
export type AbilityId =
  | 'delorean' // repick an already-opened pack (same options)
  | 'dejavu' // reroll the contents of one unopened pack
  | 'flashmob' // the next pack you open shows one extra option
  // ??? cards
  | 'redemption'
  | 'god'
  | 'aether'
  | 'karma'
  | 'devil'
  | 'premonition';

export interface PlaceMods {
  life?: number;
  stuff?: number;
  ideas?: number;
  happenings?: number;
}

export interface CardDef {
  id: string;
  name: string;
  cat: Category;
  rating: number; // base value in $k
  rarity: Rarity;
  blurb?: string;
  effect?: HappeningEffect;
  mods?: PlaceMods;
  ability?: AbilityId;
}

export interface CardInst {
  uid: string;
  def: CardDef;
}

export interface Combo {
  id: string;
  name: string;
  /** each entry is a list of alternative card ids; one of each entry must be present */
  parts: string[][];
  bonus: number;
  unlock?: number; // number of special slots this combo unlocks
  blurb?: string;
}

export type Side = 'you' | 'bot';
