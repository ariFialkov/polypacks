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

## How a match goes

The match *is* the draft. You and the opponent each hold the same loadout of packs on the horizon
(5 Basic, 2 Enhanced, 1 Baptized, 2 Utility by default). A turn is: open one pack, take one card,
resolve whatever that card does, then the opponent does the same. Picks land face up on both boards,
so the duel is readable from the first pack; the only way to hide a card is Area 51. The opponent keeps
its last pack sealed until you are done, so the final reveal is always theirs. When the packs are gone
any empty slot is filled with a random common of its category (not in Solitaire, where empty slots score nothing), the ??? box resolves, and the higher
set value wins (slot ratings + active combos).

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

**Minigames** trigger when both boards line up (Animal Kingdom when both sides own animals, Act of
God when a disaster meets a place, Fish On for a trawler and a tuna, Crime Pays, Bar Fight). They are
resolved by a seeded roll with a short VFX overlay; the loser's card is removed. The roll is part of the
sealed match, so the opponent's steering already knows how it ends.

## Card index

`/cards/` is a second page of the same site: every card with its rating, tier, ability text and
illustration, a notes box (saved in the browser, exportable), a selection bar that reports valid
combos among the selected cards, the full combo list and the minigame rules. Source in `src/cards/`.

## How it is put together

```
src/data/cards.ts      every card: category, rating, blurb, ability id (generated; tier derived from rating + ability worth)
src/data/abilities.ts  ability names, timing and what each is worth to the tiering
src/data/combos.ts     card combos, bonuses and the special slots they unlock
src/data/minigames.ts  minigame triggers, odds and flavour
src/data/art.ts        card id → layered illustration (Game Icons via react-icons + custom SVG paths; generated)
src/engine/rng.ts      seeded PRNG so every match is reproducible
src/engine/match.ts    the match state machine: packs, picks, abilities, prompts, minigames, end fills, scoring
src/engine/bot.ts      the opponent: picks any catalog card, steering toward the fated result
src/engine/deck.ts     slot rules and the auto-builder (best nine by rating, combo-driven slot unlocks)
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
