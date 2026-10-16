import type { CardDef, Category, HappeningEffect, PlaceMods, AbilityId, Rarity } from '../engine/types';

type Row = [id: string, name: string, rating: number, blurb?: string];

type Raw = Omit<CardDef, 'rarity'>;

function rows(cat: Category, list: Row[], extra?: (id: string) => Partial<CardDef>): Raw[] {
  return list.map(([id, name, rating, blurb]) => ({
    id,
    name,
    cat,
    rating,
    blurb,
    ...(extra ? extra(id) : {}),
  }));
}

// ───────────────────────────── LIFE ─────────────────────────────
const LIFE: Row[] = [
  ['raccoon', 'Raccoon', 51, 'Trash panda. Union rep for the dumpster.'],
  ['harambe', 'Harambe', 96, 'Gone but never forgotten.'],
  ['julius-caesar', 'Julius Caesar', 88, 'Beware the Ides.'],
  ['black-mould', 'Black Mould', 44, 'Technically alive. Technically.'],
  ['belgium', 'The Entire Population of Belgium', 84, 'All 11.7 million of them.'],
  ['karen', 'Karen', 48, 'Would like to speak to the manager.'],
  ['intern', 'Intern', 43, 'Unpaid. Unstoppable. Unqualified.'],
  ['crooked-cop', 'Crooked Cop', 67, 'Badge number: redacted.'],
  ['the-pope', 'The Pope', 94, 'Direct line upstairs.'],
  ['influencer', 'Influencer', 56, 'Link in bio.'],
  ['therapist', 'Therapist', 69, 'And how does that make you feel?'],
  ['personal-chef', 'Personal Chef', 74, 'Plates everything, including grudges.'],
  ['somali-pirate', 'Somali Pirate', 72, 'Look at me. I am the captain now.'],
  ['samurai', 'Samurai', 85, 'Honour-bound and razor-sharp.'],
  ['wyatt-earp', 'Wyatt Earp', 81, 'Fastest hands in the pack.'],
  ['virgin', 'Virgin', 46, 'Untouched by scandal.'],
  ['boomer', 'Boomer', 50, 'Bought a house for $11 in 1974.'],
  ['scooter-granny', 'Scooter Granny', 60, 'Top speed: menace.'],
  ['great-white-shark', 'Great White Shark', 89, 'Apex. Period.'],
  ['cool-uncle', 'Cool Uncle', 66, 'Has a boat. Sort of.'],
  ['swarm-of-bees', 'Swarm of Bees', 63, 'Not the bees.'],
  ['birch-tree', 'Birch Tree', 45, 'Quietly photosynthesizing.'],
  ['zombie', 'Zombie', 62, 'Hungry for brains and benefits.'],
  ['wifes-ex-dale', "Wife's Ex Dale", 53, 'Still has a key, apparently.'],
  ['rottweiler', 'Rottweiler', 70, 'Good boy. Dangerous boy.'],
  ['bald-eagle', 'Bald Eagle', 87, 'Freedom, with talons.'],
  ['waterbear', 'Waterbear', 61, 'Survives everything. Even this game.'],
  ['snail', 'Snail', 41, 'Will get there eventually.'],
  ['baby-momma', 'Baby Momma', 55, 'Has receipts.'],
  ['frat-guy', 'Frat Guy', 52, 'Bro. BRO.'],
  ['florida-man', 'Florida Man', 76, 'Headline pending.'],
  ['emotional-support-peacock', 'Emotional Support Peacock', 65, 'Denied boarding, twice.'],
  ['nepo-baby', 'Nepo Baby', 67, 'Self-made, via parents.'],
  ['medieval-peasant', 'Medieval Peasant', 47, 'Owns one turnip.'],
  ['divorced-dad', 'Divorced Dad', 54, 'Grill is the only thing he kept.'],
  ['coconut-crab', 'Coconut Crab', 77, 'Opens coconuts. Opens anything.'],
  ['french-bulldog', 'French Bulldog', 59, 'Breathing is optional.'],
  ['navy-seal', 'Navy SEAL', 92, 'Over 300 confirmed packs.'],
  ['hippopotamus', 'Hippopotamus', 83, 'Deadliest animal in Africa. Also round.'],
  ['bouncer', 'Bouncer', 64, 'Not tonight, chief.'],
  ['cocaine-bear', 'Cocaine Bear', 98, 'Based on a true story.'],
  ['mall-santa', 'Mall Santa', 52, 'Smells like regret and peppermint.'],
  ['hoa-president', 'HOA President', 49, 'Your mailbox is 2 inches too tall.'],
  ['jehovahs-witness', "Jehovah's Witness", 48, 'Do you have a moment?'],
  ['capybara', 'Capybara', 74, 'Friend to all. Fears nothing.'],
  ['substitute-teacher', 'Substitute Teacher', 45, 'Put on a movie.'],
  ['australian-magpie', 'Australian Magpie', 58, 'Swooping season is eternal.'],
  ['amish-farmer', 'Amish Farmer', 61, 'Raised a barn before breakfast.'],
  ['sugar-daddy', 'Sugar Daddy', 78, 'Generous, with conditions.'],
  ['mall-cop', 'Mall Cop', 50, 'The Segway is government issue.'],
  ['ipad-kid', 'iPad Kid', 43, 'Screen time: yes.'],
  ['soviet-cosmonaut', 'Soviet Cosmonaut', 80, 'First in space, last to be paid.'],
  ['chad-bradley', 'Chad Bradley', 69, 'Crushing it, allegedly.'],
];

