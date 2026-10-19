import type { AbilityId } from '../engine/types';

export interface AbilityDef {
  name: string;
  /** when it fires: on pick (and on acquiring the card), a held charge, or always-on */
  timing: 'pick' | 'charge' | 'passive';
  text: string;
  /** contribution to the tier score */
  worth: number;
}

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  delorean: { name: 'Time Travel', timing: 'charge', text: 'Go back to one pack you already picked from and choose again. Same options.', worth: 10 },
  bitcoin: { name: 'Buy In', timing: 'pick', text: 'Spend the Bitcoin to buy an extra Enhanced pack. The Bitcoin leaves your set.', worth: 12 },
  cat: { name: 'Superposition', timing: 'pick', text: 'From your next pack you take two cards. One stays face up, one under. Flip them on your turns; whichever is up at the end counts. A card\'s ability fires the first time it is shown.', worth: 14 },
  flamethrower: { name: 'Burn', timing: 'pick', text: 'Burn one of their cards the moment you pick this. It is gone.', worth: 25 },
  divine: { name: 'Guidance', timing: 'pick', text: 'In your next pack, the best card for your set is marked with a holy outline.', worth: 10 },
  area51: { name: 'Classified', timing: 'pick', text: 'Protect one card: it cannot be stolen, burned, removed or swapped, and the opponent cannot see it. Protect a card you already hold now, or the next one you pick.', worth: 15 },
  pentagon: { name: 'Containment', timing: 'pick', text: 'If they hold Communism, it is removed and you are offered a Military Coup.', worth: 10 },
  rapture: { name: 'Ascension', timing: 'pick', text: 'Their highest-rated card is taken up. Removed.', worth: 30 },
  cayman: { name: 'Offshore', timing: 'passive', text: 'Your money cards (50 Bucks, NINJA Loan, Bitcoin) cannot be stolen, burned, removed or swapped.', worth: 6 },
  ponzi: { name: 'Trade Up', timing: 'pick', text: 'Your 50 Bucks for their NINJA Loan, or your NINJA Loan for their Bitcoin. You always trade up.', worth: 8 },
  bermuda: { name: 'Lost at Sea', timing: 'pick', text: 'Their boats vanish: Somali Pirate, Jetski, Fishing Trawler.', worth: 12 },
  coup: { name: 'Regime Change', timing: 'pick', text: 'Swap one of their cards for one of yours.', worth: 25 },
  dejavu: { name: 'Seen It', timing: 'pick', text: 'Look inside one of your unopened packs without taking anything.', worth: 6 },
  trolley: { name: 'The Lever', timing: 'pick', text: 'Remove their lowest-rated card, or one of their unopened Basic packs.', worth: 18 },
  wedding: { name: 'Objection', timing: 'pick', text: 'Cancel one of their combos. Its cards still count for other combos.', worth: 12 },
  defib: { name: 'Revive', timing: 'pick', text: 'Bring back one of your destroyed cards.', worth: 14 },
  bouncer: { name: 'Rebuff', timing: 'passive', text: 'Stops their next steal or swap. Does not stop burns or removals.', worth: 10 },
  postnut: { name: 'Clarity', timing: 'pick', text: 'Trade your lowest-rated card for a random card of the same category.', worth: 6 },
  pretty: { name: 'Comped', timing: 'pick', text: 'Steal their 50 Bucks, Vodka Soda or Vape.', worth: 8 },
  dui: { name: 'Checkpoint', timing: 'pick', text: 'If they hold a vehicle (Convertible, Scooter Granny, Minivan, Jetski, Segway) and an impairment (6-Pack, Bad Trip, Fentanyl, Vodka Soda), they lose all of one group.', worth: 10 },
  // ??? cards
  redemption: { name: 'Redemption', timing: 'pick', text: 'A 2-card pack that opens after everything else.', worth: 72 },
  god: { name: 'God', timing: 'pick', text: 'Every slot opens, every pack opens at once, and the best set is built for you.', worth: 99 },
  aether: { name: 'Aether', timing: 'pick', text: 'Nothing. Absolutely nothing.', worth: 10 },
  karma: { name: 'Karma', timing: 'pick', text: 'Playing badly? Your luck turns. Playing well? Also turns.', worth: 60 },
  devil: { name: 'Deal with the Devil', timing: 'pick', text: 'A great card now. One of yours is taken before your last pack.', worth: 75 },
  premonition: { name: 'Premonition', timing: 'pick', text: 'Peek inside one unopened pack.', worth: 58 },
};
