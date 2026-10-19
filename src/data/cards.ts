import type { AbilityId, CardDef, Category, Rarity } from '../engine/types';
import { ABILITIES } from './abilities';

type Raw = Omit<CardDef, 'rarity' | 'cat'>;
function c(id: string, name: string, rating: number, blurb: string, ability?: AbilityId): Raw {
  return ability ? { id, name, rating, blurb, ability } : { id, name, rating, blurb };
}

// Ratings are on a 40–99 scale. ??? cards have no rating; their worth is their ability.
const LIFE: Raw[] = [
  c('raccoon', 'Raccoon', 51, 'Trash panda. Union rep for the dumpster.'),
  c('harambe', 'Harambe', 96, 'Gone but never forgotten.'),
  c('julius-caesar', 'Julius Caesar', 88, 'Beware the Ides.'),
  c('black-mould', 'Black Mould', 44, 'Technically alive. Technically.'),
  c('belgium', 'The Entire Population of Belgium', 84, 'All 11.7 million of them.'),
  c('karen', 'Karen', 48, 'Would like to speak to the manager.'),
  c('intern', 'Intern', 43, 'Unpaid. Unstoppable. Unqualified.'),
  c('crooked-cop', 'Crooked Cop', 67, 'Badge number: redacted.'),
  c('the-pope', 'The Pope', 94, 'Direct line upstairs.'),
  c('influencer', 'Influencer', 56, 'Link in bio.'),
  c('therapist', 'Therapist', 69, 'And how does that make you feel?'),
  c('personal-chef', 'Personal Chef', 74, 'Plates everything, including grudges.'),
  c('somali-pirate', 'Somali Pirate', 72, 'Look at me. I am the captain now.'),
  c('samurai', 'Samurai', 85, 'Honour-bound and razor-sharp.'),
  c('wyatt-earp', 'Wyatt Earp', 81, 'Fastest hands in the pack.'),
  c('virgin', 'Virgin', 46, 'Untouched by scandal.'),
  c('boomer', 'Boomer', 50, 'Bought a house for $11 in 1974.'),
  c('scooter-granny', 'Scooter Granny', 60, 'Top speed: menace.'),
  c('great-white-shark', 'Great White Shark', 89, 'Apex. Period.'),
  c('cool-uncle', 'Cool Uncle', 66, 'Has a boat. Sort of.'),
  c('swarm-of-bees', 'Swarm of Bees', 63, 'Not the bees.'),
  c('birch-tree', 'Birch Tree', 45, 'Quietly photosynthesizing.'),
  c('zombie', 'Zombie', 62, 'Hungry for brains and benefits.'),
  c('wifes-ex-dale', "Wife's Ex Dale", 53, 'Still has a key, apparently.'),
  c('rottweiler', 'Rottweiler', 70, 'Good boy. Dangerous boy.'),
  c('bald-eagle', 'Bald Eagle', 87, 'Freedom, with talons.'),
  c('waterbear', 'Waterbear', 61, 'Survives everything. Even this game.'),
  c('snail', 'Snail', 41, 'Will get there eventually.'),
  c('baby-momma', 'Baby Momma', 55, 'Has receipts.'),
  c('frat-guy', 'Frat Guy', 52, 'Bro. BRO.'),
  c('florida-man', 'Florida Man', 76, 'Headline pending.'),
  c('emotional-support-peacock', 'Emotional Support Peacock', 65, 'Denied boarding, twice.'),
  c('nepo-baby', 'Nepo Baby', 67, 'Self-made, via parents.'),
  c('medieval-peasant', 'Medieval Peasant', 47, 'Owns one turnip.'),
  c('divorced-dad', 'Divorced Dad', 54, 'Grill is the only thing he kept.'),
  c('coconut-crab', 'Coconut Crab', 77, 'Opens coconuts. Opens anything.'),
  c('french-bulldog', 'French Bulldog', 59, 'Breathing is optional.'),
  c('navy-seal', 'Navy SEAL', 92, 'Over 300 confirmed packs.'),
  c('hippopotamus', 'Hippopotamus', 83, 'Deadliest animal in Africa. Also round.'),
  c('bouncer', 'Bouncer', 64, 'Not tonight, chief.', 'bouncer'),
  c('cocaine-bear', 'Cocaine Bear', 98, 'Based on a true story.'),
  c('mall-santa', 'Mall Santa', 52, 'Smells like regret and peppermint.'),
  c('hoa-president', 'HOA President', 49, 'Your mailbox is 2 inches too tall.'),
  c('jehovahs-witness', "Jehovah's Witness", 48, 'Do you have a moment?'),
  c('capybara', 'Capybara', 74, 'Friend to all. Fears nothing.'),
  c('substitute-teacher', 'Substitute Teacher', 45, 'Put on a movie.'),
  c('australian-magpie', 'Australian Magpie', 58, 'Swooping season is eternal.'),
  c('amish-farmer', 'Amish Farmer', 61, 'Raised a barn before breakfast.'),
  c('sugar-daddy', 'Sugar Daddy', 78, 'Generous, with conditions.'),
  c('mall-cop', 'Mall Cop', 50, 'The Segway is government issue.'),
  c('ipad-kid', 'iPad Kid', 43, 'Screen time: yes.'),
  c('soviet-cosmonaut', 'Soviet Cosmonaut', 80, 'First in space, last to be paid.'),
  c('finance-bro', 'Finance Bro', 69, 'Crushing it, allegedly.'),
];

