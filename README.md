# Polypacks

A 2D casual pack-opening / card-betting game that runs as a PWA on phones and desktops.

Open packs, keep one card from each, build the most valuable set, and out-draft a simulated
opponent in one of three modes: **Zero-sum** (one game, winner takes all; stakes $100–$2,500,
matched by the opponent), **Margin of Victory** (bankroll betting; buy-in $100–$1,000, the margin is
paid per point scaled to the buy-in, cash out any time) or **Solitaire** (spend a stake on packs, build
the best set; only the cards you pick count).

## Running it

```sh
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # typecheck + production build into dist/ (with service worker + manifest)
npm run preview    # serve the production build
npm test           # engine simulations (card data, solitaire, 300 fated matches; FATE_SEEDS=1200 for a stress run)
npm run smoke      # Playwright walkthrough of every mode against a running preview (CHROMIUM_PATH optional)
```

Install it from the browser's "Add to Home Screen" / install prompt; it works offline after the
first load and saves the current game locally, so a refresh resumes where you were.

The build is portable. All paths are relative, and the game (`dist/index.html`) and the card index
(`dist/cards/index.html`) are each a single self-contained HTML file with scripts, styles and fonts
inlined. Upload the whole `dist` folder anywhere: a domain root, a sub-folder, or a platform that
embeds games in a sandboxed iframe. The only other files are icons, `manifest.json` and the offline
service worker, which is skipped where the host doesn't allow one.

## How a match goes

The match *is* the draft. You and the opponent each hold the same loadout of packs on the horizon
(5 Basic, 2 Enhanced, 1 Baptized, 2 Utility by default). A turn is: open one pack, take one card,
resolve whatever that card does, then the opponent does the same. Picks land face up on both boards,
so the duel is readable from the first pack; the only way to hide a card is Area 51. The opponent keeps
its last pack sealed until you are done, so the final reveal is always theirs. When the packs are gone
any empty slot is filled with a random common of its category (not in Solitaire, where empty slots score
nothing), the ??? box resolves, and the showdown decides the final totals.

**Slots.** The newest card always takes a slot. When every slot that takes it is full, it replaces the
weakest older card there (preferring one of its own kind: a new idea replaces the old idea), so you can
always grab the card that completes a combo.

**The showdown** plays out on the table after the last pick, with the totals running up on the board:

- **Home place (+30).** Each side's best slotted place rises out of its slot over a dimmed table, the
  two line up and crash together, and the winner returns home. Home power is the place's rating plus 6
  for every event in the set, 12 when the event connects to the place. Each place has a *home field*
  card (the Doghouse has the divorced dad): hold both and home place is yours outright.
- **Home ties (+5 each).** One by one, every life, stuff or event card connected to the home place
  lights up with a line to it and the name of the connection: a tsunami is an "island" card for the
  Cayman Islands, a bad trip is a "security risk" at Area 51. Places have two or three themes (the sea,
  money, the party, crime, power, the afterlife, suburbia...) plus a few one-off connections.
- **Home combos.** 32 combos that only count when their place is your home (Las Vegas plus an open mic
  night or a flash mob, the Oval Office plus a military coup, and so on).

The set totals count up like a digital counter as points land, and the winner is only shown once the
whole showdown has played out.

During the draft the running totals are slot ratings plus combos. The pack opener marks cards that fit
your current home, and cards that would complete a combo or a home combo.

**Combos.** 120 regular combos plus the 32 home combos; every idea card has at least one partner. Each
game plants the parts of a few combos across your packs (one with an idea card, one home combo), so
every draft offers real chances.

Cards have **abilities**, not score modifiers. They fire the moment a card is taken, and a card that
changes hands fires again for its new owner. Flamethrower burns an opponent card, Rapture removes
their best, Military Coup swaps one of yours for one of theirs, Trolley removes their worst (or one of
their unopened Basic packs), Bermuda sinks their boats, DUI Checkpoint strips vehicles or impairments,
Pentagon removes Communism and offers a Coup, Wedding cancels a combo, Area 51 protects and conceals,
Bouncer blocks the next steal or swap, Cayman shields your money cards, Ponzi upgrades them,
Defibrillator revives a destroyed card, Post-nut Clarity rerolls your worst, Schrödinger's Cat takes
two cards and lets you flip which one counts, Divine Intervention marks the best card of your next
pack, Déjà Vu / Premonition peek at a sealed pack, Bitcoin buys an extra Enhanced pack, DeLorean
reopens a pack. The full list with exact wording is in `src/data/abilities.ts` and on the card index.

