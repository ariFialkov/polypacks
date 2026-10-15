import type { CardDef, Category, HappeningEffect, PlaceMods, AbilityId, Rarity } from '../engine/types';

type Row = [id: string, name: string, rating: number, rarity: Rarity, blurb?: string];

function rows(cat: Category, list: Row[], extra?: (id: string) => Partial<CardDef>): CardDef[] {
  return list.map(([id, name, rating, rarity, blurb]) => ({
    id,
    name,
    cat,
    rating,
    rarity,
    blurb,
    ...(extra ? extra(id) : {}),
  }));
}

// ───────────────────────────── LIFE ─────────────────────────────
const LIFE: Row[] = [
  ['raccoon', 'Raccoon', 22, 1, 'Trash panda. Union rep for the dumpster.'],
  ['harambe', 'Harambe', 88, 4, 'Gone but never forgotten.'],
  ['julius-caesar', 'Julius Caesar', 76, 3, 'Beware the Ides.'],
  ['black-mould', 'Black Mould', 12, 1, 'Technically alive. Technically.'],
  ['belgium', 'The Entire Population of Belgium', 70, 3, 'All 11.7 million of them.'],
  ['karen', 'Karen', 18, 1, 'Would like to speak to the manager.'],
  ['intern', 'Intern', 10, 1, 'Unpaid. Unstoppable. Unqualified.'],
  ['crooked-cop', 'Crooked Cop', 45, 2, 'Badge number: redacted.'],
  ['the-pope', 'The Pope', 85, 4, 'Direct line upstairs.'],
  ['influencer', 'Influencer', 30, 2, 'Link in bio.'],
  ['therapist', 'Therapist', 48, 2, 'And how does that make you feel?'],
  ['personal-chef', 'Personal Chef', 55, 2, 'Plates everything, including grudges.'],
  ['somali-pirate', 'Somali Pirate', 52, 2, 'Look at me. I am the captain now.'],
  ['samurai', 'Samurai', 72, 3, 'Honour-bound and razor-sharp.'],
  ['wyatt-earp', 'Wyatt Earp', 66, 3, 'Fastest hands in the pack.'],
  ['virgin', 'Virgin', 15, 1, 'Untouched by scandal.'],
  ['boomer', 'Boomer', 20, 1, 'Bought a house for $11 in 1974.'],
  ['scooter-granny', 'Scooter Granny', 35, 2, 'Top speed: menace.'],
  ['great-white-shark', 'Great White Shark', 78, 3, 'Apex. Period.'],
  ['cool-uncle', 'Cool Uncle', 44, 2, 'Has a boat. Sort of.'],
  ['swarm-of-bees', 'Swarm of Bees', 40, 2, 'Not the bees.'],
  ['birch-tree', 'Birch Tree', 14, 1, 'Quietly photosynthesizing.'],
  ['zombie', 'Zombie', 38, 2, 'Hungry for brains and benefits.'],
  ['wifes-ex-dale', "Wife's Ex Dale", 25, 1, 'Still has a key, apparently.'],
  ['rottweiler', 'Rottweiler', 50, 2, 'Good boy. Dangerous boy.'],
  ['bald-eagle', 'Bald Eagle', 74, 3, 'Freedom, with talons.'],
  ['waterbear', 'Waterbear', 36, 2, 'Survives everything. Even this game.'],
  ['snail', 'Snail', 8, 1, 'Will get there eventually.'],
  ['baby-momma', 'Baby Momma', 28, 1, 'Has receipts.'],
  ['frat-guy', 'Frat Guy', 24, 1, 'Bro. BRO.'],
  ['florida-man', 'Florida Man', 58, 3, 'Headline pending.'],
  ['emotional-support-peacock', 'Emotional Support Peacock', 42, 2, 'Denied boarding, twice.'],
  ['nepo-baby', 'Nepo Baby', 46, 2, 'Self-made, via parents.'],
  ['medieval-peasant', 'Medieval Peasant', 16, 1, 'Owns one turnip.'],
  ['divorced-dad', 'Divorced Dad', 26, 1, 'Grill is the only thing he kept.'],
  ['coconut-crab', 'Coconut Crab', 60, 3, 'Opens coconuts. Opens anything.'],
  ['french-bulldog', 'French Bulldog', 34, 2, 'Breathing is optional.'],
  ['navy-seal', 'Navy SEAL', 82, 4, 'Over 300 confirmed packs.'],
  ['hippopotamus', 'Hippopotamus', 68, 3, 'Deadliest animal in Africa. Also round.'],
  ['bouncer', 'Bouncer', 41, 2, 'Not tonight, chief.'],
  ['cocaine-bear', 'Cocaine Bear', 90, 4, 'Based on a true story.'],
  ['mall-santa', 'Mall Santa', 23, 1, 'Smells like regret and peppermint.'],
  ['hoa-president', 'HOA President', 19, 1, 'Your mailbox is 2 inches too tall.'],
  ['jehovahs-witness', "Jehovah's Witness", 17, 1, 'Do you have a moment?'],
  ['capybara', 'Capybara', 56, 2, 'Friend to all. Fears nothing.'],
  ['substitute-teacher', 'Substitute Teacher', 13, 1, 'Put on a movie.'],
  ['australian-magpie', 'Australian Magpie', 32, 2, 'Swooping season is eternal.'],
  ['amish-farmer', 'Amish Farmer', 37, 2, 'Raised a barn before breakfast.'],
  ['sugar-daddy', 'Sugar Daddy', 62, 3, 'Generous, with conditions.'],
  ['mall-cop', 'Mall Cop', 21, 1, 'The Segway is government issue.'],
  ['ipad-kid', 'iPad Kid', 11, 1, 'Screen time: yes.'],
  ['soviet-cosmonaut', 'Soviet Cosmonaut', 64, 3, 'First in space, last to be paid.'],
  ['chad-bradley', 'Chad Bradley', 48, 2, 'Crushing it, allegedly.'],
];