const STUFF: Raw[] = [
  c('forklift', 'Forklift', 63, 'Certified? No. Confident? Yes.'),
  c('uranium', 'Uranium', 95, 'Glows with potential.'),
  c('the-moon', 'The Moon', 99, 'Shoot for it.'),
  c('thong', 'Thong', 44, 'Minimal coverage, maximum confidence.'),
  c('rotisserie-chicken', 'Rotisserie Chicken', 52, '$4.99 of pure value.'),
  c('loofa', 'Loofa', 41, 'Exfoliating since forever.'),
  c('fentanyl', 'Fentanyl', 74, 'Handle with extreme care.'),
  c('minivan', 'Minivan', 56, 'Sliding doors of destiny.'),
  c('flamethrower', 'Flamethrower', 84, 'Not a flamethrower, legally.', 'flamethrower'),
  c('ss-edmund-fitzgerald', 'SS Edmund Fitzgerald', 81, 'The legend lives on.'),
  c('air-fryer', 'Air Fryer', 55, 'Changed your life, you say.'),
  c('bitcoin', 'Bitcoin', 87, 'Number go up. Or down.', 'bitcoin'),
  c('hot-tub', 'Hot Tub', 67, 'Jets of questionable hygiene.'),
  c('fishing-trawler', 'Fishing Trawler', 70, 'Smells like money and herring.'),
  c('galoshes', 'Galoshes', 43, 'Puddle-proof.'),
  c('jetski', 'Jetski', 72, 'Divorce accessory.'),
  c('ninja-loan', 'NINJA Loan', 61, 'No Income, No Job, No Assets.'),
  c('apache-helicopter', 'Apache Helicopter', 96, 'Identifies as a threat.'),
  c('six-pack', '6-Pack', 51, 'Of beer. Obviously.'),
  c('bluefin-tuna', 'Bluefin Tuna', 80, 'Sold for $3M at auction once.'),
  c('loosey', 'Loosey', 42, 'Single cigarette, single regret.'),
  c('smelling-salts', 'Smelling Salts', 50, 'Wake up, we are playing cards.'),
  c('fifty-bucks', '50 Bucks', 46, 'Found in a jacket.'),
  c('timeshare', 'Timeshare', 48, 'Just a 90 minute presentation.'),
  c('used-mattress', 'Used Mattress', 43, 'Free. Mysterious stains included.'),
  c('crockpot', 'Crockpot', 53, 'Set it and forget it.'),
  c('vape', 'Vape', 45, 'Mango ice, 5%.'),
  c('traffic-cone', 'Traffic Cone', 45, 'Stolen. Obviously.'),
  c('roomba', 'Roomba', 58, 'Has seen things.'),
  c('crocs', 'Crocs', 54, 'Sport mode engaged.'),
  c('leaf-blower', 'Leaf Blower', 56, '7am. Every Sunday.'),
  c('inflatable-tube-man', 'Inflatable Tube Man', 59, 'Pure, flailing joy.'),
  c('epipen', 'EpiPen', 65, 'Priced like a kidney.'),
  c('spork', 'Spork', 41, 'Master of none.'),
  c('jerrycan', 'Jerrycan', 54, 'Full of something flammable.'),
  c('delorean', 'DeLorean', 85, 'Roads? Where we are going we do not need roads.', 'delorean'),
  c('shopping-cart', 'Shopping Cart', 47, 'The ultimate litmus test.'),
  c('port-a-potty', 'Port-a-Potty', 49, 'Music festival throne.'),
  c('bagpipes', 'Bagpipes', 57, 'Sonic warfare.'),
  c('chastity-belt', 'Chastity Belt', 50, 'Medieval DRM.'),
  c('trampoline', 'Trampoline', 60, 'ER visit generator.'),
  c('segway', 'Segway', 59, 'Lean forward to live.'),
  c('fax-machine', 'Fax Machine', 48, 'Still used by one law firm.'),
  c('defibrillator', 'Defibrillator', 69, 'CLEAR.', 'defib'),
  c('sippy-cup', 'Sippy Cup', 43, 'Spill-proof. Dignity-proof.'),
  c('cattle-prod', 'Cattle Prod', 62, 'Motivational tool.'),
  c('lava-lamp', 'Lava Lamp', 52, 'Groovy, man.'),
  c('golden-toilet', 'Golden Toilet', 91, '18 karat throne.'),
  c('vodka-soda', 'Vodka Soda', 45, 'Zero sugar. Zero judgement.'),
  c('convertible', 'Convertible', 62, 'Top down, standards too.'),
];

