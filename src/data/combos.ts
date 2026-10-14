import type { Combo } from '../engine/types';

export const COMBOS: Combo[] = [
  { id: 'mile-high-club', name: 'Mile-High Club', parts: [['airplane-bathroom'], ['walk-of-shame'], ['post-nut-clarity']], bonus: 60, blurb: 'Membership has its privileges.' },
  { id: 'mid-life-crisis', name: 'Mid-life Crisis', parts: [['divorce'], ['jetski']], bonus: 35, blurb: 'Lake day, every day.' },
  { id: 'shotgun-wedding', name: 'Shotgun Wedding', parts: [['baby-momma'], ['monogamy']], bonus: 30 },
  { id: 'hostile-takeover', name: 'Hostile Takeover', parts: [['somali-pirate'], ['ss-edmund-fitzgerald', 'fishing-trawler']], bonus: 45, unlock: 1, blurb: 'Unlocks a special slot.' },
  { id: 'corporate-raid', name: 'Corporate Raid', parts: [['chad-bradley'], ['ninja-loan', 'ponzi-scheme']], bonus: 40, unlock: 1, blurb: 'Unlocks a special slot.' },
  { id: 'tax-shelter', name: 'Tax Shelter', parts: [['tax-evasion'], ['cayman-islands']], bonus: 40 },
  { id: 'freudian-slip', name: 'Freudian Slip', parts: [['scooter-granny'], ['therapist']], bonus: 25 },
  { id: 'apocalypse', name: 'Apocalypse', parts: [['communism'], ['uranium'], ['earthquake'], ['area-51']], bonus: 120, unlock: 3, blurb: 'Unlocks every special slot.' },
  { id: 'florida-headline', name: 'Florida Headline', parts: [['florida-man'], ['cocaine-bear', 'rottweiler', 'jetski', 'crocs']], bonus: 30 },
  { id: 'popemobile', name: 'Popemobile', parts: [['the-pope'], ['minivan']], bonus: 30 },
  { id: 'conclave', name: 'Conclave', parts: [['the-pope'], ['vatican-city']], bonus: 35 },
  { id: 'high-roller', name: 'High Roller', parts: [['las-vegas'], ['bitcoin', 'ponzi-scheme', 'fifty-bucks']], bonus: 30 },
  { id: 'meltdown', name: 'Meltdown', parts: [['chernobyl'], ['uranium']], bonus: 45 },
  { id: 'hot-girl-summer', name: 'Hot Girl Summer', parts: [['hot-tub'], ['influencer'], ['pretty-privilege']], bonus: 45 },
  { id: 'boomer-energy', name: 'Boomer Energy', parts: [['boomer'], ['fax-machine', 'timeshare']], bonus: 20 },
  { id: 'suburban-grand-prix', name: 'Suburban Grand Prix', parts: [['divorced-dad'], ['leaf-blower'], ['waffle-house']], bonus: 40 },
  { id: 'multi-track-drifting', name: 'Multi-track Drifting', parts: [['the-trolley-problem'], ['fender-bender']], bonus: 25 },
  { id: 'et-tu', name: 'Et Tu, Brute?', parts: [['julius-caesar'], ['military-coup']], bonus: 35 },
  { id: 'crabs-in-a-bucket', name: 'Crabs in a Bucket', parts: [['coconut-crab'], ['prison-shower']], bonus: 25 },
  { id: 'honey-heist', name: 'Honey Heist', parts: [['swarm-of-bees'], ['cocaine-bear']], bonus: 30 },
  { id: 'space-race', name: 'Space Race', parts: [['soviet-cosmonaut'], ['moon-landing', 'the-moon']], bonus: 45 },
  { id: 'capy-spa', name: 'Capy Spa', parts: [['capybara'], ['hot-tub']], bonus: 25 },
  { id: 'deadliest-catch', name: 'Deadliest Catch', parts: [['fishing-trawler'], ['bluefin-tuna']], bonus: 35 },
  { id: 'air-fryer-gospel', name: 'Air Fryer Gospel', parts: [['air-fryer'], ['jehovahs-witness']], bonus: 20 },
  { id: 'zombie-apocalypse', name: 'Zombie Apocalypse', parts: [['zombie'], ['flamethrower']], bonus: 30 },
  { id: 'mall-life', name: 'Mall Life', parts: [['mall-cop'], ['mall-santa'], ['mall-food-court']], bonus: 45, unlock: 1, blurb: 'Unlocks a special slot.' },
  { id: 'karen-manager', name: 'Speak to the Manager', parts: [['karen'], ['hoa-president']], bonus: 20 },
  { id: 'quantum-loop', name: 'Quantum Loop', parts: [['deja-vu'], ['schrodingers-cat']], bonus: 30 },
  { id: 'frat-house', name: 'Frat House', parts: [['frat-guy'], ['six-pack'], ['trampoline']], bonus: 35 },
  { id: 'snowbirds', name: 'Snowbirds', parts: [['scooter-granny'], ['timeshare']], bonus: 20 },
  { id: 'throne-room', name: 'Throne Room', parts: [['golden-toilet'], ['the-oval-office']], bonus: 45 },
  { id: 'woke-up-in-ohio', name: 'Woke Up in Ohio', parts: [['bad-trip'], ['ohio']], bonus: 25 },
  { id: 'sentinel-welcome', name: 'Sentinel Welcome', parts: [['north-sentinel-island'], ['influencer']], bonus: 30 },
  { id: 'reply-all-disaster', name: 'Reply-All Disaster', parts: [['intern'], ['accidental-reply-all']], bonus: 15 },
  { id: 'iron-chef', name: 'Iron Chef', parts: [['personal-chef'], ['rotisserie-chicken', 'crockpot', 'air-fryer']], bonus: 25 },
  { id: 'shark-week', name: 'Shark Week', parts: [['great-white-shark'], ['jetski', 'fishing-trawler']], bonus: 30 },
  { id: 'cold-war', name: 'Cold War', parts: [['soviet-cosmonaut'], ['communism']], bonus: 30 },
  { id: 'nuclear-family', name: 'Nuclear Family', parts: [['uranium'], ['minivan']], bonus: 30 },
  { id: 'spring-break', name: 'Spring Break', parts: [['frat-guy'], ['las-vegas', 'hot-tub']], bonus: 25 },
  { id: 'eagle-scout', name: 'Eagle Scout', parts: [['bald-eagle'], ['the-american-dream']], bonus: 40 },
  { id: 'red-flag', name: 'Red Flag', parts: [['situationship'], ['gaslighting']], bonus: 25 },
  { id: 'the-hangover', name: 'The Hangover', parts: [['las-vegas'], ['six-pack'], ['walk-of-shame']], bonus: 40 },
];

export const COMBO_BY_ID: Record<string, Combo> = Object.fromEntries(COMBOS.map((c) => [c.id, c]));

/** Returns the combos fully present in a set of card ids. */
export function findCombos(cardIds: Iterable<string>): Combo[] {
  const set = new Set(cardIds);
  return COMBOS.filter((combo) => combo.parts.every((alts) => alts.some((id) => set.has(id))));
}

/** Combos that could still be completed if cards are added; returns partial matches with missing counts. */
export function comboHints(cardIds: Iterable<string>): { combo: Combo; have: number; missing: string[][] }[] {
  const set = new Set(cardIds);
  const out: { combo: Combo; have: number; missing: string[][] }[] = [];
  for (const combo of COMBOS) {
    const missing = combo.parts.filter((alts) => !alts.some((id) => set.has(id)));
    const have = combo.parts.length - missing.length;
    if (have > 0 && missing.length > 0) out.push({ combo, have, missing });
  }
  return out.sort((a, b) => b.have - a.have);
}