// ───────────────────────────── STUFF ─────────────────────────────
const STUFF: Row[] = [
  ['forklift', 'Forklift', 40, 2, 'Certified? No. Confident? Yes.'],
  ['uranium', 'Uranium', 86, 4, 'Glows with potential.'],
  ['the-moon', 'The Moon', 92, 4, 'Shoot for it.'],
  ['thong', 'Thong', 12, 1, 'Minimal coverage, maximum confidence.'],
  ['rotisserie-chicken', 'Rotisserie Chicken', 24, 1, '$4.99 of pure value.'],
  ['loofa', 'Loofa', 8, 1, 'Exfoliating since forever.'],
  ['fentanyl', 'Fentanyl', 55, 2, 'Handle with extreme care.'],
  ['minivan', 'Minivan', 30, 2, 'Sliding doors of destiny.'],
  ['flamethrower', 'Flamethrower', 70, 3, 'Not a flamethrower, legally.'],
  ['ss-edmund-fitzgerald', 'SS Edmund Fitzgerald', 66, 3, 'The legend lives on.'],
  ['air-fryer', 'Air Fryer', 28, 1, 'Changed your life, you say.'],
  ['bitcoin', 'Bitcoin', 75, 3, 'Number go up. Or down.'],
  ['hot-tub', 'Hot Tub', 45, 2, 'Jets of questionable hygiene.'],
  ['fishing-trawler', 'Fishing Trawler', 50, 2, 'Smells like money and herring.'],
  ['galoshes', 'Galoshes', 10, 1, 'Puddle-proof.'],
  ['jetski', 'Jetski', 52, 2, 'Divorce accessory.'],
  ['ninja-loan', 'NINJA Loan', 36, 2, 'No Income, No Job, No Assets.'],
  ['apache-helicopter', 'Apache Helicopter', 88, 4, 'Identifies as a threat.'],
  ['six-pack', '6-Pack', 22, 1, 'Of beer. Obviously.'],
  ['bluefin-tuna', 'Bluefin Tuna', 64, 3, 'Sold for $3M at auction once.'],
  ['loosey', 'Loosey', 9, 1, 'Single cigarette, single regret.'],
  ['smelling-salts', 'Smelling Salts', 20, 1, 'Wake up, we are playing cards.'],
  ['fifty-bucks', '50 Bucks', 15, 1, 'Found in a jacket.'],
  ['timeshare', 'Timeshare', 18, 1, 'Just a 90 minute presentation.'],
  ['used-mattress', 'Used Mattress', 11, 1, 'Free. Mysterious stains included.'],
  ['crockpot', 'Crockpot', 25, 1, 'Set it and forget it.'],
  ['vape', 'Vape', 14, 1, 'Mango ice, 5%.'],
  ['traffic-cone', 'Traffic Cone', 13, 1, 'Stolen. Obviously.'],
  ['roomba', 'Roomba', 32, 2, 'Has seen things.'],
  ['crocs', 'Crocs', 26, 1, 'Sport mode engaged.'],
  ['leaf-blower', 'Leaf Blower', 29, 1, '7am. Every Sunday.'],
  ['inflatable-tube-man', 'Inflatable Tube Man', 33, 2, 'Pure, flailing joy.'],
  ['epipen', 'EpiPen', 42, 2, 'Priced like a kidney.'],
  ['spork', 'Spork', 7, 1, 'Master of none.'],
  ['jerrycan', 'Jerrycan', 27, 1, 'Full of something flammable.'],
  ['delorean', 'DeLorean', 72, 3, 'Roads? Where we are going... Repick one opened pack.'],
  ['shopping-cart', 'Shopping Cart', 16, 1, 'The ultimate litmus test.'],
  ['port-a-potty', 'Port-a-Potty', 19, 1, 'Music festival throne.'],
  ['bagpipes', 'Bagpipes', 31, 2, 'Sonic warfare.'],
  ['chastity-belt', 'Chastity Belt', 21, 1, 'Medieval DRM.'],
  ['trampoline', 'Trampoline', 35, 2, 'ER visit generator.'],
  ['segway', 'Segway', 34, 2, 'Lean forward to live.'],
  ['fax-machine', 'Fax Machine', 17, 1, 'Still used by one law firm.'],
  ['defibrillator', 'Defibrillator', 48, 2, 'CLEAR.'],
  ['sippy-cup', 'Sippy Cup', 10, 1, 'Spill-proof. Dignity-proof.'],
  ['cattle-prod', 'Cattle Prod', 38, 2, 'Motivational tool.'],
  ['lava-lamp', 'Lava Lamp', 23, 1, 'Groovy, man.'],
  ['golden-toilet', 'Golden Toilet', 80, 4, '18 karat throne.'],
];

