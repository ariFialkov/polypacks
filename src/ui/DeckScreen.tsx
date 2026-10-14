import { useState } from 'react';
import { comboHints } from '../data/combos';
import { CARD_BY_ID } from '../data/cards';
import type { Deck } from '../engine/deck';
import type { GameState } from '../engine/game';
import type { MainCategory } from '../engine/types';
import { Card } from './Card';
import { controller } from './store';

export function DeckScreen({ game, deck }: { game: GameState; deck: Deck }) {
  const [hot, setHot] = useState<string | null>(null); // slot awaiting a bench card
  const filled = deck.slots.filter((s) => s.card).length;
  const ids = deck.slots.map((s) => s.card?.def.id).filter((x): x is string => !!x);
  const hints = comboHints(ids).slice(0, 3);
  const hotSlot = hot ? deck.slots.find((s) => s.slot.id === hot) : null;
  const benchFor = hotSlot ? deck.bench.filter((c) => hotSlot.slot.accepts.includes(c.def.cat as MainCategory)) : deck.bench;

  return (
    <div className="screen">
      <div className="topbar">
        <div className="title">
          <span className="eyebrow">Round {game.roundIndex + 1} · build your set</span>
          <h1>Your set</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="eyebrow">Set value</div>
          <div className="money" style={{ fontSize: 22 }}>${deck.potential}</div>
        </div>
      </div>
      <div className="scroll stack">
        <p className="sub">
          {hot ? 'Pick a card from the bench for this slot, or tap the slot again to cancel.' : 'Auto-built for the highest value. Tap a slot to swap in a benched card. Places set your scene; happenings stay hidden until you play them.'}
        </p>
        <div className="slots">
          {deck.slots.map((s) => (
            <div key={s.slot.id} className={`slot ${hot === s.slot.id ? 'hot' : ''}`}>
              {s.card ? (
                <Card def={s.card.def} size="sm" selected={hot === s.slot.id} onClick={() => setHot(hot === s.slot.id ? null : s.slot.id)} />
              ) : (
                <button className={`empty ${s.slot.special ? 'special' : ''}`} onClick={() => setHot(hot === s.slot.id ? null : s.slot.id)}>
                  +
                </button>
              )}
              <div className="label">
                {s.slot.special ? '★ ' : ''}
                {s.slot.label}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Bench {hotSlot ? `· fits ${hotSlot.slot.label}` : ''}
          </div>
          {benchFor.length === 0 ? (
            <p className="sub">{hotSlot ? 'Nothing on the bench fits this slot.' : 'Every card made the cut.'}</p>
          ) : (
            <div className="bench">
              {benchFor.map((c) => (
                <Card
                  key={c.uid}
                  def={c.def}
                  size="sm"
                  onClick={
                    hot
                      ? () => {
                          controller.placeInSlot(hot, c.uid);
                          setHot(null);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
          {hotSlot?.card && (
            <button
              className="btn small ghost"
              onClick={() => {
                controller.clearSlot(hot!);
                setHot(null);
              }}
            >
              Bench {hotSlot.card.def.name}
            </button>
          )}
        </div>

        <div className="stack" style={{ gap: 6 }}>
          <div className="eyebrow">Combos</div>
          {deck.combos.length === 0 && hints.length === 0 && <p className="sub">No combos yet.</p>}
          {deck.combos.map((c) => (
            <div className="combo" key={c.id}>
              <span>
                ✅ {c.name}
                {c.unlock ? ' · unlocks a special slot' : ''}
              </span>
              <b>+{c.bonus}</b>
            </div>
          ))}
          {hints.map((h) => (
            <div className="combo hint" key={h.combo.id}>
              <span>
                {h.combo.name} · needs {h.missing.map((alts) => alts.map((id) => CARD_BY_ID[id].name).join(' / ')).join(' + ')}
              </span>
              <b>+{h.combo.bonus}</b>
            </div>
          ))}
        </div>

        <button className="btn primary block" onClick={() => controller.lockDeck()} disabled={filled === 0}>
          Lock in and play
        </button>
      </div>
    </div>
  );
}
