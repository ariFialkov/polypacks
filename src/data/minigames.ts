/**
 * Minigames: unlike combos (one side holds a set of cards), a minigame fires when the whole
 * table meets a condition. Each resolves with a single seeded roll and some drama.
 */
export interface MinigameDef {
  id: string;
  name: string;
  tagline: string;
  rules: string;
}

export const MINIGAMES: MinigameDef[] = [
  {
    id: 'animal-kingdom',
    name: 'Animal Kingdom',
    tagline: 'Only the fittest survive.',
    rules: 'Natural Selection is on the table and both sides hold an animal. Each side sends a champion (you choose if you have several). One roll, weighted by rating. The loser is removed.',
  },
  {
    id: 'act-of-god',
    name: 'Act of God',
    tagline: 'Nowhere is safe.',
    rules: 'A natural disaster (Tornado, Tsunami, Earthquake) hits the table while both sides hold a place. Every place rolls to survive, weighted by rating; the disaster\'s owner\'s places get a reinforced roll. Places that fail are wiped off the map.',
  },
  {
    id: 'fish-on',
    name: 'Fish On!',
    tagline: 'The one that got away.',
    rules: 'One side has the Fishing Trawler and the other the Bluefin Tuna. The trawler casts: land it and the tuna changes hands; lose it and the trawler goes down with all hands.',
  },
  {
    id: 'crime-pays',
    name: 'Crime Pays',
    tagline: 'Until it does not.',
    rules: 'A side holds two or more crime cards (Ponzi Scheme, Tax Evasion, Catfished, Fentanyl). The heist rolls: success steals a random card from the other side; a bust loses one crime card. Plausible Deniability makes a bust harmless; an opposing Surprise Drug Test makes it likelier.',
  },
  {
    id: 'bar-fight',
    name: 'Bar Fight',
    tagline: 'Not tonight, chief.',
    rules: 'Bouncer on one side, Frat Guy on the other. One roll, weighted by rating. The loser is thrown out of the game.',
  },
];

export const MINIGAME_BY_ID: Record<string, MinigameDef> = Object.fromEntries(MINIGAMES.map((m) => [m.id, m]));
