export type Category = 'life' | 'stuff' | 'places' | 'ideas' | 'happenings' | 'special';
export type MainCategory = Exclude<Category, 'special'>;
export type Rarity = 1 | 2 | 3 | 4 | 5 | 6; // common, uncommon, rare, epic, legendary, mythic (by prowess)

/** Abilities a card can carry. Most fire on pick (and again when the card changes hands). */
export type AbilityId =
  | 'delorean'
  | 'bitcoin'
  | 'cat'
  | 'flamethrower'
  | 'divine'
  | 'area51'
  | 'pentagon'
  | 'rapture'
  | 'cayman'
  | 'ponzi'
  | 'bermuda'
  | 'coup'
  | 'dejavu'
  | 'trolley'
  | 'wedding'
  | 'defib'
  | 'bouncer'
  | 'postnut'
  | 'pretty'
  | 'dui'
  // ??? cards
  | 'redemption'
  | 'god'
  | 'aether'
  | 'karma'
  | 'devil'
  | 'premonition';

export interface CardDef {
  id: string;
  name: string;
  cat: Category;
  rating: number; // 40–99 (0 for ??? cards)
  rarity: Rarity; // tier, computed from prowess
  blurb?: string;
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
