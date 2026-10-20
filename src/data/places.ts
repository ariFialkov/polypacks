// Places and their themes. A side's home place is its best slotted place; every life, stuff and event
// card in the set that shares a theme with it is a "home tie" worth a little extra, and events rally
// for the home in the battle for home turf. All of it is scored in the showdown after the last pick.

export type Theme =
  | 'sea' | 'wild' | 'money' | 'party' | 'crime' | 'power' | 'afterlife' | 'science'
  | 'suburbia' | 'food' | 'grime' | 'cold' | 'history' | 'travel' | 'weird' | 'fitness';

export const THEME_LABEL: Record<Theme, string> = {
  sea: 'the sea', wild: 'the wild', money: 'money', party: 'the party', crime: 'crime', power: 'power',
  afterlife: 'the afterlife', science: 'science', suburbia: 'suburbia', food: 'food', grime: 'grime',
  cold: 'the cold', history: 'history', travel: 'the road', weird: 'the weird', fitness: 'fitness',
};

/** Life, stuff and event cards by theme (a card can sit in several). */
export const THEMES: Record<Theme, string[]> = {
  sea: ['somali-pirate', 'great-white-shark', 'navy-seal', 'hippopotamus', 'coconut-crab', 'ss-edmund-fitzgerald', 'fishing-trawler', 'jetski', 'bluefin-tuna', 'galoshes', 'tsunami'],
  wild: ['raccoon', 'swarm-of-bees', 'birch-tree', 'bald-eagle', 'waterbear', 'snail', 'coconut-crab', 'capybara', 'australian-magpie', 'cocaine-bear', 'hippopotamus', 'harambe', 'rottweiler', 'tornado', 'earthquake', 'running-of-the-bulls', 'amish-farmer', 'french-bulldog', 'cattle-prod'],
  money: ['finance-bro', 'sugar-daddy', 'nepo-baby', 'bitcoin', 'ninja-loan', 'fifty-bucks', 'golden-toilet', 'timeshare', 'hot-tub', 'convertible'],
  party: ['frat-guy', 'influencer', 'bouncer', 'six-pack', 'vodka-soda', 'vape', 'loosey', 'hot-tub', 'thong', 'walk-of-shame', 'bad-trip', 'open-mic-night', 'flash-mob', 'gender-reveal', 'wet-dream', 'woodstock-99', 'wedding-objection'],
  crime: ['crooked-cop', 'somali-pirate', 'florida-man', 'fentanyl', 'loosey', 'surprise-drug-test', 'dui-checkpoint', 'catfished', 'jury-duty', 'military-coup', 'mall-cop', 'cattle-prod'],
  power: ['julius-caesar', 'the-pope', 'navy-seal', 'bald-eagle', 'soviet-cosmonaut', 'apache-helicopter', 'uranium', 'flamethrower', 'military-coup', 'wwii', 'the-french-revolution', 'moon-landing'],
  afterlife: ['the-pope', 'zombie', 'divine-intervention', 'the-rapture', 'sneeze-during-eulogy', 'salem-witch-trials', 'defibrillator', 'smelling-salts', 'sleep-paralysis', 'jehovahs-witness'],
  science: ['soviet-cosmonaut', 'waterbear', 'uranium', 'the-moon', 'moon-landing', 'the-big-bang', 'roomba', 'lava-lamp', 'epipen', 'defibrillator'],
  suburbia: ['karen', 'boomer', 'scooter-granny', 'divorced-dad', 'hoa-president', 'mall-santa', 'substitute-teacher', 'ipad-kid', 'baby-momma', 'intern', 'cool-uncle', 'minivan', 'air-fryer', 'crockpot', 'roomba', 'leaf-blower', 'crocs', 'trampoline', 'sippy-cup', 'fax-machine', 'thanksgiving-dinner', 'high-school-reunion', 'fender-bender', 'accidental-reply-all', 'therapist', 'virgin', 'wifes-ex-dale', 'french-bulldog', 'jehovahs-witness', 'wedding-objection'],
  food: ['personal-chef', 'rotisserie-chicken', 'crockpot', 'air-fryer', 'bluefin-tuna', 'spork', 'raccoon', 'food-poisoning', 'thanksgiving-dinner'],
  grime: ['black-mould', 'raccoon', 'loofa', 'used-mattress', 'port-a-potty', 'thong', 'chastity-belt', 'colonoscopy', 'food-poisoning', 'walk-of-shame', 'intervention', 'woodstock-99', 'erectile-dysfunction'],
  cold: ['waterbear', 'galoshes', 'jerrycan', 'smelling-salts', 'epipen', 'navy-seal', 'soviet-cosmonaut', 'bagpipes'],
  history: ['julius-caesar', 'medieval-peasant', 'samurai', 'wyatt-earp', 'amish-farmer', 'bagpipes', 'wwii', 'the-french-revolution', 'salem-witch-trials', 'moon-landing', 'belgium'],
  travel: ['scooter-granny', 'minivan', 'jetski', 'segway', 'convertible', 'shopping-cart', 'apache-helicopter', 'delorean', 'traffic-cone', 'jerrycan', 'fender-bender', 'missed-flight', 'dui-checkpoint', 'forklift'],
  weird: ['zombie', 'black-mould', 'waterbear', 'emotional-support-peacock', 'lava-lamp', 'inflatable-tube-man', 'sleep-paralysis', 'catfished', 'florida-man', 'the-big-bang'],
  fitness: ['bouncer', 'navy-seal', 'samurai', 'frat-guy', 'trampoline', 'pilates', 'running-of-the-bulls', 'surprise-drug-test', 'wifes-ex-dale'],
};