const PLACES: Raw[] = [
  c('hell', 'Hell', 56, 'Happenings hit harder. Life suffers.'),
  c('ohio', 'Ohio', 45, 'Only in Ohio.'),
  c('dmv', 'DMV', 43, 'Take a number. Think deeply.'),
  c('point-nemo', 'Point Nemo', 52, 'Furthest from anyone. Ideas thrive.'),
  c('vatican-city', 'Vatican City', 61, 'Holy ground.'),
  c('area-51', 'Area 51', 63, 'Nothing to see here. Literally.', 'area51'),
  c('little-st-james', 'Little St. James', 50, 'Nobody talks about who was here.'),
  c('chernobyl', 'Chernobyl', 59, 'Glow-up for stuff.'),
  c('the-friend-zone', 'The Friend Zone', 41, 'Lots of thinking happens here.'),
  c('airplane-bathroom', 'Airplane Bathroom', 48, 'Things happen at 36,000 feet.'),
  c('back-of-the-line', 'Back of the Line', 40, 'Plenty of time to think.'),
  c('prison-shower', 'Prison Shower', 44, 'Life gets tougher here.'),
  c('cayman-islands', 'Cayman Islands', 66, 'Untaxed. Unbothered. Untouchable.', 'cayman'),
  c('waffle-house', 'Waffle House', 51, 'Smothered, covered, chaos.'),
  c('bermuda-triangle', 'Bermuda Triangle', 58, 'Boats go in. Boats do not come out.', 'bermuda'),
  c('north-korea', 'North Korea', 55, 'Hardware over ideas.'),
  c('chuck-e-cheese', 'Chuck E. Cheese', 47, 'Where a kid can be a kid.'),
  c('the-gulag', 'The Gulag', 50, 'Strong bodies, no thoughts.'),
  c('the-shadow-realm', 'The Shadow Realm', 62, 'Ideas get dark and powerful.'),
  c('mall-food-court', 'Mall Food Court', 45, 'Sbarro energy.'),
  c('purgatory', 'Purgatory', 54, 'Perfectly neutral. Forever.'),
  c('the-oval-office', 'The Oval Office', 67, 'Executive decisions.'),
  c('las-vegas', 'Las Vegas', 65, 'What happens here, happens.'),
  c('mount-everest', 'Mount Everest', 63, 'Only the strong survive.'),
  c('the-g-spot', 'The G-Spot', 56, 'Hard to find. Big payoff.'),
  c('antarctica', 'Antarctica', 52, 'Gear matters here.'),
  c('the-panama-canal', 'The Panama Canal', 59, 'Shipping bonus.'),
  c('marianas-trench', 'Marianas Trench', 58, 'Deep thoughts only.'),
  c('the-uncanny-valley', 'The Uncanny Valley', 55, 'Almost human.'),
  c('sahara-desert', 'Sahara Desert', 51, 'Harsh. Dramatic.'),
  c('the-pentagon', 'The Pentagon', 66, 'Defense budget: unlimited.', 'pentagon'),
  c('the-doghouse', 'The Doghouse', 44, 'You know what you did.'),
  c('north-sentinel-island', 'North Sentinel Island', 61, 'Do not visit.'),
  c('end-of-a-rainbow', 'End of a Rainbow', 69, 'Pot of gold rules.'),
  c('crawl-space', 'Crawl Space', 43, 'Something lives down here.'),
];