// ───────────────────────────── STUFF ─────────────────────────────
const STUFF: Row[] = [
  ['forklift', 'Forklift', 63, 'Certified? No. Confident? Yes.'],
  ['uranium', 'Uranium', 95, 'Glows with potential.'],
  ['the-moon', 'The Moon', 99, 'Shoot for it.'],
  ['thong', 'Thong', 44, 'Minimal coverage, maximum confidence.'],
  ['rotisserie-chicken', 'Rotisserie Chicken', 52, '$4.99 of pure value.'],
  ['loofa', 'Loofa', 41, 'Exfoliating since forever.'],
  ['fentanyl', 'Fentanyl', 74, 'Handle with extreme care.'],
  ['minivan', 'Minivan', 56, 'Sliding doors of destiny.'],
  ['flamethrower', 'Flamethrower', 84, 'Not a flamethrower, legally.'],
  ['ss-edmund-fitzgerald', 'SS Edmund Fitzgerald', 81, 'The legend lives on.'],
  ['air-fryer', 'Air Fryer', 55, 'Changed your life, you say.'],
  ['bitcoin', 'Bitcoin', 87, 'Number go up. Or down.'],
  ['hot-tub', 'Hot Tub', 67, 'Jets of questionable hygiene.'],
  ['fishing-trawler', 'Fishing Trawler', 70, 'Smells like money and herring.'],
  ['galoshes', 'Galoshes', 43, 'Puddle-proof.'],
  ['jetski', 'Jetski', 72, 'Divorce accessory.'],
  ['ninja-loan', 'NINJA Loan', 61, 'No Income, No Job, No Assets.'],
  ['apache-helicopter', 'Apache Helicopter', 96, 'Identifies as a threat.'],
  ['six-pack', '6-Pack', 51, 'Of beer. Obviously.'],
  ['bluefin-tuna', 'Bluefin Tuna', 80, 'Sold for $3M at auction once.'],
  ['loosey', 'Loosey', 42, 'Single cigarette, single regret.'],
  ['smelling-salts', 'Smelling Salts', 50, 'Wake up, we are playing cards.'],
  ['fifty-bucks', '50 Bucks', 46, 'Found in a jacket.'],
  ['timeshare', 'Timeshare', 48, 'Just a 90 minute presentation.'],
  ['used-mattress', 'Used Mattress', 43, 'Free. Mysterious stains included.'],
  ['crockpot', 'Crockpot', 53, 'Set it and forget it.'],
  ['vape', 'Vape', 45, 'Mango ice, 5%.'],
  ['traffic-cone', 'Traffic Cone', 45, 'Stolen. Obviously.'],
  ['roomba', 'Roomba', 58, 'Has seen things.'],
  ['crocs', 'Crocs', 54, 'Sport mode engaged.'],
  ['leaf-blower', 'Leaf Blower', 56, '7am. Every Sunday.'],
  ['inflatable-tube-man', 'Inflatable Tube Man', 59, 'Pure, flailing joy.'],
  ['epipen', 'EpiPen', 65, 'Priced like a kidney.'],
  ['spork', 'Spork', 41, 'Master of none.'],
  ['jerrycan', 'Jerrycan', 54, 'Full of something flammable.'],
  ['delorean', 'DeLorean', 85, 'Roads? Where we are going... Repick one opened pack.'],
  ['shopping-cart', 'Shopping Cart', 47, 'The ultimate litmus test.'],
  ['port-a-potty', 'Port-a-Potty', 49, 'Music festival throne.'],
  ['bagpipes', 'Bagpipes', 57, 'Sonic warfare.'],
  ['chastity-belt', 'Chastity Belt', 50, 'Medieval DRM.'],
  ['trampoline', 'Trampoline', 60, 'ER visit generator.'],
  ['segway', 'Segway', 59, 'Lean forward to live.'],
  ['fax-machine', 'Fax Machine', 48, 'Still used by one law firm.'],
  ['defibrillator', 'Defibrillator', 69, 'CLEAR.'],
  ['sippy-cup', 'Sippy Cup', 43, 'Spill-proof. Dignity-proof.'],
  ['cattle-prod', 'Cattle Prod', 62, 'Motivational tool.'],
  ['lava-lamp', 'Lava Lamp', 52, 'Groovy, man.'],
  ['golden-toilet', 'Golden Toilet', 91, '18 karat throne.'],
];