Abilities are loud on purpose. Every card shows its ability's name under the art, and holding any
card (press and hold, or long-press on a phone) opens a popup that explains it. When an ability fires,
its card swells and flashes on the board and the ability's name sweeps across the screen; any choice it
asks of you opens with a blinking header saying which ability, from whose card, and what to do.

**Minigames** trigger when both boards line up (Animal Kingdom when both sides own animals, Act of
God when a disaster meets a place, Fish On for a trawler and a tuna, Crime Pays, Bar Fight). They are
resolved by a seeded roll. The overlay states what is at stake in game terms, shows the odds on the roll
bar, then plays each card's result on the card itself (destroyed cards crack and crumble, stolen cards
are stamped and named for their new set) and ends with each set's value change. The roll is part of the
sealed match, so the opponent's steering already knows how it ends.

## Card index

`/cards/` is a second page of the same site: every card with its rating, tier, ability text and
illustration, a notes box (saved in the browser, exportable), a selection bar that reports valid
combos among the selected cards, the full combo list and the minigame rules. Source in `src/cards/`.

## How it is put together

```
src/data/cards.ts      every card: category, rating, blurb, ability id (generated; tier derived from rating + ability worth)
src/data/abilities.ts  ability names, timing and what each is worth to the tiering
src/data/combos.ts     card combos (regular and home), bonuses and the special slots they unlock
src/data/places.ts     place themes, card themes and the showdown numbers
src/data/minigames.ts  minigame triggers, odds and flavour
src/data/art.ts        card id → layered illustration (Game Icons via react-icons + custom SVG paths; generated)
src/engine/rng.ts      seeded PRNG so every match is reproducible
src/engine/match.ts    the match state machine: packs, picks, abilities, prompts, minigames, end fills, scoring
src/engine/finale.ts   the showdown: home place, home turf, home ties, home combos, final totals
src/engine/bot.ts      the opponent: picks any catalog card, steering toward the fated result
src/engine/deck.ts     slot rules: newest card wins its slot, combo-driven slot unlocks
src/engine/game.ts     modes, fate generation, money settlement
src/ui/Home.tsx        pack carousel, tap-anywhere, mode menu, wallet, sound, rules
src/ui/Table.tsx       the whole match on one table: deal, packs on the horizon, slot grid, mirrored
                       opponent, fan-out pack opening, ability prompts, minigame overlay, results
src/ui/Card.tsx        3D flipping card: neon face with glow art, back with category sigil + tier glow
src/ui/store.ts        controller + persisted snapshot (wallet, save/resume)
src/ui/sound.ts        WebAudio synth for taps, flips, tears, rares, wins
```

Card illustrations are pre-made vector icons rendered as neon sprites in one colour: a pale neon
fill with the category's glow, with cut-outs in the backdrop tone as the only second tone. Icons come
from [Game Icons](https://game-icons.net) (CC BY 3.0), [Font Awesome Free](https://fontawesome.com)
(CC BY 4.0) and [Phosphor](https://phosphoricons.com) (MIT), all via `react-icons`; a handful of cards
use a custom SVG composition. Display font is Rajdhani (OFL) bundled through
`@fontsource`.

### Tiers

Every card is rated on a 40–99 scale. Its tier is about prowess only (rating plus what its ability
is worth), never its category: common (green, ≤56), uncommon (orange, ≤69), rare (pink, ≤78),
epic (purple, ≤86), legendary (red, ≤93), mythic (teal, 94+). Both faces of a card glow with its
tier colour; pack odds are keyed to tiers.

### Simulated multiplayer and the fate

Every game seals its result before the first pack is opened (`makeFate`): for each round, who wins
and by roughly how much. The opponent never shows the contents of its packs, only the card it takes,
so that card can be anything in the catalog that the pack could hold. On every turn the bot simulates
each candidate pick (abilities and minigames included), projects the range of what you can still do
with your remaining packs and end fills, and chooses a card that keeps the finale reachable while
spreading the correction across its picks so nothing looks like a trump card. Its last pick, and the
commons that fill its empty slots, land the final score on the sealed side of the line. The result
screen shows the fate seal so you can check that the outcome was decided up front.

`src/engine/engine.test.ts` plays seeded matches with a random drafting policy and asserts that the
winner always matches the fate.