const IDEAS: Raw[] = [
  c('deja-vu', 'Déjà Vu', 63, 'Have we done this before?', 'dejavu'),
  c('algebra', 'Algebra', 50, 'Solve for why.'),
  c('manscaping', 'Manscaping', 45, 'Precision grooming.'),
  c('delusions-of-grandeur', 'Delusions of Grandeur', 67, 'Main character energy.'),
  c('theory-of-relativity', 'Theory of Relativity', 91, 'E = mc² of ideas.'),
  c('bluetooth', 'Bluetooth', 56, 'Connecting... connecting...'),
  c('trickle-down-economics', 'Trickle-down Economics', 53, 'Any day now.'),
  c('daddy-issues', 'Daddy Issues', 55, 'Explains a lot.'),
  c('stockholm-syndrome', 'Stockholm Syndrome', 63, 'Growing fond of this game.'),
  c('tax-evasion', 'Tax Evasion', 74, 'Allegedly.'),
  c('post-nut-clarity', 'Post-nut Clarity', 60, 'Sudden, devastating wisdom.', 'postnut'),
  c('free-will', 'Free Will', 77, 'The result was decided already, though.'),
  c('communism', 'Communism', 80, 'Our card.'),
  c('the-american-dream', 'The American Dream', 84, 'Terms and conditions apply.'),
  c('natural-selection', 'Natural Selection', 87, 'Only the fittest packs.'),
  c('monogamy', 'Monogamy', 58, 'One pack at a time.'),
  c('improv', 'Improv', 48, 'Yes, and...'),
  c('ponzi-scheme', 'Ponzi Scheme', 76, 'Early investors only.', 'ponzi'),
  c('dunning-kruger-effect', 'Dunning-Kruger Effect', 62, 'Confidently wrong.'),
  c('weaponized-incompetence', 'Weaponized Incompetence', 51, 'How do I pack again?'),
  c('manifest-destiny', 'Manifest Destiny', 78, 'Westward, always.'),
  c('situationship', 'Situationship', 47, 'What are we?'),
  c('girl-math', 'Girl Math', 52, 'Technically free.'),
  c('the-butterfly-effect', 'The Butterfly Effect', 83, 'One flap. Total chaos.'),
  c('plausible-deniability', 'Plausible Deniability', 65, 'I was never here.'),
  c('five-second-rule', 'Five-second Rule', 44, 'Still good.'),
  c('murphys-law', "Murphy's Law", 61, 'Anything that can go wrong...'),
  c('gaslighting', 'Gaslighting', 66, 'That never happened.'),
  c('the-trolley-problem', 'The Trolley Problem', 70, 'Pull the lever. Or do not.', 'trolley'),
  c('sunk-cost-fallacy', 'Sunk Cost Fallacy', 54, 'Too deep to quit now.'),
  c('pretty-privilege', 'Pretty Privilege', 59, 'Rules are different.', 'pretty'),
  c('schrodingers-cat', "Schrödinger's Cat", 85, 'Both winning and losing. Until you look.', 'cat'),
  c('corporate-synergy', 'Corporate Synergy', 46, 'Let us circle back.'),
  c('the-bro-code', 'The Bro Code', 50, 'Article 1: bros.'),
];

