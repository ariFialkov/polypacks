import { useEffect, useRef, useState } from 'react';
import { CARD_BY_ID, CATEGORY_META, MAIN_CATEGORIES, TIER_META } from '../data/cards';
import { ABILITIES } from '../data/abilities';
import { COMBO_BY_ID, comboHints } from '../data/combos';
import { MINIGAME_BY_ID } from '../data/minigames';
import { BOT_AVATARS } from '../data/art';
import { PACK_INFO, PACK_PRICES, activeCombos, deckOf, matchShowdown, matchTotals, sideScore, unopened, type MPack, type MatchState, type MinigameOutcome, type Prompt, type SideState } from '../engine/match';
import type { DeckSlot } from '../engine/deck';
import { MODE_INFO, seriesPrize } from '../engine/game';
import { hashString } from '../engine/rng';
import type { CardDef, CardInst, MainCategory, Side } from '../engine/types';
import { Card } from './Card';
import { useShowdownPlayback, type Mark } from './Showdown';
import { sideShowdown } from '../engine/finale';
import { HOME_TIE, PLACE_THEMES, THEME_LABEL } from '../data/places';
import { Wallet } from './Home';
import { Art, CatIcon, Ui } from './Icon';
import { PackArt, PackTile } from './PackTile';
import { controller, type ComboFlash, type Snapshot } from './store';

const ROW1 = ['place', 'event', 'flex'];
const ROW2 = ['life1', 'life2', 'stuff1', 'stuff2', 'stuff3', 'idea'];
const SPECIAL_IDS = ['sp1', 'sp2', 'sp3'];
const PACK_KINDS: (keyof typeof PACK_PRICES)[] = ['basic', 'enhanced', 'baptized', 'utility'];
const SLOT_LABEL: Record<string, string> = { place: 'Place', event: 'Event', flex: 'Place / Event', life1: 'Life', life2: 'Life', stuff1: 'Stuff', stuff2: 'Stuff', stuff3: 'Stuff', idea: 'Idea', sp1: 'Life / Stuff', sp2: 'Idea / Event', sp3: 'Wild' };
const SLOT_CAT: Record<string, MainCategory> = { place: 'places', event: 'happenings', flex: 'places', life1: 'life', life2: 'life', stuff1: 'stuff', stuff2: 'stuff', stuff3: 'stuff', idea: 'ideas', sp1: 'life', sp2: 'ideas', sp3: 'stuff' };