// ───────────────────────────── PLACES ─────────────────────────────
// Places have a modest base value and modify your own cards for the round.
type PlaceRow = [id: string, name: string, rating: number, mods: PlaceMods, blurb: string];
const PLACES: PlaceRow[] = [
  ['hell', 'Hell', 56, { life: 0.85, happenings: 1.6 }, 'Happenings hit harder. Life suffers.'],
  ['ohio', 'Ohio', 45, { stuff: 1.1 }, 'Only in Ohio.'],
  ['dmv', 'DMV', 43, { life: 0.9, stuff: 0.9, ideas: 1.3 }, 'Take a number. Think deeply.'],
  ['point-nemo', 'Point Nemo', 52, { ideas: 1.3, life: 0.9 }, 'Furthest from anyone. Ideas thrive.'],
  ['vatican-city', 'Vatican City', 61, { life: 1.15, ideas: 1.1 }, 'Holy ground.'],
  ['area-51', 'Area 51', 63, { stuff: 1.25, happenings: 1.2 }, 'Classified tech bonus.'],
  ['little-st-james', 'Little St. James', 50, { life: 0.7, stuff: 1.3 }, 'Nobody talks about who was here.'],
  ['chernobyl', 'Chernobyl', 59, { stuff: 1.3, life: 0.8 }, 'Glow-up for stuff.'],
  ['the-friend-zone', 'The Friend Zone', 41, { life: 0.95, ideas: 1.15 }, 'Lots of thinking happens here.'],
  ['airplane-bathroom', 'Airplane Bathroom', 48, { happenings: 1.3 }, 'Things happen at 36,000 feet.'],
  ['back-of-the-line', 'Back of the Line', 40, { ideas: 1.1 }, 'Plenty of time to think.'],
  ['prison-shower', 'Prison Shower', 44, { life: 1.2, stuff: 0.8 }, 'Life gets tougher here.'],
  ['cayman-islands', 'Cayman Islands', 66, { stuff: 1.3 }, 'Untaxed. Unbothered.'],
  ['waffle-house', 'Waffle House', 51, { life: 1.15, happenings: 1.2 }, 'Smothered, covered, chaos.'],
  ['bermuda-triangle', 'Bermuda Triangle', 58, { happenings: 1.5, stuff: 0.9 }, 'Things go missing. Things happen.'],
  ['north-korea', 'North Korea', 55, { life: 0.8, ideas: 0.8, stuff: 1.2 }, 'Hardware over ideas.'],
  ['chuck-e-cheese', 'Chuck E. Cheese', 47, { life: 1.1, happenings: 1.1 }, 'Where a kid can be a kid.'],
  ['the-gulag', 'The Gulag', 50, { life: 1.25, ideas: 0.7 }, 'Strong bodies, no thoughts.'],
  ['the-shadow-realm', 'The Shadow Realm', 62, { ideas: 1.4, life: 0.85 }, 'Ideas get dark and powerful.'],
  ['mall-food-court', 'Mall Food Court', 45, { life: 1.1, stuff: 1.05 }, 'Sbarro energy.'],
  ['purgatory', 'Purgatory', 54, { life: 1, stuff: 1, ideas: 1, happenings: 1 }, 'Perfectly neutral. Forever.'],
  ['the-oval-office', 'The Oval Office', 67, { life: 1.2, ideas: 1.2, stuff: 0.9 }, 'Executive decisions.'],
  ['las-vegas', 'Las Vegas', 65, { stuff: 1.2, happenings: 1.3, ideas: 0.8 }, 'What happens here, happens.'],
  ['mount-everest', 'Mount Everest', 63, { life: 1.3, stuff: 0.85 }, 'Only the strong survive.'],
  ['the-g-spot', 'The G-Spot', 56, { happenings: 1.4, ideas: 1.1 }, 'Hard to find. Big payoff.'],
  ['antarctica', 'Antarctica', 52, { life: 0.75, stuff: 1.25 }, 'Gear matters here.'],
  ['the-panama-canal', 'The Panama Canal', 59, { stuff: 1.25 }, 'Shipping bonus.'],
  ['marianas-trench', 'Marianas Trench', 58, { life: 0.8, ideas: 1.3 }, 'Deep thoughts only.'],
  ['the-uncanny-valley', 'The Uncanny Valley', 55, { life: 0.9, stuff: 1.15, ideas: 1.15 }, 'Almost human.'],
  ['sahara-desert', 'Sahara Desert', 51, { life: 0.85, happenings: 1.3 }, 'Harsh. Dramatic.'],
  ['the-pentagon', 'The Pentagon', 66, { stuff: 1.3, ideas: 1.05 }, 'Defense budget: unlimited.'],
  ['the-doghouse', 'The Doghouse', 44, { life: 1.1, happenings: 1.15 }, 'You know what you did.'],
  ['north-sentinel-island', 'North Sentinel Island', 61, { life: 1.3, stuff: 0.8, ideas: 0.9 }, 'Do not visit.'],
  ['end-of-a-rainbow', 'End of a Rainbow', 69, { stuff: 1.35 }, 'Pot of gold rules.'],
  ['crawl-space', 'Crawl Space', 43, { happenings: 1.25, life: 0.9 }, 'Something lives down here.'],
];