// ───────────────────────────── PLACES ─────────────────────────────
// Places have a modest base value and modify your own cards for the round.
type PlaceRow = [id: string, name: string, rating: number, rarity: Rarity, mods: PlaceMods, blurb: string];
const PLACES: PlaceRow[] = [
  ['hell', 'Hell', 30, 2, { life: 0.85, happenings: 1.6 }, 'Happenings hit harder. Life suffers.'],
  ['ohio', 'Ohio', 14, 1, { stuff: 1.1 }, 'Only in Ohio.'],
  ['dmv', 'DMV', 10, 1, { life: 0.9, stuff: 0.9, ideas: 1.3 }, 'Take a number. Think deeply.'],
  ['point-nemo', 'Point Nemo', 24, 2, { ideas: 1.3, life: 0.9 }, 'Furthest from anyone. Ideas thrive.'],
  ['vatican-city', 'Vatican City', 36, 2, { life: 1.15, ideas: 1.1 }, 'Holy ground.'],
  ['area-51', 'Area 51', 40, 3, { stuff: 1.25, happenings: 1.2 }, 'Classified tech bonus.'],
  ['little-st-james', 'Little St. James', 20, 2, { life: 0.7, stuff: 1.3 }, 'Nobody talks about who was here.'],
  ['chernobyl', 'Chernobyl', 34, 2, { stuff: 1.3, life: 0.8 }, 'Glow-up for stuff.'],
  ['the-friend-zone', 'The Friend Zone', 8, 1, { life: 0.95, ideas: 1.15 }, 'Lots of thinking happens here.'],
  ['airplane-bathroom', 'Airplane Bathroom', 18, 1, { happenings: 1.3 }, 'Things happen at 36,000 feet.'],
  ['back-of-the-line', 'Back of the Line', 6, 1, { ideas: 1.1 }, 'Plenty of time to think.'],
  ['prison-shower', 'Prison Shower', 12, 1, { life: 1.2, stuff: 0.8 }, 'Life gets tougher here.'],
  ['cayman-islands', 'Cayman Islands', 44, 3, { stuff: 1.3 }, 'Untaxed. Unbothered.'],
  ['waffle-house', 'Waffle House', 22, 1, { life: 1.15, happenings: 1.2 }, 'Smothered, covered, chaos.'],
  ['bermuda-triangle', 'Bermuda Triangle', 32, 2, { happenings: 1.5, stuff: 0.9 }, 'Things go missing. Things happen.'],
  ['north-korea', 'North Korea', 28, 2, { life: 0.8, ideas: 0.8, stuff: 1.2 }, 'Hardware over ideas.'],
  ['chuck-e-cheese', 'Chuck E. Cheese', 16, 1, { life: 1.1, happenings: 1.1 }, 'Where a kid can be a kid.'],
  ['the-gulag', 'The Gulag', 20, 2, { life: 1.25, ideas: 0.7 }, 'Strong bodies, no thoughts.'],
  ['the-shadow-realm', 'The Shadow Realm', 38, 3, { ideas: 1.4, life: 0.85 }, 'Ideas get dark and powerful.'],
  ['mall-food-court', 'Mall Food Court', 14, 1, { life: 1.1, stuff: 1.05 }, 'Sbarro energy.'],
  ['purgatory', 'Purgatory', 26, 2, { life: 1, stuff: 1, ideas: 1, happenings: 1 }, 'Perfectly neutral. Forever.'],
  ['the-oval-office', 'The Oval Office', 46, 3, { life: 1.2, ideas: 1.2, stuff: 0.9 }, 'Executive decisions.'],
  ['las-vegas', 'Las Vegas', 42, 3, { stuff: 1.2, happenings: 1.3, ideas: 0.8 }, 'What happens here, happens.'],
  ['mount-everest', 'Mount Everest', 40, 3, { life: 1.3, stuff: 0.85 }, 'Only the strong survive.'],
  ['the-g-spot', 'The G-Spot', 30, 2, { happenings: 1.4, ideas: 1.1 }, 'Hard to find. Big payoff.'],
  ['antarctica', 'Antarctica', 24, 2, { life: 0.75, stuff: 1.25 }, 'Gear matters here.'],
  ['the-panama-canal', 'The Panama Canal', 34, 2, { stuff: 1.25 }, 'Shipping bonus.'],
  ['marianas-trench', 'Marianas Trench', 32, 2, { life: 0.8, ideas: 1.3 }, 'Deep thoughts only.'],
  ['the-uncanny-valley', 'The Uncanny Valley', 28, 2, { life: 0.9, stuff: 1.15, ideas: 1.15 }, 'Almost human.'],
  ['sahara-desert', 'Sahara Desert', 22, 2, { life: 0.85, happenings: 1.3 }, 'Harsh. Dramatic.'],
  ['the-pentagon', 'The Pentagon', 44, 3, { stuff: 1.3, ideas: 1.05 }, 'Defense budget: unlimited.'],
  ['the-doghouse', 'The Doghouse', 12, 1, { life: 1.1, happenings: 1.15 }, 'You know what you did.'],
  ['north-sentinel-island', 'North Sentinel Island', 36, 3, { life: 1.3, stuff: 0.8, ideas: 0.9 }, 'Do not visit.'],
  ['end-of-a-rainbow', 'End of a Rainbow', 48, 3, { stuff: 1.35 }, 'Pot of gold rules.'],
  ['crawl-space', 'Crawl Space', 10, 1, { happenings: 1.25, life: 0.9 }, 'Something lives down here.'],
];