export function Table({ s }: { s: Snapshot }) {
  const game = s.game!;
  const m = s.match;
  const solo = game.mode === 'solitaire';
  const BotAvatar = BOT_AVATARS[hashString(game.bot.name) % BOT_AVATARS.length];
  const pb = useShowdownPlayback(m, !!(m && s.showdown && m.phase === 'done' && !s.minigameShow));

  if (!m) {
    return (
      <div className="table solo">
        <Hud s={s} />
        {game.phase === 'shop' && <Shop s={s} />}
        {(game.phase === 'roundResult' || game.phase === 'gameOver') && <ResultOverlay s={s} />}
      </div>
    );
  }

  const yourTurn = m.phase === 'draft' && m.turn === 'you' && !m.prompt && !s.botBusy;
  const prompt = m.prompt && m.promptFor === 'you' ? m.prompt : null;
  const youLeft = unopened(m.you).length;
  const youDeck = deckOf(m.you);
  const botDeck = solo ? null : deckOf(m.bot);
  // card marks: the showdown's, or a just-completed combo's
  const marks: Record<string, Mark> = { ...(pb?.marks ?? {}) };
  if (!pb && s.comboFlash) for (const u of s.comboFlash.uids) marks[u] = { kind: 'combo' };
  const pop: ComboFlash | null = pb ? pb.pop : s.comboFlash;
  const scoreOf = (w: Side) => (pb ? pb.totals[w] : m.phase === 'done' && !s.showdown ? matchTotals(m)[w] : sideScore(w === 'you' ? m.you : m.bot));

  return (
    <div className={`table ${solo ? 'solo' : 'versus'} ${s.dealing ? 'dealing' : ''} phase-${m.phase} ${yourTurn ? 'your-turn' : ''}`}>
      <Hud s={s} />

      {!solo && botDeck && (
        <section className="board bot">
          <header className="boardhead">
            <div className="avatar">
              <BotAvatar />
            </div>
            <div className="who">
              <div className="nm">{game.bot.name}</div>
              <div className="st">{s.botBusy ? s.botStatus : m.phase === 'draft' ? `${unopened(m.bot).length} packs left · ${s.botStatus}` : 'done'}</div>
            </div>
            {game.mode === 'margin' && <div className="bank">${game.bot.money}</div>}
            <ComboChips side={m.bot} />
            <ScoreBadge key={m.seed} value={scoreOf('bot')} turn={m.turn === 'bot' && m.phase === 'draft'} />
            {pop?.side === 'bot' && <ComboPop pop={pop} />}
          </header>
          <div className="rows mirrored">
            <SlotRow ids={ROW2} deck={botDeck} side={m.bot} m={m} fresh={s.freshUids} marks={marks} />
            {botDeck.slots.some((x) => SPECIAL_IDS.includes(x.slot.id)) && <SlotRow ids={SPECIAL_IDS} deck={botDeck} side={m.bot} m={m} fresh={s.freshUids} marks={marks} special />}
            <SlotRow ids={ROW1} deck={botDeck} side={m.bot} m={m} fresh={s.freshUids} marks={marks} />
          </div>
          <div className="horizonrow">
            <div className="packrow">
              {m.bot.packs.map((p, i) => (
                <div key={p.id} className={`pack bot ${p.opened || p.destroyed ? 'gone' : 'idle'} ${p.destroyed ? 'destroyed' : ''} deal`} style={{ ['--i' as string]: i }}>
                  <PackArt kind={p.kind} label={p.label} count={p.size} category={p.kind === 'category' ? p.category : undefined} small />
                </div>
              ))}
            </div>
            <Ashes side={m.bot} />
          </div>
        </section>
      )}

      <div className="horizon">
        <div className="line" />
        <div className="center">
          {s.dealing && <span className="ticker">Dealing…</span>}
          {!s.dealing && m.phase === 'draft' && <TurnBar s={s} m={m} yourTurn={yourTurn} prompt={prompt} youLeft={youLeft} />}
          {m.phase !== 'draft' && m.result && (
            <span className="ticker">
              <b>{solo ? `Set value $${m.result.youScore}` : m.result.winner === 'you' ? 'You take it.' : m.result.winner === 'bot' ? `${game.bot.name} takes it.` : 'Dead heat.'}</b>
            </span>
          )}
        </div>
      </div>

      <section className="board you">
        <div className="horizonrow">
          <div className="packrow">
            {m.you.packs.map((p, i) => (
              <PackTile
                key={p.id}
                pack={p}
                style={{ ['--i' as string]: i }}
                state={p.destroyed ? 'gone' : p.opened && p.picked ? 'gone' : packTargetable(p, s, prompt) ? 'targetable' : p.peeked ? 'peeked' : 'idle'}
                onClick={p.destroyed ? undefined : !(p.opened && p.picked) || s.tool === 'delorean' ? () => controller.tapPack(p.id) : undefined}
              />
            ))}
          </div>
          <Ashes side={m.you} />
        </div>
        <div className="rows">
          <SlotRow ids={ROW1} deck={youDeck} side={m.you} m={m} fresh={s.freshUids} marks={marks} you yourTurn={yourTurn} />
          {youDeck.slots.some((x) => SPECIAL_IDS.includes(x.slot.id)) && <SlotRow ids={SPECIAL_IDS} deck={youDeck} side={m.you} m={m} fresh={s.freshUids} marks={marks} you yourTurn={yourTurn} special />}
          <SlotRow ids={ROW2} deck={youDeck} side={m.you} m={m} fresh={s.freshUids} marks={marks} you yourTurn={yourTurn} />
        </div>
        <header className="boardhead">
          <div className="avatar you">
            <Ui name="you" />
          </div>
          <div className="who">
            <div className="nm">You</div>
            <div className="st">{homeText(m.you) ?? hintText(m.you)}</div>
          </div>
          {youDeck.bench.length > 0 && (
            <div className="bench" title="Bench">
              {youDeck.bench.map((c) => (
                <Card key={c.uid} def={c.def} className="tiny" />
              ))}
            </div>
          )}
          {game.mode === 'margin' && <div className="bank">${game.you.money}</div>}
          <ComboChips side={m.you} />
          <ScoreBadge key={m.seed} value={scoreOf('you')} turn={yourTurn} label="set" />
          {pop?.side === 'you' && <ComboPop pop={pop} />}
        </header>
      </section>

      {s.opening && <Opening s={s} m={m} />}
      {s.specialFx && <SpecialFx def={s.specialFx} />}
      {prompt && prompt.kind !== 'peek' && !s.opening && <PromptOverlay prompt={prompt} m={m} />}
      {s.minigameShow && <MinigameOverlay mg={s.minigameShow} m={m} />}
      {pb?.layer}
      {(game.phase === 'roundResult' || game.phase === 'gameOver') && <ResultOverlay s={s} />}
    </div>
  );
}

function Hud({ s }: { s: Snapshot }) {
  const game = s.game!;
  return (
    <div className="hud">
      <div className="hud-left">
        <button className="hudbtn" onClick={() => controller.home()} aria-label="Quit">
          ‹
        </button>
        <button className="hudbtn" onClick={() => controller.toggleSound()} aria-label="Sound">
          <Ui name={s.sound ? 'sound-on' : 'sound-off'} />
        </button>
      </div>
      <div className="hud-mid">
        <span className="eyebrow">
          {MODE_INFO[game.mode].title}
          {game.mode !== 'solitaire' && game.stake > 0 && ` · $${game.stake.toLocaleString('en-US')}`}
          {game.mode === 'margin' && ` · round ${game.roundIndex + 1}`}
        </span>
      </div>
      <Wallet amount={s.wallet} />
    </div>
  );
}

/** "Home: Las Vegas (the party, money, crime)" for the side's current home place. */
function homeText(ss: SideState): string | null {
  const home = sideShowdown(ss).home;
  if (!home) return null;
  return `Home: ${home.def.name} (${(PLACE_THEMES[home.def.id] ?? []).map((t) => THEME_LABEL[t]).join(', ')})`;
}

function hintText(ss: SideState): string {
  const ids = ss.cards.map((c) => c.def.id);
  const h = comboHints(ids)[0];
  if (!h) return `${ss.cards.length} cards`;
  return `${h.combo.name} needs ${h.missing.map((alts) => alts.map((id) => CARD_BY_ID[id].name).join(' / ')).join(' + ')} (+${h.combo.bonus})`;
}