// ───────────────────────────── IDEAS ─────────────────────────────
const IDEAS: Row[] = [
  ['deja-vu', 'Déjà Vu', 63, 'Reroll one unopened pack. Have we done this before?'],
  ['algebra', 'Algebra', 50, 'Solve for why.'],
  ['manscaping', 'Manscaping', 45, 'Precision grooming.'],
  ['delusions-of-grandeur', 'Delusions of Grandeur', 67, 'Main character energy.'],
  ['theory-of-relativity', 'Theory of Relativity', 91, 'E = mc² of ideas.'],
  ['bluetooth', 'Bluetooth', 56, 'Connecting... connecting...'],
  ['trickle-down-economics', 'Trickle-down Economics', 53, 'Any day now.'],
  ['daddy-issues', 'Daddy Issues', 55, 'Explains a lot.'],
  ['stockholm-syndrome', 'Stockholm Syndrome', 63, 'Growing fond of this game.'],
  ['tax-evasion', 'Tax Evasion', 74, 'Allegedly.'],
  ['post-nut-clarity', 'Post-nut Clarity', 60, 'Sudden, devastating wisdom.'],
  ['free-will', 'Free Will', 77, 'The result was decided already, though.'],
  ['communism', 'Communism', 80, 'Our card.'],
  ['the-american-dream', 'The American Dream', 84, 'Terms and conditions apply.'],
  ['natural-selection', 'Natural Selection', 87, 'Only the fittest packs.'],
  ['monogamy', 'Monogamy', 58, 'One pack at a time.'],
  ['improv', 'Improv', 48, 'Yes, and...'],
  ['ponzi-scheme', 'Ponzi Scheme', 76, 'Early investors only.'],
  ['dunning-kruger-effect', 'Dunning-Kruger Effect', 62, 'Confidently wrong.'],
  ['weaponized-incompetence', 'Weaponized Incompetence', 51, 'How do I pack again?'],
  ['manifest-destiny', 'Manifest Destiny', 78, 'Westward, always.'],
  ['situationship', 'Situationship', 47, 'What are we?'],
  ['girl-math', 'Girl Math', 52, 'Technically free.'],
  ['the-butterfly-effect', 'The Butterfly Effect', 83, 'One flap. Total chaos.'],
  ['plausible-deniability', 'Plausible Deniability', 65, 'I was never here.'],
  ['five-second-rule', 'Five-second Rule', 44, 'Still good.'],
  ['murphys-law', "Murphy's Law", 61, 'Anything that can go wrong...'],
  ['gaslighting', 'Gaslighting', 66, 'That never happened.'],
  ['the-trolley-problem', 'The Trolley Problem', 70, 'Multi-track drifting.'],
  ['sunk-cost-fallacy', 'Sunk Cost Fallacy', 54, 'Too deep to quit now.'],
  ['pretty-privilege', 'Pretty Privilege', 59, 'Rules are different.'],
  ['schrodingers-cat', "Schrödinger's Cat", 85, 'Both winning and losing.'],
  ['corporate-synergy', 'Corporate Synergy', 46, 'Let us circle back.'],
  ['the-bro-code', 'The Bro Code', 50, 'Article 1: bros.'],
];