export const PLACE_THEMES: Record<string, Theme[]> = {
  hell: ['afterlife', 'crime'],
  ohio: ['suburbia', 'weird'],
  dmv: ['suburbia', 'travel'],
  'point-nemo': ['sea', 'science'],
  'vatican-city': ['afterlife', 'history', 'money'],
  'area-51': ['science', 'power', 'weird'],
  'little-st-james': ['money', 'sea', 'crime'],
  chernobyl: ['science', 'weird', 'history'],
  'the-friend-zone': ['suburbia', 'party'],
  'airplane-bathroom': ['travel', 'grime', 'party'],
  'back-of-the-line': ['suburbia', 'travel'],
  'prison-shower': ['crime', 'grime'],
  'cayman-islands': ['money', 'sea', 'crime'],
  'waffle-house': ['food', 'suburbia', 'crime'],
  'bermuda-triangle': ['sea', 'weird', 'travel'],
  'north-korea': ['power', 'history'],
  'chuck-e-cheese': ['suburbia', 'food', 'party'],
  'the-gulag': ['power', 'history', 'cold'],
  'the-shadow-realm': ['weird', 'afterlife'],
  'mall-food-court': ['food', 'suburbia'],
  purgatory: ['afterlife', 'suburbia'],
  'the-oval-office': ['power', 'money'],
  'las-vegas': ['party', 'money', 'crime'],
  'mount-everest': ['cold', 'fitness'],
  'the-g-spot': ['party', 'grime'],
  antarctica: ['cold', 'wild', 'science'],
  'the-panama-canal': ['sea', 'travel', 'money'],
  'marianas-trench': ['sea', 'weird'],
  'the-uncanny-valley': ['weird', 'science'],
  'sahara-desert': ['wild', 'travel'],
  'the-pentagon': ['power', 'science'],
  'the-doghouse': ['suburbia', 'wild'],
  'north-sentinel-island': ['wild', 'sea', 'history'],
  'end-of-a-rainbow': ['money', 'weird'],
  'crawl-space': ['grime', 'weird', 'suburbia'],
};

const CARD_THEMES = new Map<string, Theme[]>();
for (const [t, ids] of Object.entries(THEMES) as [Theme, string[]][]) for (const id of ids) CARD_THEMES.set(id, [...(CARD_THEMES.get(id) ?? []), t]);

