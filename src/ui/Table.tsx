import { useEffect, useState } from 'react';
import { CARD_BY_ID, CATEGORY_META, MAIN_CATEGORIES } from '../data/cards';
import { comboHints } from '../data/combos';
import { BOT_AVATARS } from '../data/art';
import { PACK_INFO, PACK_PRICES } from '../engine/draft';
import type { Deck, DeckSlot } from '../engine/deck';
import { MODE_INFO } from '../engine/game';
import { hashString } from '../engine/rng';
import { cardValue, sideCombos, sideScore, type SideState } from '../engine/round';
import type { CardDef, CardInst, MainCategory } from '../engine/types';
import { Card } from './Card';
import { Wallet } from './Home';
import { Art, CatIcon, Ui } from './Icon';
import { PackArt, PackTile } from './PackTile';
import { controller, ROW1, ROW2, SERIES_PRIZE, type Snapshot } from './store';

const SPECIAL_IDS = ['sp1', 'sp2', 'sp3'];
const PACK_KINDS: (keyof typeof PACK_PRICES)[] = ['basic', 'enhanced', 'baptized', 'utility'];

export function Table({ s }: { s: Snapshot }) {
  const game = s.game!;
  const solo = game.mode === 'solitaire';
  const phase = game.phase;
  const round = s.round;
  const deck = s.deck;
  const [sel, setSel] = useState<string | null>(null);
  const [swapSlot, setSwapSlot] = useState<string | null>(null);
  useEffect(() => setSel(null), [round?.turnNo, phase]);
  const BotAvatar = BOT_AVATARS[hashString(game.bot.name) % BOT_AVATARS.length];
  const yourTurn = !!round && !round.done && round.turn === 'you' && !s.botThinking;
  const inPlay = phase === 'play';
  const canEdit = phase === 'draft' || phase === 'deck';

  const youScore = round ? sideScore(round.you) : deck?.potential ?? 0;
  const botScore = round ? sideScore(round.bot) : 0;

  const tapYourSlot = (slot: DeckSlot) => {
    if (s.dealing) return;
    if (canEdit) {
      setSwapSlot(slot.slot.id);
      return;
    }
    if (!inPlay || !round || !yourTurn) return;
    const shown = slotCardInPlay(slot, round);
    if (!shown) return;
    if (shown.role === 'alt') {
      controller.swapPlace();
      return;
    }
    if (shown.role === 'hand') {
      if (sel === shown.card.uid) controller.play(shown.card.uid);
      else setSel(shown.card.uid);
    }
  };

  const selectedCard = sel && round ? round.you.hand.find((c) => c.uid === sel) : null;
  const last = round?.events[round.events.length - 1];

  return (
    <div className={`table ${solo ? 'solo' : 'versus'} ${s.dealing ? 'dealing' : ''} phase-${phase} ${inPlay && yourTurn ? 'your-turn' : ''}`}>
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
            {!solo && ` · round ${game.roundIndex + 1}`}
            {game.mode === 'series' && ` · ${game.you.roundsWon}–${game.bot.roundsWon}`}
          </span>
        </div>
        <Wallet amount={s.wallet} />
      </div>

      {!solo && (
        <section className="board bot">
          <header className="boardhead">
            <div className="avatar">
              <BotAvatar />
            </div>
            <div className="who">
              <div className="nm">{game.bot.name}</div>
              <div className="st">{inPlay ? (s.botThinking ? 'thinking…' : `${round?.bot.hand.length ?? 0} concealed`) : s.botStatus}</div>
            </div>
            {game.mode === 'margin' && <div className="bank">${game.bot.money}</div>}
            {inPlay && <ScoreBadge value={botScore} penalty={round?.bot.penalty ?? 0} turn={!!round && !round.done && round.turn === 'bot'} />}
          </header>
          <div className="rows mirrored">
            <div className="slotrow r2">
              {ROW2.map((id, i) => (
                <BotSlot key={id} id={id} i={i} s={s} round={round} />
              ))}
            </div>
            {botHasSpecial(s) && (
              <div className="slotrow r3">
                {SPECIAL_IDS.filter((id) => s.botSlots.includes(id)).map((id, i) => (
                  <BotSlot key={id} id={id} i={i} s={s} round={round} />
                ))}
              </div>
            )}
            <div className="slotrow r1">
              {ROW1.map((id, i) => (
                <BotSlot key={id} id={id} i={i} s={s} round={round} />
              ))}
            </div>
          </div>
          <div className="horizonrow">
            {inPlay && round ? (
              <FieldZone side={round.bot} freshUid={s.lastBotPlayUid} />
            ) : (
              <div className="packrow">
                {s.botPacks.map((p, i) => (
                  <div key={i} className={`pack bot ${p.opened ? 'gone' : 'idle'} deal`} style={{ ['--i' as string]: i }}>
                    <PackArt kind={p.kind} label={p.label} count={p.size} category={p.category} small />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="horizon">
        <div className="line" />
        <div className="center">
          {s.dealing && <span className="ticker">Dealing…</span>}
          {!s.dealing && phase === 'draft' && <DraftTools s={s} />}
          {!s.dealing && phase === 'deck' && (
            <button className="btn primary glow" onClick={() => controller.lockDeck()}>
              <Ui name="lock" /> Lock in · ${deck?.potential ?? 0}
            </button>
          )}
          {inPlay && round && !round.done && (
            selectedCard ? (
              <div className="ctarow">
                <button className="btn ghost small" onClick={() => setSel(null)}>Cancel</button>
                <button className="btn primary glow" onClick={() => controller.play(selectedCard.uid)}>Play {selectedCard.def.name}</button>
              </div>
            ) : (
              <span className="ticker">
                {yourTurn ? <b>Your move</b> : s.botThinking ? `${game.bot.name} is thinking…` : ''}
                {last && !yourTurn && last.kind !== 'flip' && <span className="evt"> · {last.text}</span>}
                {last && yourTurn && last.kind !== 'flip' && <span className="evt"> · {last.text}</span>}
              </span>
            )
          )}
          {inPlay && round?.done && <span className="ticker"><b>{round.result?.winner === 'you' ? 'You take it.' : round.result?.winner === 'bot' ? `${game.bot.name} takes it.` : 'Dead heat.'}</b></span>}
        </div>
      </div>

      <section className="board you">
        <div className="horizonrow">
          {inPlay && round ? (
            <FieldZone side={round.you} />
          ) : (
            <div className="packrow">
              {s.draft?.packs.map((p, i) => (
                <PackTile
                  key={p.id}
                  pack={p}
                  style={{ ['--i' as string]: i }}
                  mirrored={false}
                  state={p.opened && p.picked ? 'gone' : packTargetable(p, s.tool) ? 'targetable' : p.peeked ? 'peeked' : 'idle'}
                  onClick={!(p.opened && p.picked) || s.tool === 'delorean' ? () => controller.tapPack(p.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
        <div className="rows">
          <div className="slotrow r1">
            {deck?.slots.filter((x) => ROW1.includes(x.slot.id)).map((slot, i) => (
              <YouSlot key={slot.slot.id} slot={slot} i={i} round={round} inPlay={inPlay} sel={sel} yourTurn={yourTurn} onTap={() => tapYourSlot(slot)} />
            ))}
          </div>
          {deck && deck.slots.some((x) => SPECIAL_IDS.includes(x.slot.id)) && (
            <div className="slotrow r3">
              {deck.slots.filter((x) => SPECIAL_IDS.includes(x.slot.id)).map((slot, i) => (
                <YouSlot key={slot.slot.id} slot={slot} i={i} round={round} inPlay={inPlay} sel={sel} yourTurn={yourTurn} onTap={() => tapYourSlot(slot)} />
              ))}
            </div>
          )}
          <div className="slotrow r2">
            {deck?.slots.filter((x) => ROW2.includes(x.slot.id)).map((slot, i) => (
              <YouSlot key={slot.slot.id} slot={slot} i={i} round={round} inPlay={inPlay} sel={sel} yourTurn={yourTurn} onTap={() => tapYourSlot(slot)} />
            ))}
          </div>
        </div>
        <header className="boardhead">
          <div className="avatar you">
            <Ui name="you" />
          </div>
          <div className="who">
            <div className="nm">You</div>
            <div className="st">
              {inPlay ? `${round?.you.hand.length ?? 0} in hand` : deck?.combos.length ? deck.combos.map((c) => `${c.name} +${c.bonus}`).join(' · ') : canEdit ? hintText(deck) : ''}
            </div>
          </div>
          {canEdit && deck && deck.bench.length > 0 && (
            <div className="bench" title="Bench">
              {deck.bench.map((c) => (
                <Card key={c.uid} def={c.def} className="tiny" />
              ))}
            </div>
          )}
          {game.mode === 'margin' && <div className="bank">${game.you.money}</div>}
          {inPlay ? <ScoreBadge value={youScore} penalty={round?.you.penalty ?? 0} turn={yourTurn} /> : <ScoreBadge value={deck?.potential ?? 0} penalty={0} turn={false} label="set" />}
        </header>
      </section>

      {phase === 'shop' && <Shop s={s} />}
      {s.opening && s.draft && <Opening s={s} />}
      {s.specialFx && <SpecialFx def={s.specialFx} />}
      {swapSlot && deck && canEdit && <SwapSheet deck={deck} slotId={swapSlot} onClose={() => setSwapSlot(null)} />}
      {(phase === 'roundResult' || phase === 'gameOver') && <ResultOverlay s={s} />}
    </div>
  );
}

function hintText(deck: Deck | null): string {
  if (!deck) return '';
  const ids = deck.slots.map((x) => x.card?.def.id).filter((x): x is string => !!x);
  const h = comboHints(ids)[0];
  if (!h) return 'Tap a slot to swap cards.';
  return `${h.combo.name} needs ${h.missing.map((alts) => alts.map((id) => CARD_BY_ID[id].name).join(' / ')).join(' + ')} (+${h.combo.bonus})`;
}

function botHasSpecial(s: Snapshot) {
  return s.botSlots.some((id) => SPECIAL_IDS.includes(id));
}

function packTargetable(p: { opened: boolean; picked?: string; kind: string }, tool: Snapshot['tool']) {
  if (!tool) return false;
  if (tool === 'delorean') return p.opened && !!p.picked && !p.picked.startsWith('taken');
  return !p.opened && p.kind !== 'baptized';
}

function ScoreBadge({ value, penalty, turn, label }: { value: number; penalty: number; turn: boolean; label?: string }) {
  return (
    <div className={`scorebadge ${turn ? 'turn' : ''}`}>
      {label && <span className="lbl">{label}</span>}
      <span className="money">${value}</span>
      {penalty > 0 && <span className="pen">−{penalty}</span>}
    </div>
  );
}

// ───────────── slots ─────────────
const SLOT_LABEL: Record<string, string> = { place: 'Place', event: 'Happening', flex: 'Place / Event', life1: 'Life', life2: 'Life', stuff1: 'Stuff', stuff2: 'Stuff', stuff3: 'Stuff', idea: 'Idea', sp1: 'Life / Stuff', sp2: 'Idea / Event', sp3: 'Wild' };
const SLOT_CAT: Record<string, MainCategory> = { place: 'places', event: 'happenings', flex: 'places', life1: 'life', life2: 'life', stuff1: 'stuff', stuff2: 'stuff', stuff3: 'stuff', idea: 'ideas', sp1: 'life', sp2: 'ideas', sp3: 'stuff' };

type Shown = { card: CardInst; role: 'hand' | 'scene' | 'alt' | 'set' };

function slotCardInPlay(slot: DeckSlot, round: { you: SideState }): Shown | null {
  const you = round.you;
  if (slot.slot.id === 'place') return you.place ? { card: you.place, role: 'scene' } : null;
  if (slot.slot.id === 'flex' && slot.card?.def.cat === 'places') return you.altPlace ? { card: you.altPlace, role: 'alt' } : null;
  if (!slot.card) return null;
  const inHand = you.hand.find((c) => c.uid === slot.card!.uid);
  return inHand ? { card: inHand, role: 'hand' } : null;
}

function YouSlot({ slot, i, round, inPlay, sel, yourTurn, onTap }: { slot: DeckSlot; i: number; round: Snapshot['round']; inPlay: boolean; sel: string | null; yourTurn: boolean; onTap: () => void }) {
  const id = slot.slot.id;
  let content: React.ReactNode;
  if (inPlay && round) {
    const shown = slotCardInPlay(slot, round);
    if (shown) {
      const canTap = yourTurn && (shown.role === 'hand' || (shown.role === 'alt' && !round.you.swappedPlace));
      content = (
        <Card
          def={shown.card.def}
          selected={sel === shown.card.uid}
          onClick={canTap ? onTap : undefined}
          flags={{ scene: shown.role === 'scene' }}
          badge={shown.role === 'scene' ? 'scene' : shown.role === 'alt' ? (round.you.swappedPlace ? 'used' : 'tap to move') : undefined}
          dim={!canTap && shown.role !== 'scene'}
        />
      );
    } else content = <div className="empty" />;
  } else if (slot.card) {
    content = <Card def={slot.card.def} onClick={onTap} />;
  } else {
    content = (
      <button className={`empty ${slot.slot.special ? 'special' : ''}`} onClick={onTap} aria-label={SLOT_LABEL[id]}>
        <CatIcon cat={SLOT_CAT[id]} />
      </button>
    );
  }
  return (
    <div className={`slot s-${id}`} style={{ ['--i' as string]: i }}>
      {content}
      <span className="slotlabel">{slot.slot.special ? '★ ' : ''}{SLOT_LABEL[id]}</span>
    </div>
  );
}

function BotSlot({ id, i, s, round }: { id: string; i: number; s: Snapshot; round: Snapshot['round'] }) {
  let content: React.ReactNode;
  const inPlay = s.game?.phase === 'play' && round;
  if (inPlay && id === 'place' && round.bot.place) content = <Card def={round.bot.place.def} flags={{ scene: true }} badge="scene" />;
  else if (s.botSlots.includes(id)) content = <Card back backCat={SLOT_CAT[id]} backRarity={1} flags={{ thinking: !!s.botThinking && i === 0 }} className="facedown" />;
  else content = <div className={`empty ${SPECIAL_IDS.includes(id) ? 'special' : ''}`}><CatIcon cat={SLOT_CAT[id]} /></div>;
  return (
    <div className={`slot s-${id}`} style={{ ['--i' as string]: i }}>
      {content}
    </div>
  );
}

function FieldZone({ side, freshUid }: { side: SideState; freshUid?: string | null }) {
  const combos = sideCombos(side);
  return (
    <div className="fieldzone">
      {side.field.length === 0 && <span className="zonehint">{side.side === 'you' ? 'Your plays land here' : 'Their plays land here'}</span>}
      {side.field.map((f) => (
        <Card key={f.inst.uid} def={f.inst.def} className="fieldcard" value={cardValue(f, side.place)} flags={{ halved: f.halved, doubled: f.doubled, stolen: f.stolen, fresh: f.inst.uid === freshUid, flipped: f.inst.uid === freshUid }} />
      ))}
      {combos.length > 0 && <span className="combochip">{combos.map((c) => `${c.name} +${c.bonus}`).join(' · ')}</span>}
    </div>
  );
}

// ───────────── draft tools ─────────────
function DraftTools({ s }: { s: Snapshot }) {
  const d = s.draft!;
  const c = d.charges;
  const left = d.packs.filter((p) => !p.opened || !p.picked).length;
  const any = c.delorean + c.dejavu + c.premonition + c.flashmob > 0;
  return (
    <div className="tools">
      {!any && <span className="ticker">{s.tool ? '' : <>{left} pack{left === 1 ? '' : 's'} to open</>}</span>}
      {c.premonition > 0 && (
        <button className={`tool ${s.tool === 'premonition' ? 'active' : ''}`} onClick={() => controller.setTool('premonition')}>
          <Art id="premonition" /> Peek <i>{c.premonition}</i>
        </button>
      )}
      {c.dejavu > 0 && (
        <button className={`tool ${s.tool === 'dejavu' ? 'active' : ''}`} onClick={() => controller.setTool('dejavu')}>
          <Art id="deja-vu" /> Reroll <i>{c.dejavu}</i>
        </button>
      )}
      {c.delorean > 0 && (
        <button className={`tool ${s.tool === 'delorean' ? 'active' : ''}`} onClick={() => controller.setTool('delorean')}>
          <Art id="delorean" /> Repick <i>{c.delorean}</i>
        </button>
      )}
      {c.flashmob > 0 && (
        <span className="tool passive">
          <Art id="flash-mob" /> +1 card next <i>{c.flashmob}</i>
        </span>
      )}
      {s.tool && <span className="ticker">{s.tool === 'premonition' ? 'Tap a sealed pack to peek' : s.tool === 'dejavu' ? 'Tap a sealed pack to reroll' : 'Tap a picked pack to go back'}</span>}
    </div>
  );
}

// ───────────── opening overlay ─────────────
function Opening({ s }: { s: Snapshot }) {
  const o = s.opening!;
  const pack = s.draft!.packs.find((p) => p.id === o.packId)!;
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => setSel(null), [o.packId]);
  const needsCategory = pack.kind === 'baptized' && !pack.category;
  const selected = sel ? o.cards.find((c) => c.id === sel) : null;
  const n = o.cards.length;
  const allRevealed = o.revealed.length >= n;

  return (
    <div className="overlay opening" onClick={() => o.mode === 'peek' && controller.closeOpening()}>
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
              <span className="eyebrow">{o.mode === 'peek' ? 'Premonition' : `${pack.label} pack`}</span>
              <h2>{o.mode === 'peek' ? 'A glimpse inside' : allRevealed ? 'Pick one to keep' : 'Tap a card to flip it'}</h2>
            </div>
            <div className={`fan n${n}`}>
              {o.cards.map((c, i) => {
                const revealed = o.revealed.includes(c.id);
                const mid = (n - 1) / 2;
                const rot = (i - mid) * (n > 4 ? 7 : 11);
                const lift = Math.abs(i - mid) * 7;
                return (
                  <div key={c.id} className="fanitem" style={{ ['--rot' as string]: `${rot}deg`, ['--lift' as string]: `${lift}px`, ['--i' as string]: i }}>
                    <Card
                      def={c}
                      back={!revealed}
                      backCat={c.cat}
                      backRarity={c.rarity}
                      selected={sel === c.id}
                      flags={{ flipped: revealed }}
                      onClick={o.mode === 'open' ? () => (revealed ? setSel(sel === c.id ? null : c.id) : controller.reveal(c.id)) : undefined}
                    />
                  </div>
                );
              })}
            </div>
            <div className="detail blurbbox">
              {selected ? (
                <>
                  <h3>{selected.name}</h3>
                  <p>{selected.blurb}</p>
                </>
              ) : (
                <p>{o.mode === 'peek' ? 'The pack stays sealed. Tap outside to close.' : allRevealed ? 'Tap a card to choose it.' : 'Cards glow with their tier. The symbol is their category.'}</p>
              )}
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
                <button className="btn primary glow" disabled={!selected} onClick={() => selected && controller.pickCard(pack.id, selected.id)}>
                  Keep{selected ? ` ${selected.name}` : ''}
                </button>
              </div>
            ) : (
              <button className="btn" onClick={() => controller.closeOpening()}>Close</button>
            )}
          </>
        )}
      </div>
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

function SwapSheet({ deck, slotId, onClose }: { deck: Deck; slotId: string; onClose: () => void }) {
  const slot = deck.slots.find((x) => x.slot.id === slotId)!;
  const fits = deck.bench.filter((c) => slot.slot.accepts.includes(c.def.cat as MainCategory));
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="row spread">
          <h2>{SLOT_LABEL[slotId]} slot</h2>
          <button className="hudbtn" onClick={onClose}>✕</button>
        </div>
        {slot.card && (
          <div className="row" style={{ gap: 14 }}>
            <Card def={slot.card.def} className="sm" />
            <div style={{ flex: 1 }}>
              <div><b>{slot.card.def.name}</b></div>
              <p className="sub">{slot.card.def.blurb}</p>
              <button className="btn small ghost" onClick={() => { controller.clearSlot(slotId); onClose(); }}>Bench it</button>
            </div>
          </div>
        )}
        <span className="eyebrow">{fits.length ? 'Swap in from the bench' : 'Nothing on the bench fits here'}</span>
        <div className="benchrow">
          {fits.map((c) => (
            <Card key={c.uid} def={c.def} className="sm" onClick={() => { controller.placeInSlot(slotId, c.uid); onClose(); }} />
          ))}
        </div>
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
        <p className="sub">Your score is the value of the set minus what you spent. The set's value goes back to your wallet.</p>
        <div className="ctarow">
          <button className="btn ghost small" onClick={() => controller.home()}>Back</button>
          <button className="btn primary glow" onClick={() => controller.beginDraft()} disabled={game.spent <= 0}>Deal</button>
        </div>
      </div>
    </div>
  );
}

// ───────────── results ─────────────
function ResultOverlay({ s }: { s: Snapshot }) {
  const game = s.game!;
  const deck = s.deck;
  const last = game.history[game.history.length - 1];
  const over = game.phase === 'gameOver';

  if (game.mode === 'solitaire') {
    const profit = game.you.money - game.spent;
    const best = s.highScores[0] ?? profit;
    return (
      <div className="overlay result">
        <div className="inner">
          <span className="eyebrow">Solitaire</span>
          <div className={`headline ${profit >= 0 ? 'win' : 'lose'}`}>{profit >= 0 ? `+$${profit}` : `−$${-profit}`}</div>
          <p className="sub">Set value ${game.you.money} · spent ${game.spent} · best {best >= 0 ? `+$${best}` : `−$${-best}`}</p>
          {deck && <SetStrip deck={deck} />}
          <div className="ctarow">
            <button className="btn" onClick={() => controller.home()}>Home</button>
            <button className="btn primary glow" onClick={() => controller.restartSame()}>Play again</button>
          </div>
        </div>
      </div>
    );
  }

  const won = over ? game.winner === 'you' : last?.winner === 'you';
  const headline = over ? (game.cashedOut ? 'Cashed out' : won ? 'You win' : 'They win') : last?.winner === 'you' ? 'Round won' : last?.winner === 'tie' ? 'Dead heat' : 'Round lost';
  return (
    <div className="overlay result">
      <div className="inner">
        <span className="eyebrow">{MODE_INFO[game.mode].title} · round {game.roundIndex + 1}</span>
        <div className={`headline ${won ? 'win' : 'lose'}`}>{headline}</div>
        {last && (
          <div className="scoreboard">
            <div><div className="n money">${last.youScore}</div><div className="who">You</div></div>
            <div className="sub">vs</div>
            <div><div className="n money">${last.botScore}</div><div className="who">{game.bot.name}</div></div>
          </div>
        )}
        {game.mode === 'series' && (
          <div className="hist">
            {[0, 1, 2].map((i) => {
              const h = game.history[i];
              return <i key={i} className={h ? (h.winner === 'you' ? 'w' : h.winner === 'bot' ? 'l' : '') : ''} />;
            })}
          </div>
        )}
        {game.mode === 'margin' && (
          <div className="row spread panel">
            <div><div className="eyebrow">Your bankroll</div><div className="bigstat money" style={{ color: last && last.moneyDelta >= 0 ? 'var(--good)' : 'var(--bad)' }}>${game.you.money}</div>{last && <div className="sub">{last.moneyDelta >= 0 ? `+$${last.moneyDelta}` : `−$${-last.moneyDelta}`} this round</div>}</div>
            <div style={{ textAlign: 'right' }}><div className="eyebrow">Theirs</div><div className="money" style={{ fontSize: 24 }}>${game.bot.money}</div></div>
          </div>
        )}
        {over && game.mode === 'series' && <p className="sub">{won ? `+$${SERIES_PRIZE} to your wallet.` : 'Entry fee lost.'}</p>}
        {deck && <SetStrip deck={deck} />}
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

function SetStrip({ deck }: { deck: Deck }) {
  const cards = deck.slots.map((x) => x.card).filter((c): c is CardInst => !!c);
  return (
    <div className="setstrip">
      {cards.map((c) => (
        <Card key={c.uid} def={c.def} className="sm" />
      ))}
    </div>
  );
}
