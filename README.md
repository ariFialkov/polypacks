# Polypacks

A 2D casual pack-opening / card-betting game that runs as a PWA on phones and desktops.

Open packs, keep one card from each, build the most valuable set, then play it out against a
simulated opponent in one of three modes: **Zero-sum Series** (best of three), **Margin of Victory**
(bankroll betting, cash out any time) or **Solitaire** (spend a stake on packs, build the best set).

## Running it

```sh
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # typecheck + production build into dist/ (with service worker + manifest)
npm run preview    # serve the production build
npm test           # engine simulations (draft, deck, 500 fated rounds)
```

Install it from the browser's "Add to Home Screen" / install prompt; it works offline after the
first load and saves the current game locally, so a refresh resumes where you were.

## How it is put together

```
src/data/cards.ts     every card: category, value, rarity, emoji, blurb, place modifiers, happening effects, abilities
src/data/combos.ts    card combos, bonuses and the special slots they unlock
src/engine/rng.ts     seeded PRNG so every game is reproducible
src/engine/draft.ts   packs, picks, ??? cards (Redemption, God, Aether, Karma, Devil, Premonition), DeLorean / Déjà Vu / Flash Mob
src/engine/deck.ts    slot rules and the auto-builder (best subset + bipartite slot matching, combo-driven slot unlocks)
src/engine/round.ts   the turn-based round: scenes, field values, happenings, combos, scoring
src/engine/bot.ts     the opponent: concealed hand, steering toward the fated result
src/engine/game.ts    modes, fate generation, money settlement
src/data/art.ts       card id → illustration (Game Icons via react-icons; generated, every card covered)
src/ui/Home.tsx       pack carousel, tap-anywhere, mode menu, wallet, sound, rules
src/ui/Table.tsx      the whole match on one table: deal, packs on the horizon, slot grid, mirrored
                      opponent, fan-out pack opening (tap or auto reveal), ??? burst, play, results
src/ui/Card.tsx       3D flipping card: neon face with glow art, back with category sigil + tier glow
src/ui/sound.ts       WebAudio synth for taps, flips, tears, rares, wins
```

Card illustrations are from [Game Icons](https://game-icons.net) (CC BY 3.0), rendered as neon
sprites. Display font is Rajdhani (OFL) bundled through `@fontsource`.

### Simulated multiplayer and the fate

Every game seals its result before the first pack is opened (`makeFate`): for each round, who wins
and by roughly how much. The opponent's hand mirrors the categories of yours, but each concealed
card's identity is only decided when it is revealed. On every turn the bot projects the full range of
what you could still do with your remaining cards and place swap, then picks a real card from the
catalog that keeps the finale reachable, spreading the correction across its cards so nothing looks
like a trump card. The final reveal lands on the sealed side of the line. The result screen shows the
fate seal so you can check that the outcome was decided up front.

`src/engine/engine.test.ts` plays 500 seeded rounds with a random drafting and playing policy and
asserts that the winner always matches the fate.