export function themesOf(cardId: string): Theme[] {
  return PLACE_THEMES[cardId] ?? CARD_THEMES.get(cardId) ?? [];
}

/** The themes a card shares with a place (empty when it doesn't fit). */
export function sharedThemes(placeId: string, cardId: string): Theme[] {
  const pt = PLACE_THEMES[placeId] ?? [];
  return (CARD_THEMES.get(cardId) ?? []).filter((t) => pt.includes(t));
}

/** Showdown numbers. */
export const HOME_BONUS = 30; // home turf: the side with the stronger home place
export const HOME_TIE = 5; // each life, stuff or event card that fits the home place
export const EVENT_RALLY = 6; // each event in the set adds this to home power
export const EVENT_RALLY_MATCH = 6; // ...and this much more when it fits the home place

/**
 * How each place connects to the cards around it. `homeField` is the one card that calls the place
 * home: hold both and you have home place, whatever the power. `themes` names the connection for each
 * of the place's themes, and `extra` adds one-off connections outside its themes. Every connection is a
 * home tie in the showdown.
 */
export interface PlaceLinks {
  homeField: string;
  themes: Partial<Record<Theme, string>>;
  extra?: Record<string, string>;
}

export const PLACE_LINKS: Record<string, PlaceLinks> = {
  hell: { homeField: 'karen', themes: { afterlife: 'eternal damnation', crime: 'sentenced' }, extra: { flamethrower: 'keeping it warm', fentanyl: 'express route' } },
  ohio: { homeField: 'amish-farmer', themes: { suburbia: 'cornfield adjacent', weird: 'only in Ohio' } },
  dmv: { homeField: 'traffic-cone', themes: { suburbia: 'take a number', travel: 'license expired' }, extra: { 'dui-checkpoint': 'license suspended', snail: 'now serving' } },
  'point-nemo': { homeField: 'soviet-cosmonaut', themes: { sea: 'middle of nowhere', science: 'spacecraft cemetery' } },
  'vatican-city': { homeField: 'the-pope', themes: { afterlife: 'blessed', history: 'two thousand years', money: 'collection plate' }, extra: { 'mall-santa': 'wrong guy in white', zombie: 'resurrection' } },
  'area-51': { homeField: 'waterbear', themes: { science: 'classified research', power: 'top secret', weird: 'unexplained' }, extra: { 'bad-trip': 'security risk', 'florida-man': 'security risk', influencer: 'security risk' } },
  'little-st-james': { homeField: 'jetski', themes: { money: 'private island', sea: 'island', crime: 'no comment' } },
  chernobyl: { homeField: 'black-mould', themes: { science: 'meltdown', weird: 'mutated', history: '1986' }, extra: { uranium: 'core sample' } },
  'the-friend-zone': { homeField: 'virgin', themes: { suburbia: 'just friends', party: 'third wheel' } },
  'airplane-bathroom': { homeField: 'vape', themes: { travel: 'turbulence', grime: 'occupied', party: 'mile high' }, extra: { 'walk-of-shame': 'mile high' } },
  'back-of-the-line': { homeField: 'snail', themes: { suburbia: 'still waiting', travel: 'boarding group F' } },
  'prison-shower': { homeField: 'crooked-cop', themes: { crime: 'doing time', grime: 'lukewarm water' }, extra: { 'surprise-drug-test': 'random search' } },
  'cayman-islands': { homeField: 'finance-bro', themes: { money: 'offshore', sea: 'island', crime: 'tax haven' } },
  'waffle-house': { homeField: 'florida-man', themes: { food: 'scattered, smothered', suburbia: 'open 24/7', crime: 'chair fight' }, extra: { tornado: 'Waffle House Index' } },
  'bermuda-triangle': { homeField: 'ss-edmund-fitzgerald', themes: { sea: 'uncharted', weird: 'vanished', travel: 'off the map' } },
  'north-korea': { homeField: 'uranium', themes: { power: 'supreme leader', history: 'frozen in 1953' } },
  'chuck-e-cheese': { homeField: 'ipad-kid', themes: { suburbia: 'birthday party', food: 'pizza tokens', party: 'ball pit' } },
  'the-gulag': { homeField: 'medieval-peasant', themes: { power: 're-education', history: 'five-year plan', cold: 'Siberia' }, extra: { bagpipes: 'cruel and unusual' } },
  'the-shadow-realm': { homeField: 'sleep-paralysis', themes: { weird: 'banished', afterlife: 'between worlds' }, extra: { zombie: 'returning resident' } },
  'mall-food-court': { homeField: 'mall-cop', themes: { food: 'free samples', suburbia: 'teen hangout' }, extra: { 'mall-santa': 'seasonal staff' } },
  purgatory: { homeField: 'jury-duty', themes: { afterlife: 'on hold', suburbia: 'waiting room' }, extra: { 'the-rapture': 'missed the bus' } },
  'the-oval-office': { homeField: 'bald-eagle', themes: { power: 'executive order', money: 'lobbyist' }, extra: { 'military-coup': 'regime change' } },
  'las-vegas': { homeField: 'sugar-daddy', themes: { party: 'what happens here', money: 'the house always wins', crime: 'stays here' }, extra: { bouncer: 'comped' } },
  'mount-everest': { homeField: 'smelling-salts', themes: { cold: 'death zone', fitness: 'summit fever' }, extra: { 'navy-seal': 'summit team' } },
  'the-g-spot': { homeField: 'lava-lamp', themes: { party: 'hard to find', grime: 'nobody asks' } },
  antarctica: { homeField: 'galoshes', themes: { cold: 'below zero', wild: 'penguin country', science: 'research station' } },
  'the-panama-canal': { homeField: 'fishing-trawler', themes: { sea: 'the locks', travel: 'shortcut', money: 'toll booth' } },
  'marianas-trench': { homeField: 'great-white-shark', themes: { sea: 'the deep end', weird: 'unknown species' } },
  'the-uncanny-valley': { homeField: 'influencer', themes: { weird: 'almost human', science: 'AI generated' } },
  'sahara-desert': { homeField: 'jerrycan', themes: { wild: 'dune country', travel: 'road to nowhere' }, extra: { convertible: 'road trip' } },
  'the-pentagon': { homeField: 'apache-helicopter', themes: { power: 'chain of command', science: 'defense contract' }, extra: { 'navy-seal': 'special ops' } },
  'the-doghouse': { homeField: 'divorced-dad', themes: { suburbia: 'sleeping on the couch', wild: 'who let the dogs out' }, extra: { rottweiler: 'roommate', 'french-bulldog': 'roommate' } },
  'north-sentinel-island': { homeField: 'coconut-crab', themes: { wild: 'untouched', sea: 'island', history: 'uncontacted' } },
  'end-of-a-rainbow': { homeField: 'emotional-support-peacock', themes: { money: 'pot of gold', weird: 'lucky charm' }, extra: { bitcoin: 'digital gold' } },
  'crawl-space': { homeField: 'raccoon', themes: { grime: 'musty', weird: 'something moved', suburbia: 'under the house' } },
};

export const HOME_FIELD_LABEL = 'home field advantage';

/** The named connection between a place and a card (null when they don't connect). */
export function tieLabel(placeId: string, cardId: string): string | null {
  const links = PLACE_LINKS[placeId];
  if (!links) return null;
  if (links.homeField === cardId) return HOME_FIELD_LABEL;
  if (links.extra?.[cardId]) return links.extra[cardId];
  for (const t of PLACE_THEMES[placeId] ?? []) if ((CARD_THEMES.get(cardId) ?? []).includes(t)) return links.themes[t] ?? THEME_LABEL[t];
  return null;
}

/** The place a card is the home field for, if any. */
export function homeFieldPlace(cardId: string): string | null {
  for (const [place, l] of Object.entries(PLACE_LINKS)) if (l.homeField === cardId) return place;
  return null;
}