function packTargetable(p: MPack, s: Snapshot, prompt: Prompt | null): boolean {
  if (prompt?.kind === 'peek') return prompt.packIds.includes(p.id);
  if (s.tool === 'delorean') return p.opened && p.picked && !p.destroyed;
  if (s.tool === 'peek') return !p.opened && p.kind !== 'baptized';
  return false;
}

/** Remembers the last value and reports each change as a signed delta with a fresh key (for a one-shot animation). */
function useDelta(value: number): { n: number; k: number } | null {
  const prev = useRef(value);
  const [d, setD] = useState<{ n: number; k: number } | null>(null);
  useEffect(() => {
    if (value !== prev.current) {
      setD({ n: value - prev.current, k: Date.now() });
      prev.current = value;
    }
  }, [value]);
  return d;
}

function ScoreBadge({ value, turn, label }: { value: number; turn: boolean; label?: string }) {
  const d = useDelta(value);
  return (
    <div className={`scorebadge ${turn ? 'turn' : ''}`}>
      {label && <span className="lbl">{label}</span>}
      <span className="money">${value}</span>
      {d && (
        <span key={d.k} className={`scoredelta ${d.n > 0 ? 'up' : 'down'}`}>
          {d.n > 0 ? '+' : '−'}
          {Math.abs(d.n)}
        </span>
      )}
    </div>
  );
}

/** A compact, read-only copy of one side's set, shown around the pack opener. */
function MiniBoard({ side, name, you }: { side: SideState; name: string; you?: boolean }) {
  const deck = deckOf(side);
  const bySlot = new Map(deck.slots.map((x) => [x.slot.id, x]));
  const specials = SPECIAL_IDS.filter((id) => bySlot.has(id));
  const cell = (id: string) => {
    const slot = bySlot.get(id);
    if (!slot) return null;
    const card = slot.card;
    if (!card) {
      return (
        <div key={id} className="minicell empty">
          <CatIcon cat={SLOT_CAT[id]} />
        </div>
      );
    }
    const concealed = !you && side.concealedUids.includes(card.uid);
    return (
      <div key={id} className="minicell">
        {concealed ? <Card back backCat={card.def.cat} className="mini" /> : <Card def={card.def} className="mini" />}
      </div>
    );
  };
  return (
    <section className={`miniboard ${you ? 'you' : 'bot'}`} onClick={(e) => e.stopPropagation()}>
      <header>
        <span className="nm">{name}</span>
        <span className="st">{you ? [homeText(side), hintText(side)].filter(Boolean).join(' · ') : [homeText(side), `${unopened(side).length} packs left`].filter(Boolean).join(' · ')}</span>
        <ComboChips side={side} />
        <ScoreBadge value={sideScore(side)} turn={false} label={you ? 'set' : undefined} />
      </header>
      <div className="minirows">
        <div className="minirow">{[...ROW1, ...specials].map(cell)}</div>
        <div className="minirow">{ROW2.map(cell)}</div>
      </div>
    </section>
  );
}

/** The score pop for a combo: its name and bonus, and the cards that made it. */
function ComboPop({ pop }: { pop: ComboFlash }) {
  return (
    <div className={`combopop ${pop.home ? 'home' : ''}`} key={pop.key}>
      <b>
        {pop.name} +{pop.bonus}
      </b>
      <span>{pop.cards.join(' + ')}</span>
    </div>
  );
}

function ComboChips({ side }: { side: SideState }) {
  const combos = deckOf(side).combos;
  if (!combos.length) return null;
  return (
    <div className="combochips">
      {combos.map((c) => (
        <span key={c.id} className={`combochip ${side.cancelledCombos.includes(c.id) ? 'cancelled' : ''}`}>
          {c.name} +{c.bonus}
        </span>
      ))}
    </div>
  );
}

function Ashes({ side }: { side: SideState }) {
  const ashes = side.graveyard.filter((c) => c.uid !== side.catPair?.underUid);
  if (!ashes.length) return null;
  return (
    <div className="ashes" title="Destroyed">
      <span className="lbl">gone</span>
      {ashes.map((c) => (
        <Card key={c.uid} def={c.def} className="tiny" dim />
      ))}
    </div>
  );
}

// ───────────── slots ─────────────
function SlotRow({ ids, deck, side, m, fresh, marks, you, yourTurn, special }: { ids: string[]; deck: ReturnType<typeof deckOf>; side: SideState; m: MatchState; fresh: string[]; marks: Record<string, Mark>; you?: boolean; yourTurn?: boolean; special?: boolean }) {
  const slots = deck.slots.filter((x) => ids.includes(x.slot.id));
  if (!slots.length) return null;
  const homeUid = slots.some((x) => x.card?.def.cat === 'places') ? sideShowdown(side).home?.uid : undefined;
  return (
    <div className={`slotrow ${special ? 'r3' : ids === ROW1 ? 'r1' : 'r2'}`}>
      {slots.map((slot, i) => (
        <Slot key={slot.slot.id} slot={slot} i={i} side={side} m={m} fresh={fresh} you={!!you} yourTurn={!!yourTurn} homeUid={homeUid} mark={slot.card ? marks[slot.card.uid] : undefined} />
      ))}
    </div>
  );
}