// ───────────────────────────── HAPPENINGS ─────────────────────────────
type HapRow = [id: string, name: string, rating: number, effect: HappeningEffect, blurb: string];
const HAPPENINGS: HapRow[] = [
  ['divorce', 'Divorce', 43, { kind: 'hitOpp', amount: 22 }, 'Takes half of everything. Roughly.'],
  ['wwii', 'WWII', 50, { kind: 'fieldShake', amount: 8 }, 'Everyone loses something.'],
  ['sneeze-during-eulogy', 'Sneeze During Eulogy', 41, { kind: 'hitOpp', amount: 10 }, 'Awkward. Costly.'],
  ['the-big-bang', 'The Big Bang', 56, { kind: 'boostSelf', amount: 40 }, 'Everything, all at once.'],
  ['woodstock-99', "Woodstock '99", 45, { kind: 'fieldShake', amount: 12 }, 'Fires. Mud. Limp Bizkit.'],
  ['missed-flight', 'Missed Flight', 40, { kind: 'hitOpp', amount: 15 }, 'Gate closed two minutes ago.'],
  ['pilates', 'Pilates', 43, { kind: 'boostSelf', amount: 12 }, 'Core strength, core profits.'],
  ['bad-trip', 'Bad Trip', 44, { kind: 'halveOppTop' }, 'Their best card is melting.'],
  ['colonoscopy', 'Colonoscopy', 41, { kind: 'hitOpp', amount: 18 }, 'A thorough inspection.'],
  ['military-coup', 'Military Coup', 52, { kind: 'steal' }, 'Seize their weakest asset.'],
  ['gender-reveal', 'Gender Reveal', 44, { kind: 'boostSelf', amount: 20 }, 'Started a wildfire. Worth it.'],
  ['divine-intervention', 'Divine Intervention', 53, { kind: 'doubleLast' }, 'Your last card is blessed. Doubled.'],
  ['walk-of-shame', 'Walk of Shame', 43, { kind: 'boostSelf', amount: 10 }, 'Head high, heels in hand.'],
  ['intervention', 'Intervention', 41, { kind: 'hitOpp', amount: 12 }, 'We are all here because we care.'],
  ['earthquake', 'Earthquake', 48, { kind: 'fieldShake', amount: 15 }, 'Everything shakes. Everyone pays.'],
  ['flash-mob', 'Flash Mob', 44, { kind: 'boostSelf', amount: 15 }, 'Next pack shows an extra option.'],
  ['the-rapture', 'The Rapture', 55, { kind: 'halveOppTop' }, 'Their best card ascends.'],
  ['food-poisoning', 'Food Poisoning', 40, { kind: 'hitOpp', amount: 14 }, 'The gas station sushi.'],
  ['high-school-reunion', 'High School Reunion', 44, { kind: 'boostSelf', amount: 18 }, 'Peaked. Right now.'],
  ['salem-witch-trials', 'Salem Witch Trials', 47, { kind: 'hitOpp', amount: 25 }, 'She floats.'],
  ['surprise-drug-test', 'Surprise Drug Test', 43, { kind: 'hitOpp', amount: 22 }, 'Cup. Now.'],
  ['the-french-revolution', 'The French Revolution', 51, { kind: 'steal' }, 'Redistribute their lowest card.'],
  ['accidental-reply-all', 'Accidental Reply All', 40, { kind: 'hitOpp', amount: 8 }, 'Everyone saw it.'],
  ['fender-bender', 'Fender Bender', 40, { kind: 'hitOpp', amount: 9 }, 'Exchange insurance. Exchange blows.'],
  ['erectile-dysfunction', 'Erectile Dysfunction', 41, { kind: 'hitOpp', amount: 11 }, 'Happens to everyone.'],
  ['thanksgiving-dinner', 'Thanksgiving Dinner', 44, { kind: 'boostSelf', amount: 16 }, 'Politics optional.'],
  ['tornado', 'Tornado', 50, { kind: 'fieldShake', amount: 20 }, 'Takes the roof. Takes the score.'],
  ['moon-landing', 'Moon Landing', 54, { kind: 'boostSelf', amount: 30 }, 'One small step. Huge value.'],
  ['tsunami', 'Tsunami', 51, { kind: 'hitOpp', amount: 28 }, 'Washes their field.'],
  ['catfished', 'Catfished', 43, { kind: 'steal' }, 'They were not who they said.'],
  ['open-mic-night', 'Open Mic Night', 40, { kind: 'boostSelf', amount: 8 }, 'Tough crowd.'],
  ['dui-checkpoint', 'DUI Checkpoint', 43, { kind: 'hitOpp', amount: 16 }, 'Walk the line.'],
  ['sleep-paralysis', 'Sleep Paralysis', 43, { kind: 'hitOpp', amount: 13 }, 'The demon is in the corner.'],
  ['jury-duty', 'Jury Duty', 40, { kind: 'hitOpp', amount: 7 }, 'Civic duty, minor damage.'],
  ['running-of-the-bulls', 'Running of the Bulls', 45, { kind: 'boostSelf', amount: 22 }, 'Adrenaline pays.'],
  ['wet-dream', 'Wet Dream', 41, { kind: 'boostSelf', amount: 14 }, 'Woke up winning.'],
  ['wedding-objection', 'Wedding Objection', 45, { kind: 'halveOppTop' }, 'Speak now. Halve their best.'],
];