// ───────────────────────────── IDEAS ─────────────────────────────
const IDEAS: Row[] = [
  ['deja-vu', 'Déjà Vu', 40, 2, 'Reroll one unopened pack. Have we done this before?'],
  ['algebra', 'Algebra', 20, 1, 'Solve for why.'],
  ['manscaping', 'Manscaping', 14, 1, 'Precision grooming.'],
  ['delusions-of-grandeur', 'Delusions of Grandeur', 45, 2, 'Main character energy.'],
  ['theory-of-relativity', 'Theory of Relativity', 80, 4, 'E = mc² of ideas.'],
  ['bluetooth', 'Bluetooth', 30, 2, 'Connecting... connecting...'],
  ['trickle-down-economics', 'Trickle-down Economics', 25, 1, 'Any day now.'],
  ['daddy-issues', 'Daddy Issues', 28, 1, 'Explains a lot.'],
  ['stockholm-syndrome', 'Stockholm Syndrome', 40, 2, 'Growing fond of this game.'],
  ['tax-evasion', 'Tax Evasion', 55, 2, 'Allegedly.'],
  ['post-nut-clarity', 'Post-nut Clarity', 35, 2, 'Sudden, devastating wisdom.'],
  ['free-will', 'Free Will', 60, 3, 'The result was decided already, though.'],
  ['communism', 'Communism', 65, 3, 'Our card.'],
  ['the-american-dream', 'The American Dream', 70, 3, 'Terms and conditions apply.'],
  ['natural-selection', 'Natural Selection', 75, 3, 'Only the fittest packs.'],
  ['monogamy', 'Monogamy', 32, 2, 'One pack at a time.'],
  ['improv', 'Improv', 18, 1, 'Yes, and...'],
  ['ponzi-scheme', 'Ponzi Scheme', 58, 3, 'Early investors only.'],
  ['dunning-kruger-effect', 'Dunning-Kruger Effect', 38, 2, 'Confidently wrong.'],
  ['weaponized-incompetence', 'Weaponized Incompetence', 22, 1, 'How do I pack again?'],
  ['manifest-destiny', 'Manifest Destiny', 62, 3, 'Westward, always.'],
  ['situationship', 'Situationship', 16, 1, 'What are we?'],
  ['girl-math', 'Girl Math', 24, 1, 'Technically free.'],
  ['the-butterfly-effect', 'The Butterfly Effect', 68, 3, 'One flap. Total chaos.'],
  ['plausible-deniability', 'Plausible Deniability', 42, 2, 'I was never here.'],
  ['five-second-rule', 'Five-second Rule', 12, 1, 'Still good.'],
  ['murphys-law', "Murphy's Law", 36, 2, 'Anything that can go wrong...'],
  ['gaslighting', 'Gaslighting', 44, 2, 'That never happened.'],
  ['the-trolley-problem', 'The Trolley Problem', 50, 2, 'Multi-track drifting.'],
  ['sunk-cost-fallacy', 'Sunk Cost Fallacy', 26, 1, 'Too deep to quit now.'],
  ['pretty-privilege', 'Pretty Privilege', 34, 2, 'Rules are different.'],
  ['schrodingers-cat', "Schrödinger's Cat", 72, 3, 'Both winning and losing.'],
  ['corporate-synergy', 'Corporate Synergy', 15, 1, 'Let us circle back.'],
  ['the-bro-code', 'The Bro Code', 21, 1, 'Article 1: bros.'],
];