function Slot({ slot, i, side, m, fresh, you, yourTurn, homeUid, mark }: { slot: DeckSlot; i: number; side: SideState; m: MatchState; fresh: string[]; you: boolean; yourTurn: boolean; homeUid?: string; mark?: Mark }) {
  const id = slot.slot.id;
  const card = slot.card;
  let content: React.ReactNode;
  if (card) {
    const concealed = !you && side.concealedUids.includes(card.uid);
    const isCatTop = side.catPair?.topUid === card.uid;
    const protectedCard = side.protectedUids.includes(card.uid);
    if (concealed) content = <Card back backCat={card.def.cat} className="facedown" badge="classified" />;
    else
      content = (
        <Card
          def={card.def}
          flags={{ fresh: fresh.includes(card.uid), flipped: fresh.includes(card.uid) }}
          badge={isCatTop ? (you && yourTurn ? 'tap to flip' : 'in the box') : protectedCard ? 'classified' : card.uid === homeUid ? 'home' : card.def.ability ? ABILITIES[card.def.ability].name : undefined}
          onClick={you && isCatTop && yourTurn ? () => controller.flipCat() : undefined}
          className={protectedCard ? 'protected' : ''}
        />
      );
  } else {
    content = (
      <div className={`empty ${slot.slot.special ? 'special' : ''}`}>
        <CatIcon cat={SLOT_CAT[id]} />
      </div>
    );
  }
  void m;
  return (
    <div className={`slot s-${id} ${mark ? `mark-${mark.kind}` : ''}`} style={{ ['--i' as string]: i }} data-uid={card?.uid}>
      {content}
      {mark?.label && <span className="markchip">{mark.label}</span>}
      {you && (
        <span className="slotlabel">
          {slot.slot.special ? 'SP · ' : ''}
          {SLOT_LABEL[id]}
        </span>
      )}
    </div>
  );
}

// ───────────── turn bar ─────────────
function TurnBar({ s, m, yourTurn, prompt, youLeft }: { s: Snapshot; m: MatchState; yourTurn: boolean; prompt: Prompt | null; youLeft: number }) {
  const c = m.you.charges;
  const solo = m.solo;
  if (prompt?.kind === 'peek') return <span className="ticker"><b>{prompt.source === 'dejavu' ? 'Seen It' : 'Premonition'}</b> · tap one of your sealed packs</span>;
  if (prompt) return <span className="ticker"><b>Your call</b></span>;
  if (s.botBusy) return <span className="ticker">{m.bot.name} {s.botStatus}</span>;
  if (m.turn === 'bot' && !solo) return <span className="ticker">{m.bot.name} is up…</span>;
  return (
    <div className="tools">
      {c.peek > 0 && (
        <button className={`tool ${s.tool === 'peek' ? 'active' : ''}`} onClick={() => controller.setTool('peek')}>
          <Art id="premonition" /> Peek <i>{c.peek}</i>
        </button>
      )}
      {c.delorean > 0 && (
        <button className={`tool ${s.tool === 'delorean' ? 'active' : ''}`} onClick={() => controller.setTool('delorean')}>
          <Art id="delorean" /> Go back <i>{c.delorean}</i>
        </button>
      )}
      <span className="ticker">
        {s.tool === 'peek' ? 'Tap a sealed pack to peek' : s.tool === 'delorean' ? 'Tap a picked pack to go back' : yourTurn ? <><b>Your move</b> · {youLeft} pack{youLeft === 1 ? '' : 's'} left</> : 'Waiting…'}
      </span>
    </div>
  );
}

