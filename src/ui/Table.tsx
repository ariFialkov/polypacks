import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CARD_BY_ID, CATEGORY_META, MAIN_CATEGORIES, TIER_META } from '../data/cards';
import { ABILITIES } from '../data/abilities';
import { COMBO_BY_ID, comboHints } from '../data/combos';
import { MINIGAME_BY_ID } from '../data/minigames';
import { BOT_AVATARS } from '../data/art';
import { PACK_INFO, PACK_PRICES, activeCombos, deckOf, matchShowdown, matchTotals, sideScore, unopened, type MPack, type MatchState, type MgEffect, type MinigameOutcome, type Prompt, type SideState } from '../engine/match';
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
import { controller, type AbilityShow, type ComboFlash, type Snapshot } from './store';

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
  if (!pb && s.abilityShow) marks[s.abilityShow.uid] = { kind: 'ability' };
  const pop: ComboFlash | null = pb ? pb.pop : s.comboFlash;
  const lastToast = s.toasts.length ? s.toasts[s.toasts.length - 1] : null;
  // a peek or a tool in hand: the centre lane says which ability and what to do
  const laneHead =
    s.abilityShow || s.opening ? null : prompt?.kind === 'peek' ? (
      <AbilityHead m={m} from={m.promptFrom ?? { card: prompt.source === 'dejavu' ? 'deja-vu' : 'premonition', side: 'you' }} what="Tap a glowing sealed pack to look inside. It stays sealed; you take nothing." lane />
    ) : !prompt && s.tool ? (
      <AbilityHead
        m={m}
        from={{ card: s.tool === 'delorean' ? 'delorean' : 'premonition', side: 'you' }}
        what={s.tool === 'delorean' ? 'Tap a glowing picked pack to reopen it and choose again.' : 'Tap a glowing sealed pack to look inside. It stays sealed.'}
        lane
        onCancel={() => controller.setTool(s.tool)}
      />
    ) : null;
  // final totals (and the winner) stay hidden until the showdown has played out and the round is settled
  const settled = game.phase !== 'match';
  const scoreOf = (w: Side) => (pb ? pb.totals[w] : m.phase === 'done' && settled ? matchTotals(m)[w] : sideScore(w === 'you' ? m.you : m.bot));

  // card size follows what is on the table: slot rows (portrait) and cards per line (landscape)
  const hasSpecial = (d: ReturnType<typeof deckOf> | null) => !!d && d.slots.some((x) => SPECIAL_IDS.includes(x.slot.id));
  const youRows = 2 + (hasSpecial(youDeck) ? 1 : 0);
  const botRows = solo ? 1 : 2 + (hasSpecial(botDeck) ? 1 : 0);
  const cols = Math.max(9 + (hasSpecial(youDeck) ? 3 : 0), solo ? 0 : 9 + (hasSpecial(botDeck) ? 3 : 0));
  const tableVars = { ['--rows' as string]: youRows + botRows, ['--cols' as string]: cols };
  const horizonVars = (ss: SideState) => ({ ['--np' as string]: ss.packs.length, ['--ash' as string]: ss.graveyard.some((c) => c.uid !== ss.catPair?.underUid) ? 1 : 0 });
  return (
    <div className={`table ${solo ? 'solo' : 'versus'} ${s.dealing ? 'dealing' : ''} phase-${m.phase} ${yourTurn ? 'your-turn' : ''}`} style={tableVars}>
      <Hud s={s} />

      {!solo && botDeck && (
        <section className="board bot">
          <header className="boardhead">
            <div className="avatar">
              <BotAvatar />
            </div>
            {pop?.side === 'bot' ? (
              <ComboPop pop={pop} />
            ) : (
              <div className="who">
                <div className="nm">{game.bot.name}</div>
                <div className="st">{s.botBusy ? s.botStatus : m.phase === 'draft' ? `${unopened(m.bot).length} packs left · ${s.botStatus}` : 'done'}</div>
              </div>
            )}
            {game.mode === 'margin' && <div className="bank">${game.bot.money}</div>}
            {pop?.side !== 'bot' && <ComboChips side={m.bot} />}
            <ScoreBadge key={m.seed} value={scoreOf('bot')} turn={m.turn === 'bot' && m.phase === 'draft'} />
          </header>
          <div className="rows mirrored">
            <SlotRow ids={ROW2} deck={botDeck} side={m.bot} m={m} fresh={s.freshUids} marks={marks} />
            {botDeck.slots.some((x) => SPECIAL_IDS.includes(x.slot.id)) && <SlotRow ids={SPECIAL_IDS} deck={botDeck} side={m.bot} m={m} fresh={s.freshUids} marks={marks} special />}
            <SlotRow ids={ROW1} deck={botDeck} side={m.bot} m={m} fresh={s.freshUids} marks={marks} />
          </div>
          <div className="horizonrow" style={horizonVars(m.bot)}>
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
          {!s.dealing && lastToast && !pb && (
            <span className={`ticker toastline ${lastToast.tone ?? ''}`} key={lastToast.id}>
              {lastToast.text}
            </span>
          )}
          {!s.dealing && !lastToast && m.phase === 'draft' && laneHead}
          {!s.dealing && !lastToast && m.phase === 'draft' && !laneHead && <TurnBar s={s} m={m} yourTurn={yourTurn} prompt={prompt} youLeft={youLeft} />}
          {pb?.skip}
          {pb?.verdict}
          {!pb && !lastToast && m.phase !== 'draft' && !settled && <span className="ticker">Final tally…</span>}
          {!pb && !lastToast && m.phase !== 'draft' && settled && m.result && (
            <span className="ticker">
              <b>{solo ? `Set value $${m.result.youScore}` : m.result.winner === 'you' ? 'You take it.' : m.result.winner === 'bot' ? `${game.bot.name} takes it.` : 'Dead heat.'}</b>
            </span>
          )}
        </div>
      </div>

      <section className="board you">
        <div className="horizonrow" style={horizonVars(m.you)}>
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
          {pop?.side === 'you' ? (
            <ComboPop pop={pop} />
          ) : (
            <div className="who">
              <div className="nm">You</div>
              <div className="st">{homeText(m.you) ?? hintText(m.you)}</div>
            </div>
          )}
          {youDeck.bench.length > 0 && (
            <div className="bench" title="Bench">
              {youDeck.bench.map((c) => (
                <Card key={c.uid} def={c.def} className="tiny" />
              ))}
            </div>
          )}
          {game.mode === 'margin' && <div className="bank">${game.you.money}</div>}
          {pop?.side !== 'you' && <ComboChips side={m.you} />}
          <ScoreBadge key={m.seed} value={scoreOf('you')} turn={yourTurn} label="set" />
        </header>
      </section>

      {s.opening && <Opening s={s} m={m} />}
      {s.specialFx && <SpecialFx def={s.specialFx} />}
      {prompt && prompt.kind !== 'peek' && !s.opening && !s.abilityShow && <PromptOverlay prompt={prompt} m={m} />}
      {s.abilityShow && <AbilityBanner show={s.abilityShow} m={m} />}
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

/** Counts quickly up or down to `value`, like a digital counter, instead of jumping to it. */
function useRolling(value: number): { shown: number; dir: 'up' | 'down' | null } {
  const [shown, setShown] = useState(value);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);
  const cur = useRef(value);
  useEffect(() => {
    const from = cur.current;
    if (from === value) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      cur.current = value;
      setShown(value);
      return;
    }
    const dur = Math.min(1100, 380 + Math.abs(value - from) * 10);
    const t0 = performance.now();
    let raf = 0;
    setDir(value > from ? 'up' : 'down');
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      cur.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDir(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return { shown, dir };
}

function ScoreBadge({ value, turn, label }: { value: number; turn: boolean; label?: string }) {
  const d = useDelta(value);
  const roll = useRolling(value);
  return (
    <div className={`scorebadge ${turn ? 'turn' : ''}`}>
      {label && <span className="lbl">{label}</span>}
      <span className={`money rolling ${roll.dir ?? ''}`}>${roll.shown}</span>
      {d && (
        <span key={d.k} className={`scoredelta inline ${d.n > 0 ? 'up' : 'down'}`}>
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
    <section className={`miniboard ${you ? 'you' : 'bot'}`} onClick={(e) => e.stopPropagation()} style={{ ['--cells' as string]: ROW1.length + specials.length + ROW2.length, ['--rowcells' as string]: Math.max(ROW1.length + specials.length, ROW2.length) }}>
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
    <div className={`combopop ${pop.home ? 'is-home' : ''}`} key={pop.key}>
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
  // compact: the last two destroyed cards and a count for the rest
  const shown = ashes.slice(-2);
  return (
    <div className="ashes" title={`Destroyed: ${ashes.map((c) => c.def.name).join(', ')}`}>
      <span className="lbl">gone</span>
      {shown.map((c) => (
        <Card key={c.uid} def={c.def} className="tiny" dim />
      ))}
      {ashes.length > shown.length && <span className="more">+{ashes.length - shown.length}</span>}
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
  if (prompt?.kind === 'peek') return <span className="ticker"><b>{prompt.source === 'dejavu' ? 'Seen It' : 'Premonition'}</b> · tap a glowing pack</span>;
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
                    <Card def={c} back={!revealed} backCat={c.cat} backRarity={c.rarity} selected={o.firstPick === c.id} flags={{ flipped: revealed }} onClick={o.mode === 'open' ? () => tap(c, revealed) : undefined} badge={revealed && c.ability ? ABILITIES[c.ability].name : undefined}
                      overlay={
                        combo || extras.homeCombo || extras.homeTie ? (
                          <>
                            {combo && (
                              <span className="combotag">
                                {combo.name} <b>+{combo.bonus}</b>
                              </span>
                            )}
                            {extras.homeCombo && (
                              <span className="combotag is-home">
                                Home: {extras.homeCombo.name} <b>+{extras.homeCombo.bonus}</b>
                              </span>
                            )}
                            {extras.homeTie && <span className="hometag">fits home +{HOME_TIE}</span>}
                          </>
                        ) : undefined
                      }
                    />
                    {gain !== null && <span className={`gaintag ${gain > 0 ? 'up' : gain < 0 ? 'down' : 'flat'}`}>{gain > 0 ? `+${gain}` : gain < 0 ? `−${-gain}` : '+0'}</span>}
                  </div>
                );
              })}
            </div>
            <div className="detail blurbbox">
              {o.cards.some((c) => o.revealed.includes(c.id)) && <HoldHint />}
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
        {m.promptFrom && <AbilityHead m={m} from={m.promptFrom} what={PROMPT_HOWTO[prompt.kind === 'area51' ? `area51-${prompt.mode}` : prompt.kind] ?? title} />}
        {!m.promptFrom && <span className="eyebrow">{eyebrow}</span>}
        <div className="detail">
          <h2>{title}</h2>
        </div>
        {body}
        <HoldHint />
      </div>
    </div>
  );
}

/** What to do for each ability prompt, in one line. */
const PROMPT_HOWTO: Record<string, string> = {
  bitcoin: 'Choose: spend it on an extra Enhanced pack, or keep it in your set.',
  flamethrower: 'Tap one of their cards to burn it. It is gone for good.',
  'area51-initial': 'Tap one of your cards to protect and hide it, or save the protection for your next pick.',
  'area51-pack': 'Protect this card now, or wait and protect a later pick.',
  pentagon: 'Their Communism is gone. Take the Military Coup if you want it.',
  coup: 'Tap the card of theirs to take, then the card of yours you give up.',
  trolley: 'Pull the lever: remove their lowest card, or one of their sealed Basic packs.',
  wedding: 'Tap the combo of theirs to cancel.',
  defib: 'Tap one of your destroyed cards to bring it back.',
  postnut: 'Trade your weakest card for a random card of its category, or keep it.',
  pretty: 'Tap one of their cards to take it.',
  dui: 'Their checkpoint caught you. Tap the group you give up.',
};

/** A blinking header: which ability, from whose card, and what to do now. */
function AbilityHead({ m, from, what, lane, onCancel }: { m: MatchState; from: { card: string; side: Side }; what: string; lane?: boolean; onCancel?: () => void }) {
  const def = CARD_BY_ID[from.card];
  const ab = def?.ability ? ABILITIES[def.ability] : null;
  if (!def) return null;
  const owner = from.side === 'you' ? 'your' : `${m.bot.name}'s`;
  return (
    <div className={`abilityhead ${lane ? 'lane' : ''} ${from.side}`}>
      <div className="line1">
        <span className="tag">ability</span>
        <b>{ab?.name ?? def.name}</b>
        <span className="src">
          from {owner} {def.name}
        </span>
      </div>
      <div className="line2">
        {what}
        {onCancel && (
          <button className="linkbtn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/** The hint for the hold-to-read mechanic. */
function HoldHint() {
  return (
    <div className="holdhint">
      <span className="ring" /> Hold any card to read its ability
    </div>
  );
}

/** An ability firing: its card pulses on the board, then the name sweeps across the screen. */
function AbilityBanner({ show, m }: { show: AbilityShow; m: MatchState }) {
  const def = CARD_BY_ID[show.card];
  const ab = def?.ability ? ABILITIES[def.ability] : null;
  if (!def || !ab) return null;
  const owner = show.side === 'you' ? 'Your' : `${m.bot.name}'s`;
  return (
    <div className={`abilitybanner ${show.side}`} key={show.key}>
      <div className="band">
        <span className="who">
          {owner} {def.name}
        </span>
        <b>{ab.name}</b>
        <span className="what">{ab.text}</span>
      </div>
    </div>
  );
}

// ───────────── minigame ─────────────
const MG_STAMP: Record<MgEffect['kind'], string> = { lost: 'Destroyed', stolen: 'Stolen', saved: 'Protected', safe: 'Survives' };
const MG_STEP = 420; // ms between card results

function MinigameOverlay({ mg, m }: { mg: MinigameOutcome; m: MatchState }) {
  const [stage, setStage] = useState<'intro' | 'roll' | 'done'>('intro');
  const effects = mg.effects ?? [];
  const hasRoll = mg.threshold > 0;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setStage('intro');
    setReady(false);
    const rollAt = 1100;
    const doneAt = hasRoll ? 2900 : 2300;
    const t = [setTimeout(() => setStage('roll'), rollAt), setTimeout(() => setStage('done'), doneAt), setTimeout(() => setReady(true), doneAt + 500 + effects.length * MG_STEP)];
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mg.n, mg.id]);
  const def = MINIGAME_BY_ID[mg.id];
  const sideName = (sd: Side) => (sd === 'you' ? 'You' : m.bot.name);
  const setName = (sd: Side) => (sd === 'you' ? 'your set' : `${m.bot.name}'s set`);
  const done = stage === 'done';
  const effectOf = (uid?: string) => (uid ? effects.findIndex((e) => e.uid === uid) : -1);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const outcomeLabels: Record<string, [string, string]> = {
    'fish-on': ['Landed', 'Got away'],
    'crime-pays': ['Heist works', 'Busted'],
  };
  const [lw, rw] = outcomeLabels[mg.id] ?? [`${mg.left.label} wins`, `${mg.right.label} wins`];

  /** a card at stake: plays its result (destroyed, stolen, ...) once the roll is in */
  const staked = (cardId: string, owner: Side, idx: number, extra?: ReactNode) => {
    const e = idx >= 0 ? effects[idx] : null;
    const show = done && !!e;
    const thief = e?.kind === 'stolen' ? (e.side === 'you' ? 'bot' : 'you') : null;
    const note = !e ? null : e.kind === 'lost' ? `Removed from ${setName(owner)}` : e.kind === 'stolen' ? `Moves to ${setName(thief!)}` : e.kind === 'saved' ? 'Protected: nothing lost' : null;
    return (
      <div className={`mgcard ${show ? `fx-${e!.kind}` : ''} ${thief ? `to-${thief}` : ''}`} style={{ ['--d' as string]: `${Math.max(0, idx) * MG_STEP}ms` }}>
        <div className="mgcard-art">
          <Card def={CARD_BY_ID[cardId]} />
          {show && <span className={`mgstamp ${e!.kind}`}>{MG_STAMP[e!.kind]}</span>}
        </div>
        {e?.odds !== undefined && <span className="mgodds">{pct(e.odds)} to survive</span>}
        {extra}
        {mg.id !== 'act-of-god' && <span className={`mgnote ${show ? 'on' : ''} ${e?.kind ?? ''}`}>{note ?? '\u00a0'}</span>}
      </div>
    );
  };

  const contender = (c: MinigameOutcome['left'], other: MinigameOutcome['left']) => {
    const won = done && mg.winner === c.side && c.side !== other.side;
    const lost = done && mg.winner !== 'none' && mg.winner !== c.side;
    const who = <span className="who">{sideName(c.side)}</span>;
    return (
      <div className={`contender ${won ? 'won' : ''} ${lost ? 'lost' : ''}`}>
        {c.cardId ? (
          staked(c.cardId, c.side, effectOf(c.uid), who)
        ) : c.crew ? (
          <>
            <div className="mgcrew">
              {c.crew.map((id) => (
                <Card key={id} def={CARD_BY_ID[id]} className="tiny" />
              ))}
            </div>
            <span className="who">{c.label}</span>
          </>
        ) : (
          <>
            <div className="sideblob">{c.label}</div>
            <span className="who">{'\u00a0'}</span>
          </>
        )}
      </div>
    );
  };

  // effects whose card is not already on show as a contender (a heist's loot, a seized crime card)
  const contenderUids = [mg.left.uid, mg.right.uid].filter(Boolean);
  const loose = mg.id === 'act-of-god' ? [] : effects.map((e, i) => ({ e, i })).filter(({ e }) => !contenderUids.includes(e.uid));
  const delta = mg.delta;
  const deltaLine =
    delta &&
    (['you', 'bot'] as Side[])
      .filter((w) => delta[w] !== 0)
      .map((w) => (
        <span key={w} className={delta[w] > 0 ? 'up' : 'down'}>
          {w === 'you' ? 'Your set' : `${m.bot.name}'s set`} {delta[w] > 0 ? '+' : '−'}${Math.abs(delta[w])}
        </span>
      ));

  return (
    <div className={`overlay minigame ${stage} mg-${mg.id}`}>
      <div className="inner">
        <span className="eyebrow">Minigame</span>
        <h2 className="mgtitle">{def?.name ?? mg.title}</h2>
        {def && (
          <p className="mgstakes">
            <b>At stake:</b> {def.stakes}
          </p>
        )}
        {mg.id === 'act-of-god' ? (
          <div className="mgquake">
            {mg.source && (
              <div className="mgsource">
                <Card def={CARD_BY_ID[mg.source.cardId]} className="tiny" />
                <span className="who">
                  {CARD_BY_ID[mg.source.cardId]?.name} hits
                  <br />
                  <small>played by {sideName(mg.source.side)}</small>
                </span>
              </div>
            )}
            {(['you', 'bot'] as Side[]).map((w) => {
              const mine = effects.map((e, i) => ({ e, i })).filter(({ e }) => e.side === w);
              return (
                <div key={w} className="mgplaces">
                  <span className="eyebrow">{w === 'you' ? 'Your places' : `${m.bot.name}'s places`}</span>
                  <div className="mgrow">{mine.map(({ e, i }) => <div key={e.uid}>{staked(e.cardId, w, i)}</div>)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="faceoff">
            {contender(mg.left, mg.right)}
            <div className="vs">VS</div>
            {contender(mg.right, mg.left)}
          </div>
        )}
        {hasRoll && (
          <div className="rollwrap">
            <div className="rollbar">
              <div className="zone" style={{ width: `${mg.threshold * 100}%` }} />
              <div className={`needle ${stage !== 'intro' ? 'go' : ''}`} style={{ ['--to' as string]: `${mg.roll * 100}%` }} />
            </div>
            <div className="rolllbls">
              <span className={done && mg.roll < mg.threshold ? 'hit' : ''}>◀ {lw} {pct(mg.threshold)}</span>
              <span className={done && mg.roll >= mg.threshold ? 'hit' : ''}>{rw} {pct(1 - mg.threshold)} ▶</span>
            </div>
          </div>
        )}
        {loose.length > 0 && (
          <div className="mgloose">
            {loose.map(({ e, i }) => (
              <div key={e.uid} className="mgtransfer">
                {e.kind === 'stolen' && <span className="from">{sideName(e.side)}</span>}
                {staked(e.cardId, e.side, i)}
                {e.kind === 'stolen' && <span className="to">{sideName(e.side === 'you' ? 'bot' : 'you')}</span>}
              </div>
            ))}
          </div>
        )}
        <div className={`mgresult ${done ? 'show' : ''}`}>{mg.text}</div>
        <div className={`mgdelta ${ready ? 'show' : ''}`}>{deltaLine && deltaLine.length ? deltaLine : <span>No change to either set</span>}</div>
        <button className="btn primary glow" disabled={!ready} onClick={() => controller.ackMinigame()}>
          Continue
        </button>
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