const HAPPENINGS: Raw[] = [
  c('wwii', 'WWII', 50, 'Everyone loses something.'),
  c('sneeze-during-eulogy', 'Sneeze During Eulogy', 41, 'Awkward. Costly.'),
  c('the-big-bang', 'The Big Bang', 56, 'Everything, all at once.'),
  c('woodstock-99', "Woodstock '99", 45, 'Fires. Mud. Limp Bizkit.'),
  c('missed-flight', 'Missed Flight', 40, 'Gate closed two minutes ago.'),
  c('pilates', 'Pilates', 43, 'Core strength, core profits.'),
  c('bad-trip', 'Bad Trip', 44, 'Their best card is melting.'),
  c('colonoscopy', 'Colonoscopy', 41, 'A thorough inspection.'),
  c('military-coup', 'Military Coup', 52, 'Regime change, one card at a time.', 'coup'),
  c('gender-reveal', 'Gender Reveal', 44, 'Started a wildfire. Worth it.'),
  c('divine-intervention', 'Divine Intervention', 53, 'A sign from above.', 'divine'),
  c('walk-of-shame', 'Walk of Shame', 43, 'Head high, heels in hand.'),
  c('intervention', 'Intervention', 41, 'We are all here because we care.'),
  c('earthquake', 'Earthquake', 48, 'Everything shakes. Everyone pays.'),
  c('flash-mob', 'Flash Mob', 44, 'Started quiet. Did not stay quiet.'),
  c('the-rapture', 'The Rapture', 55, 'Their best card ascends.', 'rapture'),
  c('food-poisoning', 'Food Poisoning', 40, 'The gas station sushi.'),
  c('high-school-reunion', 'High School Reunion', 44, 'Peaked. Right now.'),
  c('salem-witch-trials', 'Salem Witch Trials', 47, 'She floats.'),
  c('surprise-drug-test', 'Surprise Drug Test', 43, 'Cup. Now.'),
  c('the-french-revolution', 'The French Revolution', 51, 'Redistribute their lowest card.'),
  c('accidental-reply-all', 'Accidental Reply All', 40, 'Everyone saw it.'),
  c('fender-bender', 'Fender Bender', 40, 'Exchange insurance. Exchange blows.'),
  c('erectile-dysfunction', 'Erectile Dysfunction', 41, 'Happens to everyone.'),
  c('thanksgiving-dinner', 'Thanksgiving Dinner', 44, 'Politics optional.'),
  c('tornado', 'Tornado', 50, 'Takes the roof. Takes the score.'),
  c('moon-landing', 'Moon Landing', 54, 'One small step. Huge value.'),
  c('tsunami', 'Tsunami', 51, 'Washes their field.'),
  c('catfished', 'Catfished', 43, 'They were not who they said.'),
  c('open-mic-night', 'Open Mic Night', 40, 'Tough crowd.'),
  c('dui-checkpoint', 'DUI Checkpoint', 43, 'Walk the line.', 'dui'),
  c('sleep-paralysis', 'Sleep Paralysis', 43, 'The demon is in the corner.'),
  c('jury-duty', 'Jury Duty', 40, 'Civic duty, minor damage.'),
  c('running-of-the-bulls', 'Running of the Bulls', 45, 'Adrenaline pays.'),
  c('wet-dream', 'Wet Dream', 41, 'Woke up winning.'),
  c('wedding-objection', 'Wedding Objection', 45, 'Speak now.', 'wedding'),
];