// ───────────────────────────── HAPPENINGS ─────────────────────────────
type HapRow = [id: string, name: string, rating: number, rarity: Rarity, effect: HappeningEffect, blurb: string];
const HAPPENINGS: HapRow[] = [
  ['divorce', 'Divorce', 10, 2, { kind: 'hitOpp', amount: 22 }, 'Takes half of everything. Roughly.'],
  ['wwii', 'WWII', 20, 3, { kind: 'fieldShake', amount: 8 }, 'Everyone loses something.'],
  ['sneeze-during-eulogy', 'Sneeze During Eulogy', 8, 1, { kind: 'hitOpp', amount: 10 }, 'Awkward. Costly.'],
  ['the-big-bang', 'The Big Bang', 30, 4, { kind: 'boostSelf', amount: 40 }, 'Everything, all at once.'],
  ['woodstock-99', "Woodstock '99", 14, 2, { kind: 'fieldShake', amount: 12 }, 'Fires. Mud. Limp Bizkit.'],
  ['missed-flight', 'Missed Flight', 6, 1, { kind: 'hitOpp', amount: 15 }, 'Gate closed two minutes ago.'],
  ['pilates', 'Pilates', 10, 1, { kind: 'boostSelf', amount: 12 }, 'Core strength, core profits.'],
  ['bad-trip', 'Bad Trip', 12, 2, { kind: 'halveOppTop' }, 'Their best card is melting.'],
  ['colonoscopy', 'Colonoscopy', 8, 1, { kind: 'hitOpp', amount: 18 }, 'A thorough inspection.'],
  ['military-coup', 'Military Coup', 24, 3, { kind: 'steal' }, 'Seize their weakest asset.'],
  ['gender-reveal', 'Gender Reveal', 12, 2, { kind: 'boostSelf', amount: 20 }, 'Started a wildfire. Worth it.'],
  ['divine-intervention', 'Divine Intervention', 25, 3, { kind: 'doubleLast' }, 'Your last card is blessed. Doubled.'],
  ['walk-of-shame', 'Walk of Shame', 10, 1, { kind: 'boostSelf', amount: 10 }, 'Head high, heels in hand.'],
  ['intervention', 'Intervention', 8, 1, { kind: 'hitOpp', amount: 12 }, 'We are all here because we care.'],
  ['earthquake', 'Earthquake', 18, 2, { kind: 'fieldShake', amount: 15 }, 'Everything shakes. Everyone pays.'],
  ['flash-mob', 'Flash Mob', 12, 1, { kind: 'boostSelf', amount: 15 }, 'Next pack shows an extra option.'],
  ['the-rapture', 'The Rapture', 28, 4, { kind: 'halveOppTop' }, 'Their best card ascends.'],
  ['food-poisoning', 'Food Poisoning', 6, 1, { kind: 'hitOpp', amount: 14 }, 'The gas station sushi.'],
  ['high-school-reunion', 'High School Reunion', 12, 1, { kind: 'boostSelf', amount: 18 }, 'Peaked. Right now.'],
  ['salem-witch-trials', 'Salem Witch Trials', 16, 3, { kind: 'hitOpp', amount: 25 }, 'She floats.'],
  ['surprise-drug-test', 'Surprise Drug Test', 10, 2, { kind: 'hitOpp', amount: 22 }, 'Cup. Now.'],
  ['the-french-revolution', 'The French Revolution', 22, 3, { kind: 'steal' }, 'Redistribute their lowest card.'],
  ['accidental-reply-all', 'Accidental Reply All', 6, 1, { kind: 'hitOpp', amount: 8 }, 'Everyone saw it.'],
  ['fender-bender', 'Fender Bender', 6, 1, { kind: 'hitOpp', amount: 9 }, 'Exchange insurance. Exchange blows.'],
  ['erectile-dysfunction', 'Erectile Dysfunction', 8, 1, { kind: 'hitOpp', amount: 11 }, 'Happens to everyone.'],
  ['thanksgiving-dinner', 'Thanksgiving Dinner', 12, 1, { kind: 'boostSelf', amount: 16 }, 'Politics optional.'],
  ['tornado', 'Tornado', 20, 3, { kind: 'fieldShake', amount: 20 }, 'Takes the roof. Takes the score.'],
  ['moon-landing', 'Moon Landing', 26, 3, { kind: 'boostSelf', amount: 30 }, 'One small step. Huge value.'],
  ['tsunami', 'Tsunami', 22, 3, { kind: 'hitOpp', amount: 28 }, 'Washes their field.'],
  ['catfished', 'Catfished', 10, 2, { kind: 'steal' }, 'They were not who they said.'],
  ['open-mic-night', 'Open Mic Night', 6, 1, { kind: 'boostSelf', amount: 8 }, 'Tough crowd.'],
  ['dui-checkpoint', 'DUI Checkpoint', 10, 1, { kind: 'hitOpp', amount: 16 }, 'Walk the line.'],
  ['sleep-paralysis', 'Sleep Paralysis', 10, 2, { kind: 'hitOpp', amount: 13 }, 'The demon is in the corner.'],
  ['jury-duty', 'Jury Duty', 6, 1, { kind: 'hitOpp', amount: 7 }, 'Civic duty, minor damage.'],
  ['running-of-the-bulls', 'Running of the Bulls', 14, 2, { kind: 'boostSelf', amount: 22 }, 'Adrenaline pays.'],
  ['wet-dream', 'Wet Dream', 8, 1, { kind: 'boostSelf', amount: 14 }, 'Woke up winning.'],
  ['wedding-objection', 'Wedding Objection', 14, 2, { kind: 'halveOppTop' }, 'Speak now. Halve their best.'],
];