// ───────────── opening overlay ─────────────
function Opening({ s, m }: { s: Snapshot; m: MatchState }) {
  const o = s.opening!;
  const pack = m.you.packs.find((p) => p.id === o.packId)!;
  const [revealedAt, setRevealedAt] = useState<Record<string, number>>({});
  useEffect(() => setRevealedAt({}), [o.packId]);
  const needsCategory = pack.kind === 'baptized' && !pack.category;
  const n = o.cards.length;
  const allRevealed = o.revealed.length >= n;
  const tap = (c: CardDef, revealed: boolean) => {
    if (o.mode !== 'open') return;
    if (!revealed) {
      setRevealedAt((x) => ({ ...x, [c.id]: Date.now() }));
      controller.reveal(c.id);
      return;
    }
    if (Date.now() - (revealedAt[c.id] ?? 0) < 450) return;
    controller.pickCard(c.id);
  };
  // a card that would complete a combo in your set (or a home combo for your home place) gets a flashing
  // outline and the payoff; a card that fits your home place is marked as a home tie
  const trial = (c: CardDef) => ({ ...m.you, cards: [...m.you.cards, { uid: 'preview', def: c }] });
  const combosBefore = new Set(deckOf(m.you).combos.map((x) => x.id));
  const homeBefore = sideShowdown(m.you);
  const extrasFor = (c: CardDef) => {
    if (c.cat === 'special') return { combo: undefined, homeCombo: undefined, homeTie: false };
    const t = trial(c);
    const combo = deckOf(t)
      .combos.filter((x) => !combosBefore.has(x.id) && !m.you.cancelledCombos.includes(x.id))
      .sort((a, b) => b.bonus - a.bonus)[0];
    const after = sideShowdown(t);
    const homeCombo = after.homeCombos.find((x) => !homeBefore.homeCombos.some((b) => b.id === x.id));
    const homeTie = after.ties.some((x) => x.uid === 'preview');
    return { combo, homeCombo, homeTie };
  };
  // what each card would add to your set right now (best nine + combos)
  const base = sideScore(m.you);
  const gainOf = (c: CardDef) => (c.cat === 'special' ? null : sideScore({ ...m.you, cards: [...m.you.cards, { uid: 'preview', def: c }] }) - base);
  const title = o.mode === 'peek' ? 'A glimpse inside' : o.catPack ? (o.firstPick ? 'Now tap the card that goes under' : 'Tap the card that stays face up') : allRevealed ? 'Tap a card to take it' : 'Tap a card to flip it';

  return (
    <div className="overlay opening" onClick={() => o.mode === 'peek' && controller.closeOpening()}>
      {!m.solo && <MiniBoard side={m.bot} name={m.bot.name} />}
      <div className="inner" onClick={(e) => e.stopPropagation()}>
        {needsCategory ? (
          <>
            <div className="detail">
              <span className="eyebrow">Baptized pack</span>
              <h2>Choose a category</h2>
              <p>One blessed card from it is yours.</p>
            </div>
            <div className="catgrid">
              {MAIN_CATEGORIES.map((cat) => (
                <button key={cat} className="catbtn" style={{ ['--hue' as string]: CATEGORY_META[cat].hue }} onClick={() => controller.tapPack(pack.id, cat as MainCategory)}>
                  <CatIcon cat={cat} />
                  <span>{CATEGORY_META[cat].label}</span>
                </button>
              ))}
            </div>
            <button className="btn ghost" onClick={() => controller.closeOpening()}>Not yet</button>
          </>
        ) : o.stage === 'tear' ? (
          <div className="tearing">
            <div className="half left"><PackArt kind={pack.kind} label={pack.label} count={pack.size} category={pack.kind === 'category' ? pack.category : undefined} /></div>
            <div className="half right"><PackArt kind={pack.kind} label={pack.label} count={pack.size} category={pack.kind === 'category' ? pack.category : undefined} /></div>
            <div className="flash" />
          </div>
        ) : (
          <>
            <div className="detail">
              <span className="eyebrow">{o.mode === 'peek' ? 'Premonition' : `${pack.label} pack${o.catPack ? ' · superposition' : ''}`}</span>
              <h2>{title}</h2>
            </div>
            <div className={`fan n${n}`}>
              {o.cards.map((c, i) => {
                const revealed = o.revealed.includes(c.id);
                const extras = revealed ? extrasFor(c) : { combo: undefined, homeCombo: undefined, homeTie: false };
                const combo = extras.combo;
                const gain = revealed && o.mode === 'open' ? gainOf(c) : null;
                const mid = (n - 1) / 2;
                const rot = (i - mid) * (n > 4 ? 7 : 11);
                const lift = Math.abs(i - mid) * 7;
                return (
                  <div key={c.id} className={`fanitem ${o.divine === c.id ? 'holy' : ''} ${combo || extras.homeCombo ? 'combo' : ''}`} style={{ ['--rot' as string]: `${rot}deg`, ['--lift' as string]: `${lift}px`, ['--i' as string]: i }}>
                    <Card def={c} back={!revealed} backCat={c.cat} backRarity={c.rarity} selected={o.firstPick === c.id} flags={{ flipped: revealed }} onClick={o.mode === 'open' ? () => tap(c, revealed) : undefined} badge={revealed && c.ability ? ABILITIES[c.ability].name : undefined} />
                    {gain !== null && <span className={`gaintag ${gain > 0 ? 'up' : gain < 0 ? 'down' : 'flat'}`}>{gain > 0 ? `+${gain}` : gain < 0 ? `−${-gain}` : '+0'}</span>}
                    {(combo || extras.homeCombo || extras.homeTie) && (
                      <div className="undertags">
                        {combo && (
                          <span className="combotag">
                            {combo.name} <b>+{combo.bonus}</b>
                          </span>
                        )}
                        {extras.homeCombo && (
                          <span className="combotag home">
                            Home: {extras.homeCombo.name} <b>+{extras.homeCombo.bonus}</b>
                          </span>
                        )}
                        {extras.homeTie && <span className="hometag">fits home +{HOME_TIE}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="detail blurbbox">
              <div className="tierlegend">
                {([1, 2, 3, 4, 5, 6] as const).map((t) => (
                  <span key={t} style={{ ['--tier' as string]: TIER_META[t].color }}>{TIER_META[t].label}</span>
                ))}
              </div>
              <p>{o.mode === 'peek' ? 'The pack stays sealed. Tap outside to close.' : o.divine ? 'The holy outline marks the best card for your set.' : 'The number above a card is what it adds to your set.'}</p>
            </div>
            {o.mode === 'open' ? (
              <div className="ctarow wide">
                <button className="btn ghost small" onClick={() => controller.closeOpening()}>Later</button>
                <label className="switch">
                  <input type="checkbox" checked={s.autoReveal} onChange={() => controller.toggleAutoReveal()} />
                  <span>Auto reveal</span>
                </label>
                {!allRevealed && !s.autoReveal && (
                  <button className="btn small" onClick={() => o.cards.forEach((c, i) => setTimeout(() => controller.reveal(c.id), i * 220))}>Flip all</button>
                )}
              </div>
            ) : (
              <button className="btn" onClick={() => controller.closeOpening()}>Close</button>
            )}
          </>
        )}
      </div>
      <MiniBoard side={m.you} name="You" you />
    </div>
  );
}

function SpecialFx({ def }: { def: CardDef }) {
  return (
    <div className="specialfx">
      <div className="rays" />
      <div className="orb">
        <Art id={def.id} />
      </div>
      <div className="sname">{def.name}</div>
      <div className="sblurb">{def.blurb}</div>
    </div>
  );
}

// ───────────── prompts ─────────────
function cardOf(side: SideState, uid: string): CardInst | undefined {
  return side.cards.find((c) => c.uid === uid) ?? side.graveyard.find((c) => c.uid === uid);
}

function CardPicker({ side, uids, onPick, selected }: { side: SideState; uids: string[]; onPick: (uid: string) => void; selected?: string | null }) {
  return (
    <div className="picker">
      {uids.map((uid) => {
        const c = cardOf(side, uid);
        if (!c) return null;
        return <Card key={uid} def={c.def} className="sm" onClick={() => onPick(uid)} selected={selected === uid} />;
      })}
    </div>
  );
}

function PromptOverlay({ prompt, m }: { prompt: Prompt; m: MatchState }) {
  const [first, setFirst] = useState<string | null>(null);
  useEffect(() => setFirst(null), [prompt.kind]);
  const you = m.you;
  const them = m.bot;
  const a = (ans: Parameters<typeof controller.answer>[0]) => controller.answer(ans);
  let body: React.ReactNode;
  let title = '';
  let eyebrow = '';
  switch (prompt.kind) {
    case 'bitcoin':
      eyebrow = 'Bitcoin';
      title = 'Buy in?';
      body = (
        <>
          <p>Spend the Bitcoin on an extra Enhanced pack. The Bitcoin leaves your set.</p>
          <div className="ctarow"><button className="btn ghost" onClick={() => a({ accept: false })}>Hold it</button><button className="btn primary glow" onClick={() => a({ accept: true })}>Buy a pack</button></div>
        </>
      );
      break;
    case 'flamethrower':
      eyebrow = 'Flamethrower';
      title = 'Burn one of their cards';
      body = <CardPicker side={them} uids={prompt.targets} onPick={(uid) => a({ uid })} />;
      break;
    case 'area51':
      eyebrow = 'Area 51';
      if (prompt.mode === 'initial') {
        title = 'Classify a card';
        body = (
          <>
            <p>Protect and conceal one card you already hold, or wait and protect your next pick.</p>
            <CardPicker side={you} uids={prompt.targets} onPick={(uid) => a({ uid })} />
            <button className="btn" onClick={() => a({})}>Protect my next pick instead</button>
          </>
        );
      } else {
        const c = cardOf(you, prompt.cardUid);
        title = `Protect ${c?.def.name ?? 'this card'}?`;
        body = (
          <>
            {c && <Card def={c.def} className="sm" />}
            <p>It cannot be stolen, burned, removed or swapped, and the opponent cannot see it.</p>
            <div className="ctarow"><button className="btn ghost" onClick={() => a({ accept: false })}>Not this one</button><button className="btn primary glow" onClick={() => a({ accept: true })}>Classify it</button></div>
          </>
        );
      }
      break;
    case 'pentagon':
      eyebrow = 'The Pentagon';
      title = 'Communism contained';
      body = (
        <>
          <p>Intelligence offers you a Military Coup card.</p>
          <div className="ctarow"><button className="btn ghost" onClick={() => a({ accept: false })}>Decline</button><button className="btn primary glow" onClick={() => a({ accept: true })}>Accept the Coup</button></div>
        </>
      );
      break;
    case 'coup':
      eyebrow = 'Military Coup';
      title = first ? 'Now choose what you give up' : 'Choose their card to take';
      body = first ? (
        <>
          <CardPicker side={you} uids={prompt.mine} onPick={(uid) => a({ uid: first, uid2: uid })} />
          <button className="btn ghost small" onClick={() => setFirst(null)}>Back</button>
        </>
      ) : (
        <CardPicker side={them} uids={prompt.theirs} onPick={(uid) => setFirst(uid)} />
      );
      break;
    case 'trolley': {
      eyebrow = 'The Trolley Problem';
      title = 'Pull the lever';
      const low = prompt.cardUid ? cardOf(them, prompt.cardUid) : null;
      body = (
        <div className="ctarow">
          {low && <button className="btn" onClick={() => a({ option: 'card' })}>Remove their {low.def.name} ({low.def.rating})</button>}
          {prompt.packIds.length > 0 && <button className="btn" onClick={() => a({ option: 'pack', uid: prompt.packIds[0] })}>Destroy one of their Basic packs</button>}
        </div>
      );
      break;
    }
    case 'wedding':
      eyebrow = 'Wedding Objection';
      title = 'Which combo do you object to?';
      body = (
        <div className="ctarow">
          {prompt.combos.map((id) => (
            <button key={id} className="btn" onClick={() => a({ uid: id })}>{COMBO_BY_ID[id]?.name ?? id} +{COMBO_BY_ID[id]?.bonus}</button>
          ))}
        </div>
      );
      break;
    case 'defib':
      eyebrow = 'Defibrillator';
      title = 'Bring one back';
      body = <CardPicker side={you} uids={prompt.graveyard} onPick={(uid) => a({ uid })} />;
      break;
    case 'postnut': {
      eyebrow = 'Post-nut Clarity';
      const c = cardOf(you, prompt.cardUid);
      title = `Trade ${c?.def.name ?? 'your weakest'} for a random ${c ? CATEGORY_META[c.def.cat].label : ''} card?`;
      body = (
        <>
          {c && <Card def={c.def} className="sm" />}
          <div className="ctarow"><button className="btn ghost" onClick={() => a({ accept: false })}>Keep it</button><button className="btn primary glow" onClick={() => a({ accept: true })}>Reroll it</button></div>
        </>
      );
      break;
    }
    case 'pretty':
      eyebrow = 'Pretty Privilege';
      title = 'Take one';
      body = <CardPicker side={them} uids={prompt.targets} onPick={(uid) => a({ uid })} />;
      break;
    case 'dui':
      eyebrow = 'DUI Checkpoint';
      title = 'You have to give up one group';
      body = (
        <>
          <div className="row" style={{ justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div className="group"><span className="eyebrow">Vehicles</span><CardPicker side={you} uids={prompt.vehicles} onPick={() => a({ option: 'vehicles' })} /></div>
            <div className="group"><span className="eyebrow">Impairments</span><CardPicker side={you} uids={prompt.impairments} onPick={() => a({ option: 'impairments' })} /></div>
          </div>
          <div className="ctarow"><button className="btn" onClick={() => a({ option: 'vehicles' })}>Lose the vehicles</button><button className="btn" onClick={() => a({ option: 'impairments' })}>Lose the impairments</button></div>
        </>
      );
      break;
    case 'champion':
      eyebrow = 'Animal Kingdom';
      title = 'Send your champion';
      body = <CardPicker side={you} uids={prompt.animals} onPick={(uid) => a({ uid })} />;
      break;
    default:
      return null;
  }
  return (
    <div className="overlay prompt">
      <div className="inner">
        <div className="detail">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {body}
      </div>
    </div>
  );
}

// ───────────── minigame ─────────────
function MinigameOverlay({ mg, m }: { mg: MinigameOutcome; m: MatchState }) {
  const [stage, setStage] = useState<'intro' | 'roll' | 'done'>('intro');
  useEffect(() => {
    setStage('intro');
    const t1 = setTimeout(() => setStage('roll'), 900);
    const t2 = setTimeout(() => setStage('done'), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mg.n, mg.id]);
  const def = MINIGAME_BY_ID[mg.id];
  const sideName = (sd: Side) => (sd === 'you' ? 'You' : m.bot.name);
  const left = mg.left.cardId ? CARD_BY_ID[mg.left.cardId] : null;
  const right = mg.right.cardId ? CARD_BY_ID[mg.right.cardId] : null;
  const hasRoll = mg.threshold > 0;
  return (
    <div className={`overlay minigame ${stage}`}>
      <div className="inner">
        <span className="eyebrow">Minigame</span>
        <h2 className="mgtitle">{def?.name ?? mg.title}</h2>
        <p className="sub">{def?.tagline}</p>
        <div className="faceoff">
          <div className={`contender ${stage === 'done' && mg.winner === mg.left.side ? 'won' : stage === 'done' ? 'lost' : ''}`}>
            {left ? <Card def={left} /> : <div className="sideblob">{mg.left.label}</div>}
            <span className="who">{sideName(mg.left.side)}</span>
          </div>
          <div className="vs">VS</div>
          <div className={`contender ${stage === 'done' && mg.winner === mg.right.side ? 'won' : stage === 'done' ? 'lost' : ''}`}>
            {right ? <Card def={right} /> : <div className="sideblob">{mg.right.label}</div>}
            <span className="who">{sideName(mg.right.side)}</span>
          </div>
        </div>
        {hasRoll && (
          <div className="rollbar">
            <div className="zone" style={{ width: `${mg.threshold * 100}%` }} />
            <div className={`needle ${stage !== 'intro' ? 'go' : ''}`} style={{ ['--to' as string]: `${mg.roll * 100}%` }} />
            <span className="lbl l">{mg.left.label}</span>
            <span className="lbl r">{mg.right.label}</span>
          </div>
        )}
        <div className={`mgresult ${stage === 'done' ? 'show' : ''}`}>{mg.text}</div>
        <button className="btn primary glow" disabled={stage !== 'done'} onClick={() => controller.ackMinigame()}>Continue</button>
      </div>
    </div>
  );
}

// ───────────── shop (solitaire) ─────────────
function Shop({ s }: { s: Snapshot }) {
  const game = s.game!;
  const budget = Math.max(s.wallet, 0);
  const left = budget - game.spent;
  return (
    <div className="overlay">
      <div className="inner panel shop">
        <span className="eyebrow">Solitaire</span>
        <h2>Buy your packs</h2>
        <div className="row spread">
          <div><div className="eyebrow">Wallet left</div><div className="bigstat money">${left}</div></div>
          <div style={{ textAlign: 'right' }}><div className="eyebrow">Spent</div><div className="money" style={{ fontSize: 22 }}>${game.spent}</div></div>
        </div>
        {PACK_KINDS.map((k) => {
          const info = PACK_INFO[k === 'utility' ? 'category' : k];
          return (
            <div className="shoprow" key={k}>
              <div className="packmini"><PackArt kind={k === 'utility' ? 'category' : k} label={k === 'utility' ? 'Utility' : info.label} small /></div>
              <div>
                <div><b>{k === 'utility' ? 'Utility' : info.label}</b> <span className="sub">${PACK_PRICES[k]}</span></div>
                <div className="sub">{k === 'utility' ? '2 cards, one category (or a Redemption pack)' : info.desc}</div>
              </div>
              <div className="stepper">
                <button onClick={() => controller.setLoadout(k, -1)} disabled={game.loadout[k] === 0}>−</button>
                <span>{game.loadout[k]}</span>
                <button onClick={() => controller.setLoadout(k, 1)} disabled={left < PACK_PRICES[k]}>+</button>
              </div>
            </div>
          );
        })}
        <p className="sub">Your score is the value of the set minus what you spent. Only the cards you pick count, so empty slots score nothing. The set's value goes back to your wallet.</p>
        <div className="ctarow">
          <button className="btn ghost small" onClick={() => controller.home()}>Back</button>
          <button className="btn primary glow" onClick={() => controller.beginMatch()} disabled={game.spent <= 0}>Deal</button>
        </div>
      </div>
    </div>
  );
}

// ───────────── results ─────────────
function ResultOverlay({ s }: { s: Snapshot }) {
  const game = s.game!;
  const m = s.match;
  const last = game.history[game.history.length - 1];
  const over = game.phase === 'gameOver';
  const deck = m ? deckOf(m.you) : null;

  if (game.mode === 'solitaire') {
    const profit = game.you.money - game.spent;
    const best = s.highScores[0] ?? profit;
    return (
      <div className="overlay result">
        <div className="inner">
          <span className="eyebrow">Solitaire</span>
          <div className={`headline ${profit >= 0 ? 'win' : 'lose'}`}>{profit >= 0 ? `+$${profit}` : `−$${-profit}`}</div>
          <p className="sub">Set value ${game.you.money} · spent ${game.spent} · best {best >= 0 ? `+$${best}` : `−$${-best}`}</p>
          {m && m.phase === 'done' && <ShowdownSummary m={m} />}
          {deck && <SetStrip cards={deck.slots.map((x) => x.card).filter((c): c is CardInst => !!c)} />}
          <div className="ctarow">
            <button className="btn" onClick={() => controller.home()}>Home</button>
            <button className="btn primary glow" onClick={() => controller.restartSame()}>Play again</button>
          </div>
        </div>
      </div>
    );
  }

  const won = over ? game.winner === 'you' : last?.winner === 'you';
  const headline = over ? (game.cashedOut ? 'Cashed out' : won ? 'You win' : game.winner === null ? 'Dead heat' : 'They win') : last?.winner === 'you' ? 'Round won' : last?.winner === 'tie' ? 'Dead heat' : 'Round lost';
  return (
    <div className="overlay result">
      <div className="inner">
        <span className="eyebrow">{MODE_INFO[game.mode].title}{game.mode === 'series' ? ` · $${game.stake.toLocaleString('en-US')} each` : ` · round ${game.roundIndex + 1}`}</span>
        <div className={`headline ${won ? 'win' : 'lose'}`}>{headline}</div>
        {last && (
          <div className="scoreboard">
            <div><div className="n money">${last.youScore}</div><div className="who">You</div></div>
            <div className="sub">vs</div>
            <div><div className="n money">${last.botScore}</div><div className="who">{game.bot.name}</div></div>
          </div>
        )}
        {m && m.phase === 'done' && <ShowdownSummary m={m} />}
        {game.mode === 'margin' && (
          <div className="row spread panel">
            <div><div className="eyebrow">Your bankroll</div><div className="bigstat money" style={{ color: last && last.moneyDelta >= 0 ? 'var(--good)' : 'var(--bad)' }}>${game.you.money}</div>{last && <div className="sub">{last.moneyDelta >= 0 ? `+$${last.moneyDelta}` : `−$${-last.moneyDelta}`} this round</div>}</div>
            <div style={{ textAlign: 'right' }}><div className="eyebrow">Theirs</div><div className="money" style={{ fontSize: 24 }}>${game.bot.money}</div></div>
          </div>
        )}
        {over && game.mode === 'series' && <p className="sub">{won ? `You take their $${(game.stake || 100).toLocaleString('en-US')} stake: +$${seriesPrize(game.stake).toLocaleString('en-US')} to your wallet.` : game.winner === null ? 'Both stakes returned.' : `They take your $${(game.stake || 100).toLocaleString('en-US')} stake.`}</p>}
        {m && <div className="row" style={{ gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}><span className="sub">{activeCombos(m.you).map((c) => c.name).join(', ') || 'No combos'}</span></div>}
        {deck && <SetStrip cards={deck.slots.map((x) => x.card).filter((c): c is CardInst => !!c)} />}
        {over ? (
          <>
            <div className="seal">fate seal {game.fate.seal} · {game.history.map((h) => (h.winner === 'you' ? 'W' : 'L')).join('')}</div>
            <div className="ctarow">
              <button className="btn" onClick={() => controller.home()}>Home</button>
              <button className="btn primary glow" onClick={() => controller.restartSame()}>Rematch</button>
            </div>
          </>
        ) : (
          <div className="ctarow">
            <button className="btn ghost small" onClick={() => controller.home()}>Quit</button>
            {game.mode === 'margin' && <button className="btn" onClick={() => controller.cashOut()}>Cash out ${game.you.money}</button>}
            <button className="btn primary glow" onClick={() => controller.continueGame()}>Next round</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** One line per side: what the showdown added on top of the set. */
function ShowdownSummary({ m }: { m: MatchState }) {
  const sd = matchShowdown(m);
  const line = (x: typeof sd.you, name: string) => {
    const parts: string[] = [];
    if (x.home) parts.push(`home ${x.home.def.name}`);
    if (x.homeBonus) parts.push(`home turf +${x.homeBonus}`);
    const ties = x.ties.reduce((t, l) => t + l.n, 0);
    if (ties) parts.push(`${x.ties.length} home ties +${ties}`);
    for (const k of x.homeCombos) parts.push(`${k.name} +${k.bonus}`);
    return parts.length ? `${name}: ${parts.join(' · ')}` : `${name}: no home place`;
  };
  return (
    <div className="sdsummary">
      <span>{line(sd.you, 'You')}</span>
      {sd.bot && <span>{line(sd.bot, m.bot.name)}</span>}
    </div>
  );
}

function SetStrip({ cards }: { cards: CardInst[] }) {
  return (
    <div className="setstrip">
      {cards.map((c) => (
        <Card key={c.uid} def={c.def} className="sm" />
      ))}
    </div>
  );
}
