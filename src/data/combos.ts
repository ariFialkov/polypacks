import type { Combo } from '../engine/types';

export const COMBOS: Combo[] = [
  // the originals
  { id: 'mile-high-club', name: 'Mile-High Club', parts: [['airplane-bathroom'], ['walk-of-shame'], ['post-nut-clarity']], bonus: 60, blurb: 'Membership has its privileges.' },
  { id: 'shotgun-wedding', name: 'Shotgun Wedding', parts: [['baby-momma'], ['monogamy']], bonus: 30 },
  { id: 'hostile-takeover', name: 'Hostile Takeover', parts: [['somali-pirate'], ['ss-edmund-fitzgerald', 'fishing-trawler']], bonus: 45, unlock: 1, blurb: 'Unlocks a special slot.' },
  { id: 'corporate-raid', name: 'Corporate Raid', parts: [['finance-bro'], ['ninja-loan', 'ponzi-scheme']], bonus: 40, unlock: 1, blurb: 'Unlocks a special slot.' },
  { id: 'tax-shelter', name: 'Tax Shelter', parts: [['tax-evasion'], ['cayman-islands']], bonus: 40 },
  { id: 'freudian-slip', name: 'Freudian Slip', parts: [['scooter-granny'], ['therapist']], bonus: 25 },
  { id: 'apocalypse', name: 'Apocalypse', parts: [['communism'], ['uranium'], ['earthquake'], ['area-51']], bonus: 120, unlock: 3, blurb: 'Unlocks every special slot.' },
  { id: 'sharknado', name: 'Sharknado', parts: [['great-white-shark'], ['tornado']], bonus: 45, blurb: 'Enough said.' },
  // the practical
  { id: 'conclave', name: 'Conclave', parts: [['the-pope'], ['vatican-city']], bonus: 35 },
  { id: 'meltdown', name: 'Meltdown', parts: [['chernobyl'], ['uranium']], bonus: 45 },
  { id: 'space-race', name: 'Space Race', parts: [['soviet-cosmonaut'], ['moon-landing', 'the-moon']], bonus: 45 },
  { id: 'cold-war', name: 'Cold War', parts: [['soviet-cosmonaut'], ['communism']], bonus: 30 },
  { id: 'nuclear-option', name: 'Nuclear Option', parts: [['uranium'], ['apache-helicopter'], ['the-pentagon']], bonus: 60, unlock: 1, blurb: 'Unlocks a special slot.' },
  { id: 'deadliest-catch', name: 'Deadliest Catch', parts: [['fishing-trawler'], ['bluefin-tuna']], bonus: 35 },
  { id: 'catch-of-the-day', name: 'Catch of the Day', parts: [['bluefin-tuna'], ['personal-chef']], bonus: 30 },
  { id: 'eagle-scout', name: 'Eagle Scout', parts: [['bald-eagle'], ['the-american-dream']], bonus: 40 },
  { id: 'et-tu', name: 'Et Tu, Brute?', parts: [['julius-caesar'], ['military-coup']], bonus: 35 },
  { id: 'peasant-uprising', name: 'Peasant Uprising', parts: [['medieval-peasant'], ['the-french-revolution']], bonus: 35 },
  { id: 'high-roller', name: 'High Roller', parts: [['las-vegas'], ['bitcoin', 'ponzi-scheme', 'fifty-bucks']], bonus: 30 },
  { id: 'crypto-winter', name: 'Crypto Winter', parts: [['bitcoin'], ['antarctica']], bonus: 35 },
  { id: 'bear-market', name: 'Bear Market', parts: [['cocaine-bear'], ['bitcoin']], bonus: 35 },
  { id: 'golden-parachute', name: 'Golden Parachute', parts: [['finance-bro'], ['golden-toilet']], bonus: 40 },
  { id: 'audit', name: 'The Audit', parts: [['tax-evasion'], ['jury-duty']], bonus: 30 },
  { id: 'honey-trap', name: 'Honey Trap', parts: [['catfished'], ['sugar-daddy']], bonus: 30 },
  { id: 'throne-room', name: 'Throne Room', parts: [['golden-toilet'], ['the-oval-office']], bonus: 45 },
  { id: 'hail-mary', name: 'Hail Mary', parts: [['the-pope'], ['divine-intervention']], bonus: 40 },
  { id: 'rapture-ready', name: 'Rapture Ready', parts: [['the-rapture'], ['jehovahs-witness']], bonus: 35 },
  { id: 'apex-predators', name: 'Apex Predators', parts: [['great-white-shark'], ['hippopotamus'], ['cocaine-bear']], bonus: 60, unlock: 1, blurb: 'Unlocks a special slot.' },
  { id: 'summit-fever', name: 'Summit Fever', parts: [['mount-everest'], ['delusions-of-grandeur']], bonus: 30 },
  { id: 'multi-track-drifting', name: 'Multi-track Drifting', parts: [['the-trolley-problem'], ['fender-bender']], bonus: 25 },
  { id: 'cattle-drive', name: 'Cattle Drive', parts: [['cattle-prod'], ['running-of-the-bulls']], bonus: 30 },
  { id: 'quantum-loop', name: 'Quantum Loop', parts: [['deja-vu'], ['schrodingers-cat']], bonus: 30 },
  // the whimsical
  { id: 'florida-headline', name: 'Florida Headline', parts: [['florida-man'], ['cocaine-bear', 'rottweiler', 'jetski', 'crocs']], bonus: 30 },
  { id: 'popemobile', name: 'Popemobile', parts: [['the-pope'], ['minivan']], bonus: 30 },
  { id: 'hot-girl-summer', name: 'Hot Girl Summer', parts: [['hot-tub'], ['influencer'], ['pretty-privilege']], bonus: 45 },
  { id: 'thirst-trap', name: 'Thirst Trap', parts: [['influencer'], ['thong']], bonus: 25 },
  { id: 'boomer-energy', name: 'Boomer Energy', parts: [['boomer'], ['fax-machine', 'timeshare']], bonus: 20 },
  { id: 'bingo-night', name: 'Bingo Night', parts: [['scooter-granny'], ['boomer'], ['mall-food-court']], bonus: 35 },
  { id: 'suburban-grand-prix', name: 'Suburban Grand Prix', parts: [['divorced-dad'], ['leaf-blower'], ['waffle-house']], bonus: 40 },
  { id: 'dad-bod', name: 'Dad Bod', parts: [['divorced-dad'], ['six-pack'], ['crocs']], bonus: 35 },
  { id: 'lawn-care', name: 'Lawn Care', parts: [['leaf-blower'], ['hoa-president']], bonus: 25 },
  { id: 'crabs-in-a-bucket', name: 'Crabs in a Bucket', parts: [['coconut-crab'], ['prison-shower']], bonus: 25 },
  { id: 'honey-heist', name: 'Honey Heist', parts: [['swarm-of-bees'], ['cocaine-bear']], bonus: 30 },
  { id: 'capy-spa', name: 'Capy Spa', parts: [['capybara'], ['hot-tub']], bonus: 25 },
  { id: 'nordic-spa', name: 'Nordic Spa', parts: [['antarctica'], ['hot-tub']], bonus: 25 },
  { id: 'air-fryer-gospel', name: 'Air Fryer Gospel', parts: [['air-fryer'], ['jehovahs-witness']], bonus: 20 },
  { id: 'zombie-apocalypse', name: 'Zombie Apocalypse', parts: [['zombie'], ['flamethrower']], bonus: 30 },
  { id: 'mall-life', name: 'Mall Life', parts: [['mall-cop'], ['mall-santa'], ['mall-food-court']], bonus: 45, unlock: 1, blurb: 'Unlocks a special slot.' },
  { id: 'mall-rats', name: 'Mall Rats', parts: [['mall-cop'], ['ipad-kid']], bonus: 20 },
  { id: 'karen-manager', name: 'Speak to the Manager', parts: [['karen'], ['hoa-president']], bonus: 20 },
  { id: 'reply-all-karen', name: 'Reply-All Karen', parts: [['karen'], ['accidental-reply-all']], bonus: 20 },
  { id: 'witch-hunt', name: 'Witch Hunt', parts: [['salem-witch-trials'], ['karen']], bonus: 25 },
  { id: 'frat-house', name: 'Frat House', parts: [['frat-guy'], ['six-pack'], ['trampoline']], bonus: 35 },
  { id: 'spring-break', name: 'Spring Break', parts: [['frat-guy'], ['las-vegas', 'hot-tub']], bonus: 25 },
  { id: 'the-hangover', name: 'The Hangover', parts: [['las-vegas'], ['six-pack', 'vodka-soda'], ['walk-of-shame']], bonus: 40 },
  { id: 'last-call', name: 'Last Call', parts: [['bouncer'], ['vodka-soda'], ['six-pack']], bonus: 30 },
  { id: 'happy-hour', name: 'Happy Hour', parts: [['vodka-soda'], ['high-school-reunion']], bonus: 25 },
  { id: 'vices', name: 'Vices', parts: [['loosey'], ['vape'], ['vodka-soda']], bonus: 35 },
  { id: 'open-bar', name: 'Open Bar', parts: [['open-mic-night'], ['vodka-soda']], bonus: 20 },
  { id: 'swolemate', name: 'Swolemate', parts: [['wifes-ex-dale'], ['bouncer']], bonus: 25 },
  { id: 'cool-uncle-energy', name: 'Cool Uncle Energy', parts: [['cool-uncle'], ['convertible']], bonus: 25 },
  { id: 'road-to-nowhere', name: 'Road to Nowhere', parts: [['convertible'], ['sahara-desert']], bonus: 30 },
  { id: 'snowbirds', name: 'Snowbirds', parts: [['scooter-granny'], ['timeshare']], bonus: 20 },
  { id: 'woke-up-in-ohio', name: 'Woke Up in Ohio', parts: [['bad-trip'], ['ohio']], bonus: 25 },
  { id: 'sentinel-welcome', name: 'Sentinel Welcome', parts: [['north-sentinel-island'], ['influencer']], bonus: 30 },
  { id: 'reply-all-disaster', name: 'Reply-All Disaster', parts: [['intern'], ['accidental-reply-all']], bonus: 15 },
  { id: 'iron-chef', name: 'Iron Chef', parts: [['personal-chef'], ['rotisserie-chicken', 'crockpot', 'air-fryer']], bonus: 25 },
  { id: 'gas-station-sushi', name: 'Gas Station Sushi', parts: [['bluefin-tuna'], ['food-poisoning']], bonus: 25 },
  { id: 'shark-week', name: 'Shark Week', parts: [['great-white-shark'], ['jetski', 'fishing-trawler']], bonus: 30 },
  { id: 'nuclear-family', name: 'Nuclear Family', parts: [['uranium'], ['minivan']], bonus: 30 },
  { id: 'red-flag', name: 'Red Flag', parts: [['situationship'], ['gaslighting']], bonus: 25 },
  { id: 'emotional-support', name: 'Emotional Support', parts: [['emotional-support-peacock'], ['therapist']], bonus: 25 },
  { id: 'cult-classic', name: 'Cult Classic', parts: [['jehovahs-witness'], ['stockholm-syndrome']], bonus: 30 },
  { id: 'sleep-hygiene', name: 'Sleep Hygiene', parts: [['used-mattress'], ['black-mould']], bonus: 25 },
  { id: 'cabin-fever', name: 'Cabin Fever', parts: [['crawl-space'], ['sleep-paralysis']], bonus: 25 },
  { id: 'doomscroll', name: 'Doomscroll', parts: [['ipad-kid'], ['sleep-paralysis']], bonus: 25 },
  { id: 'zoomies', name: 'Zoomies', parts: [['french-bulldog'], ['roomba']], bonus: 20 },
  { id: 'trash-panda-feast', name: 'Trash Panda Feast', parts: [['raccoon'], ['rotisserie-chicken']], bonus: 20 },
  { id: 'walk-of-fame', name: 'Walk of Fame', parts: [['walk-of-shame'], ['pretty-privilege']], bonus: 25 },
  { id: 'pharaohs-fund', name: "Pharaoh's Fund", parts: [['ponzi-scheme'], ['delusions-of-grandeur']], bonus: 30 },
  { id: 'jury-of-peers', name: 'Jury of Peers', parts: [['jury-duty'], ['belgium']], bonus: 30, blurb: 'Eleven million of your peers.' },
  // ideas: every idea card has at least one partner
  { id: 'show-your-work', name: 'Show Your Work', parts: [['algebra'], ['substitute-teacher']], bonus: 25 },
  { id: 'new-math', name: 'New Math', parts: [['algebra'], ['girl-math'], ['shopping-cart', 'fifty-bucks']], bonus: 40 },
  { id: 'beach-body', name: 'Beach Body', parts: [['manscaping'], ['thong', 'hot-tub']], bonus: 25 },
  { id: 'emperor-complex', name: 'Emperor Complex', parts: [['delusions-of-grandeur'], ['julius-caesar']], bonus: 35 },
  { id: 'brand-deal', name: 'Brand Deal', parts: [['delusions-of-grandeur'], ['influencer']], bonus: 25 },
  { id: 'great-scott', name: 'Great Scott', parts: [['theory-of-relativity'], ['delorean']], bonus: 45 },
  { id: 'unified-theory', name: 'Unified Theory', parts: [['theory-of-relativity'], ['the-big-bang']], bonus: 40 },
  { id: 'screen-time', name: 'Screen Time', parts: [['bluetooth'], ['ipad-kid']], bonus: 20 },
  { id: 'smart-home', name: 'Smart Home', parts: [['bluetooth'], ['roomba', 'air-fryer', 'lava-lamp']], bonus: 25 },
  { id: 'supply-side', name: 'Supply Side', parts: [['trickle-down-economics'], ['finance-bro', 'boomer']], bonus: 30 },
  { id: 'sugar-rush', name: 'Sugar Rush', parts: [['daddy-issues'], ['sugar-daddy']], bonus: 30 },
  { id: 'weekend-custody', name: 'Weekend Custody', parts: [['daddy-issues'], ['divorced-dad']], bonus: 25 },
  { id: 'captive-audience', name: 'Captive Audience', parts: [['stockholm-syndrome'], ['somali-pirate']], bonus: 30 },
  { id: 'grew-to-love-it', name: 'Grew to Love It', parts: [['stockholm-syndrome'], ['hoa-president', 'karen']], bonus: 20 },
  { id: 'look-the-other-way', name: 'Look the Other Way', parts: [['tax-evasion'], ['crooked-cop']], bonus: 30 },
  { id: 'leap-of-faith', name: 'Leap of Faith', parts: [['free-will'], ['the-rapture', 'divine-intervention']], bonus: 30 },
  { id: 'choose-your-fighter', name: 'Choose Your Fighter', parts: [['free-will'], ['samurai', 'navy-seal', 'wyatt-earp']], bonus: 35 },
  { id: 'workers-unite', name: 'Workers Unite', parts: [['communism'], ['medieval-peasant', 'amish-farmer']], bonus: 30 },
  { id: 'breadline', name: 'Breadline', parts: [['communism'], ['shopping-cart']], bonus: 20 },
  { id: 'go-west', name: 'Go West', parts: [['the-american-dream'], ['wyatt-earp', 'convertible']], bonus: 35 },
  { id: 'frontier', name: 'Frontier', parts: [['manifest-destiny'], ['wyatt-earp', 'amish-farmer', 'bald-eagle']], bonus: 35 },
  { id: 'survival-of-the-fittest', name: 'Survival of the Fittest', parts: [['natural-selection'], ['waterbear', 'cocaine-bear', 'great-white-shark']], bonus: 40 },
  { id: 'define-the-relationship', name: 'Define the Relationship', parts: [['monogamy'], ['situationship', 'catfished']], bonus: 25 },
  { id: 'yes-and', name: 'Yes, And', parts: [['improv'], ['open-mic-night', 'flash-mob']], bonus: 30 },
  { id: 'pyramid', name: 'Pyramid', parts: [['ponzi-scheme'], ['boomer', 'scooter-granny']], bonus: 25 },
  { id: 'overconfident-hire', name: 'Overconfident Hire', parts: [['dunning-kruger-effect'], ['intern', 'florida-man']], bonus: 25 },
  { id: 'chore-dodger', name: 'Chore Dodger', parts: [['weaponized-incompetence'], ['divorced-dad', 'intern']], bonus: 25 },
  { id: 'basically-free', name: 'Basically Free', parts: [['girl-math'], ['fifty-bucks', 'timeshare']], bonus: 25 },
  { id: 'chaos-theory', name: 'Chaos Theory', parts: [['the-butterfly-effect'], ['tornado', 'tsunami', 'earthquake']], bonus: 35 },
  { id: 'no-comment', name: 'No Comment', parts: [['plausible-deniability'], ['crooked-cop', 'finance-bro']], bonus: 30 },
  { id: 'should-have-counted', name: 'Should Have Counted', parts: [['five-second-rule'], ['food-poisoning', 'rotisserie-chicken']], bonus: 25 },
  { id: 'unreliable-narrator', name: 'Unreliable Narrator', parts: [['gaslighting'], ['therapist', 'sleep-paralysis']], bonus: 25 },
  { id: 'moral-dilemma', name: 'Moral Dilemma', parts: [['the-trolley-problem'], ['jury-duty']], bonus: 30 },
  { id: 'points-program', name: 'Points Program', parts: [['sunk-cost-fallacy'], ['timeshare', 'ninja-loan']], bonus: 30 },
  { id: 'main-character', name: 'Main Character', parts: [['pretty-privilege'], ['emotional-support-peacock']], bonus: 25 },
  { id: 'circle-back', name: 'Circle Back', parts: [['corporate-synergy'], ['intern', 'fax-machine']], bonus: 25 },
  { id: 'brotherhood', name: 'Brotherhood', parts: [['the-bro-code'], ['frat-guy', 'cool-uncle']], bonus: 30 },
  { id: 'groundhog-day', name: 'Groundhog Day', parts: [['deja-vu'], ['missed-flight', 'jury-duty']], bonus: 25 },
  { id: 'expect-the-worst', name: 'Expect the Worst', parts: [['murphys-law'], ['fender-bender', 'missed-flight', 'food-poisoning']], bonus: 30 },
  { id: 'morning-after', name: 'Morning After', parts: [['post-nut-clarity'], ['walk-of-shame']], bonus: 25 },

  // home combos: these only count when the place is your home place
  { id: 'home-vegas', name: 'Vegas Residency', parts: [['las-vegas'], ['open-mic-night', 'flash-mob']], bonus: 35, home: 'las-vegas' },
  { id: 'home-oval', name: 'Inside Job', parts: [['the-oval-office'], ['military-coup']], bonus: 40, home: 'the-oval-office' },
  { id: 'home-pentagon', name: 'Chain of Command', parts: [['the-pentagon'], ['navy-seal', 'apache-helicopter']], bonus: 35, home: 'the-pentagon' },
  { id: 'home-area51', name: 'Defector', parts: [['area-51'], ['soviet-cosmonaut']], bonus: 35, home: 'area-51' },
  { id: 'home-antarctica', name: 'Unkillable', parts: [['antarctica'], ['waterbear']], bonus: 30, home: 'antarctica' },
  { id: 'home-everest', name: 'Summit Push', parts: [['mount-everest'], ['epipen', 'smelling-salts']], bonus: 30, home: 'mount-everest' },
  { id: 'home-waffle', name: 'Waffle House Index', parts: [['waffle-house'], ['florida-man', 'tornado']], bonus: 35, home: 'waffle-house' },
  { id: 'home-chuckecheese', name: 'Birthday Party', parts: [['chuck-e-cheese'], ['ipad-kid', 'gender-reveal']], bonus: 30, home: 'chuck-e-cheese' },
  { id: 'home-foodcourt', name: 'Food Court Patrol', parts: [['mall-food-court'], ['mall-cop', 'mall-santa']], bonus: 30, home: 'mall-food-court' },
  { id: 'home-hell', name: 'Left Behind', parts: [['hell'], ['the-rapture']], bonus: 35, home: 'hell' },
  { id: 'home-purgatory', name: 'Eternal Deliberation', parts: [['purgatory'], ['jury-duty']], bonus: 30, home: 'purgatory' },
  { id: 'home-vatican', name: 'Miracle Worker', parts: [['vatican-city'], ['divine-intervention']], bonus: 35, home: 'vatican-city' },
  { id: 'home-cayman', name: 'Offshore Account', parts: [['cayman-islands'], ['finance-bro', 'sugar-daddy']], bonus: 35, home: 'cayman-islands' },
  { id: 'home-bermuda', name: 'Lost at Sea', parts: [['bermuda-triangle'], ['ss-edmund-fitzgerald', 'fishing-trawler']], bonus: 30, home: 'bermuda-triangle' },
  { id: 'home-trench', name: 'Deep Dive', parts: [['marianas-trench'], ['great-white-shark', 'bluefin-tuna']], bonus: 30, home: 'marianas-trench' },
  { id: 'home-northkorea', name: 'Rogue State', parts: [['north-korea'], ['uranium']], bonus: 40, home: 'north-korea' },
  { id: 'home-gulag', name: 'Five-Year Plan', parts: [['the-gulag'], ['communism']], bonus: 35, home: 'the-gulag' },
  { id: 'home-chernobyl', name: 'Exclusion Zone', parts: [['chernobyl'], ['zombie', 'black-mould']], bonus: 30, home: 'chernobyl' },
  { id: 'home-ohio', name: 'Heartland', parts: [['ohio'], ['amish-farmer', 'boomer']], bonus: 25, home: 'ohio' },
  { id: 'home-doghouse', name: 'Couch Again', parts: [['the-doghouse'], ['divorced-dad', 'rottweiler', 'french-bulldog']], bonus: 30, home: 'the-doghouse' },
  { id: 'home-friendzone', name: 'Just Friends', parts: [['the-friend-zone'], ['situationship', 'monogamy']], bonus: 30, home: 'the-friend-zone' },
  { id: 'home-crawlspace', name: 'Squatters', parts: [['crawl-space'], ['raccoon', 'black-mould']], bonus: 25, home: 'crawl-space' },
  { id: 'home-rainbow', name: 'Pot of Gold', parts: [['end-of-a-rainbow'], ['fifty-bucks', 'trickle-down-economics']], bonus: 30, home: 'end-of-a-rainbow' },
  { id: 'home-sahara', name: 'Desert Run', parts: [['sahara-desert'], ['jerrycan', 'convertible']], bonus: 25, home: 'sahara-desert' },
  { id: 'home-nemo', name: 'Splashdown', parts: [['point-nemo'], ['moon-landing', 'the-moon']], bonus: 30, home: 'point-nemo' },
  { id: 'home-shadow', name: 'Night Terrors', parts: [['the-shadow-realm'], ['sleep-paralysis', 'zombie']], bonus: 30, home: 'the-shadow-realm' },
  { id: 'home-prison', name: 'Cellmates', parts: [['prison-shower'], ['crooked-cop', 'florida-man']], bonus: 25, home: 'prison-shower' },
  { id: 'home-panama', name: 'Toll Road', parts: [['the-panama-canal'], ['fishing-trawler', 'ss-edmund-fitzgerald', 'jetski']], bonus: 25, home: 'the-panama-canal' },
  { id: 'home-dmv', name: 'Renewal Day', parts: [['dmv'], ['scooter-granny', 'minivan']], bonus: 25, home: 'dmv' },
  { id: 'home-line', name: 'Any Minute Now', parts: [['back-of-the-line'], ['snail', 'boomer']], bonus: 25, home: 'back-of-the-line' },
  { id: 'home-uncanny', name: 'Filter', parts: [['the-uncanny-valley'], ['influencer', 'roomba']], bonus: 25, home: 'the-uncanny-valley' },
  { id: 'home-sentinel', name: 'Uninvited', parts: [['north-sentinel-island'], ['navy-seal', 'somali-pirate']], bonus: 30, home: 'north-sentinel-island' },
];

export const COMBO_BY_ID: Record<string, Combo> = Object.fromEntries(COMBOS.map((c) => [c.id, c]));

/** Returns the combos fully present in a set of card ids. */
/** Regular combos completed by these cards (home combos are scored separately, in the showdown). */
export function findCombos(cardIds: Iterable<string>): Combo[] {
  const set = new Set(cardIds);
  return COMBOS.filter((combo) => !combo.home && combo.parts.every((alts) => alts.some((id) => set.has(id))));
}

/** Home combos completed by these cards when `homeId` is the home place. */
export function findHomeCombos(homeId: string | null, cardIds: Iterable<string>): Combo[] {
  if (!homeId) return [];
  const set = new Set(cardIds);
  return COMBOS.filter((combo) => combo.home === homeId && combo.parts.every((alts) => alts.some((id) => set.has(id))));
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