// ───────────────────────────── ??? ─────────────────────────────
const SPECIAL: Row[] = [
  ['redemption', 'Redemption', 0, 'A redemption pack of 2, openable only after all other packs.'],
  ['god', 'God', 0, 'All slots open. Every pack opens at once. The best set is chosen for you.'],
  ['aether', 'Aether', 0, 'Nothing. Absolutely nothing.'],
  ['karma', 'Karma', 0, 'Playing badly? Your luck turns. Playing well? Also turns.'],
  ['devil', 'Deal with the Devil', 0, 'A great card now. One random card taken before your last pack.'],
  ['premonition', 'Premonition', 0, 'Peek inside one unopened pack without opening it.'],
];

const abilities: Record<string, AbilityId> = {
  delorean: 'delorean',
  'deja-vu': 'dejavu',
  'flash-mob': 'flashmob',
  redemption: 'redemption',
  god: 'god',
  aether: 'aether',
  karma: 'karma',
  devil: 'devil',
  premonition: 'premonition',
};

const RAW: Raw[] = [
  ...rows('life', LIFE),
  ...rows('stuff', STUFF, (id) => (abilities[id] ? { ability: abilities[id] } : {})),
  ...PLACES.map(([id, name, rating, mods, blurb]) => ({ id, name, cat: 'places' as const, rating, mods, blurb })),
  ...rows('ideas', IDEAS, (id) => (abilities[id] ? { ability: abilities[id] } : {})),
  ...HAPPENINGS.map(([id, name, rating, effect, blurb]) => ({
    id,
    name,
    cat: 'happenings' as const,
    rating,
    effect,
    blurb,
    ...(abilities[id] ? { ability: abilities[id] } : {}),
  })),
  ...rows('special', SPECIAL, (id) => ({ ability: abilities[id] })),
];