// ───────────────────────────── ??? ─────────────────────────────
const SPECIAL: Row[] = [
  ['redemption', 'Redemption', 0, 3, 'A redemption pack of 2, openable only after all other packs.'],
  ['god', 'God', 0, 4, 'All slots open. Every pack opens at once. The best set is chosen for you.'],
  ['aether', 'Aether', 0, 2, 'Nothing. Absolutely nothing.'],
  ['karma', 'Karma', 0, 3, 'Playing badly? Your luck turns. Playing well? Also turns.'],
  ['devil', 'Deal with the Devil', 0, 3, 'A great card now. One random card taken before your last pack.'],
  ['premonition', 'Premonition', 0, 3, 'Peek inside one unopened pack without opening it.'],
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

export const CARDS: CardDef[] = [
  ...rows('life', LIFE),
  ...rows('stuff', STUFF, (id) => (abilities[id] ? { ability: abilities[id] } : {})),
  ...PLACES.map(([id, name, rating, rarity, mods, blurb]) => ({ id, name, cat: 'places' as const, rating, rarity, mods, blurb })),
  ...rows('ideas', IDEAS, (id) => (abilities[id] ? { ability: abilities[id] } : {})),
  ...HAPPENINGS.map(([id, name, rating, rarity, effect, blurb]) => ({
    id,
    name,
    cat: 'happenings' as const,
    rating,
    rarity,
    effect,
    blurb,
    ...(abilities[id] ? { ability: abilities[id] } : {}),
  })),
  ...rows('special', SPECIAL, (id) => ({ ability: abilities[id] })),
];

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

export const RARITY_META: Record<Rarity, { label: string }> = {
  1: { label: 'Common' },
  2: { label: 'Uncommon' },
  3: { label: 'Rare' },
  4: { label: 'Legendary' },
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