const SPECIAL: Raw[] = [
  c('redemption', 'Redemption', 0, 'A redemption pack of 2, openable only after all other packs.', 'redemption'),
  c('god', 'God', 0, 'All slots open. Every pack opens at once. The best set is chosen for you.', 'god'),
  c('aether', 'Aether', 0, 'Nothing. Absolutely nothing.', 'aether'),
  c('karma', 'Karma', 0, 'Playing badly? Your luck turns. Playing well? Also turns.', 'karma'),
  c('devil', 'Deal with the Devil', 0, 'A great card now. One random card taken before your last pack.', 'devil'),
  c('premonition', 'Premonition', 0, 'Peek inside one unopened pack without opening it.', 'premonition'),
];

const withCat = (cat: Category, list: Raw[]) => list.map((r) => ({ ...r, cat }));
const RAW = [...withCat('life', LIFE), ...withCat('stuff', STUFF), ...withCat('places', PLACES), ...withCat('ideas', IDEAS), ...withCat('happenings', HAPPENINGS), ...withCat('special', SPECIAL)];

/**
 * Tier score: rating plus what the ability is worth. Tiers are purely about prowess, never
 * category: common ≤56, uncommon ≤69, rare ≤78, epic ≤86, legendary ≤93, mythic 94+.
 */
export function tierScore(card: { rating: number; ability?: AbilityId; cat: Category }): number {
  const worth = card.ability ? ABILITIES[card.ability].worth : 0;
  if (card.cat === 'special') return worth;
  return card.rating + worth;
}

export function tierOf(card: { rating: number; ability?: AbilityId; cat: Category }): Rarity {
  const t = tierScore(card);
  if (t <= 56) return 1;
  if (t <= 69) return 2;
  if (t <= 78) return 3;
  if (t <= 86) return 4;
  if (t <= 93) return 5;
  return 6;
}

export const CARDS: CardDef[] = RAW.map((r) => ({ ...r, rarity: tierOf(r) }));
export const CARD_BY_ID: Record<string, CardDef> = Object.fromEntries(CARDS.map((x) => [x.id, x]));

export function cardsOf(cat: Category): CardDef[] {
  return CARDS.filter((x) => x.cat === cat);
}

export const MAIN_CATEGORIES: Category[] = ['life', 'stuff', 'places', 'ideas', 'happenings'];

export const CATEGORY_META: Record<Category, { label: string; short: string; hue: number }> = {
  life: { label: 'Life', short: 'LIFE', hue: 140 },
  stuff: { label: 'Stuff', short: 'STUFF', hue: 28 },
  places: { label: 'Places', short: 'PLACE', hue: 205 },
  ideas: { label: 'Ideas', short: 'IDEA', hue: 270 },
  happenings: { label: 'Events', short: 'EVENT', hue: 350 },
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

/** Card groups referenced by abilities and minigames. */
export const GROUPS = {
  animals: ['cocaine-bear', 'harambe', 'great-white-shark', 'bald-eagle', 'hippopotamus', 'coconut-crab', 'capybara', 'rottweiler', 'swarm-of-bees', 'french-bulldog', 'australian-magpie', 'raccoon'],
  money: ['fifty-bucks', 'ninja-loan', 'bitcoin'],
  boats: ['somali-pirate', 'jetski', 'fishing-trawler'],
  vehicles: ['convertible', 'scooter-granny', 'minivan', 'jetski', 'segway'],
  impairments: ['six-pack', 'bad-trip', 'fentanyl', 'vodka-soda'],
  prettyTargets: ['fifty-bucks', 'vodka-soda', 'vape'],
  disasters: ['tornado', 'tsunami', 'earthquake'],
  crimes: ['ponzi-scheme', 'tax-evasion', 'catfished', 'fentanyl'],
} as const;