/**
 * Tier score: the card's rating plus what its extras are worth. Tiers are purely about prowess,
 * not category: common ≤56, uncommon ≤69, rare ≤78, epic ≤86, legendary ≤93, mythic 94+.
 */
export function tierScore(c: Raw | CardDef): number {
  if (c.cat === 'special') return 99;
  let score = c.rating;
  if (c.cat === 'happenings') score += effectWorth(c.effect);
  if (c.cat === 'places' && c.mods) score += Object.values(c.mods).reduce((sum, m) => sum + ((m ?? 1) - 1) * 40, 0);
  if (c.ability) score += 8;
  return Math.round(score);
}

export function tierOf(c: Raw | CardDef): Rarity {
  const t = tierScore(c);
  if (t <= 56) return 1;
  if (t <= 69) return 2;
  if (t <= 78) return 3;
  if (t <= 86) return 4;
  if (t <= 93) return 5;
  return 6;
}

export const CARDS: CardDef[] = RAW.map((c) => ({ ...c, rarity: tierOf(c) }));

export const CARD_BY_ID: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

export function cardsOf(cat: Category): CardDef[] {
  return CARDS.filter((c) => c.cat === cat);
}

export const MAIN_CATEGORIES: Category[] = ['life', 'stuff', 'places', 'ideas', 'happenings'];

export const CATEGORY_META: Record<Category, { label: string; short: string; hue: number }> = {
  life: { label: 'Life', short: 'LIFE', hue: 140 },
  stuff: { label: 'Stuff', short: 'STUFF', hue: 28 },
  places: { label: 'Places', short: 'PLACE', hue: 205 },
  ideas: { label: 'Ideas', short: 'IDEA', hue: 270 },
  happenings: { label: 'Happenings', short: 'EVENT', hue: 350 },
  special: { label: '???', short: '???', hue: 50 },
};

export const TIER_META: Record<Rarity, { label: string; color: string; max: number }> = {
  1: { label: 'Common', color: '#3dff8a', max: 56 },
  2: { label: 'Uncommon', color: '#ff9a3d', max: 69 },
  3: { label: 'Rare', color: '#ff3da5', max: 78 },
  4: { label: 'Epic', color: '#a35cff', max: 86 },
  5: { label: 'Legendary', color: '#ff3d3d', max: 93 },
  6: { label: 'Mythic', color: '#2ef2e0', max: 99 },
};

/** Value of a happening's effect for scoring potential, used when estimating deck strength. */
export function effectWorth(e?: HappeningEffect): number {
  if (!e) return 0;
  switch (e.kind) {
    case 'boostSelf':
      return e.amount;
    case 'hitOpp':
      return e.amount;
    case 'fieldShake':
      return e.amount * 0.5;
    case 'halveOppTop':
      return 25;
    case 'doubleLast':
      return 30;
    case 'steal':
      return 20;
  }
}
