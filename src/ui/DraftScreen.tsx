import { useEffect, useState } from 'react';
import { CARD_BY_ID, CATEGORY_META, MAIN_CATEGORIES } from '../data/cards';
import type { GameState } from '../engine/game';
import type { DraftState, Pack } from '../engine/draft';
import type { MainCategory } from '../engine/types';
import { setPotential } from '../engine/deck';
import { Card } from './Card';
import { controller, type BotDraft, type OpeningPack } from './store';

const HUES: Record<Pack['kind'], number> = { basic: 260, enhanced: 300, baptized: 45, category: 190, mystery: 20, redemption: 120 };
const GLYPHS: Record<Pack['kind'], string> = { basic: '🎴', enhanced: '💎', baptized: '🕊️', category: '🧰', mystery: '❓', redemption: '🎟️' };

export function DraftScreen({ game, draft, opening, botDraft, tool }: { game: GameState; draft: DraftState; opening: OpeningPack | null; botDraft: BotDraft | null; tool: string | null }) {
  const remaining = draft.packs.filter((p) => !p.opened || !p.picked).length;
  const charges = draft.charges;
  const potential = setPotential(draft.picks);
  return (
    <div className="screen">
      <div className="topbar">
        <div className="title">
          <span className="eyebrow">
            {game.mode === 'solitaire' ? 'Solitaire' : `Round ${game.roundIndex + 1}`} · {remaining} pack{remaining === 1 ? '' : 's'} left
          </span>
          <h1>Open your packs</h1>
        </div>
        <div className="row">
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Set value</div>
            <div className="money" style={{ fontSize: 20 }}>${potential}</div>
          </div>
          <button className="iconbtn" onClick={() => controller.home()} aria-label="Quit">
            ✕
          </button>
        </div>
      </div>

      {botDraft && (
        <div className="opp">
          <div className="av">{game.bot.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 6 }}>
              <span className="dot" />
              <b>{game.bot.name}</b> <span className="sub">{botDraft.status}</span>
            </div>
            <div className="bar">
              <i style={{ width: `${(botDraft.opened / botDraft.total) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {(charges.delorean > 0 || charges.dejavu > 0 || charges.premonition > 0 || charges.flashmob > 0) && (
        <div className="tools">
          {charges.premonition > 0 && (
            <button className={`tool ${tool === 'premonition' ? 'active' : ''}`} onClick={() => controller.setTool('premonition')}>
              🔮 Premonition <span className="n">{charges.premonition}</span>
            </button>
          )}
          {charges.dejavu > 0 && (
            <button className={`tool ${tool === 'dejavu' ? 'active' : ''}`} onClick={() => controller.setTool('dejavu')}>
              🔁 Déjà Vu <span className="n">{charges.dejavu}</span>
            </button>
          )}
          {charges.delorean > 0 && (
            <button className={`tool ${tool === 'delorean' ? 'active' : ''}`} onClick={() => controller.setTool('delorean')}>
              🚗 DeLorean <span className="n">{charges.delorean}</span>
            </button>
          )}
          {charges.flashmob > 0 && (
            <span className="tool dis" style={{ opacity: 1 }}>
              💃 Flash Mob next <span className="n">{charges.flashmob}</span>
            </span>
          )}
        </div>
      )}
      {tool && (
        <p className="sub" style={{ margin: '0 0 10px' }}>
          {tool === 'premonition' && 'Tap an unopened pack to peek inside.'}
          {tool === 'dejavu' && 'Tap an unopened pack to reroll its contents.'}
          {tool === 'delorean' && 'Tap a pack you already picked from to go back and choose again.'}
        </p>
      )}

      <div className="scroll">
        <div className="packs">
          {draft.packs.map((p) => (
            <PackTile key={p.id} pack={p} tool={tool} />
          ))}
        </div>
        {draft.picks.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Your picks
            </div>
            <div className="bench">
              {draft.picks.map((c) => (
                <Card key={c.uid} def={c.def} size="sm" />
              ))}
              {draft.trophies.map((t, i) => (
                <Card key={`t${i}`} def={t} size="sm" dim />
              ))}
            </div>
          </div>
        )}
      </div>

      {opening && <Opening opening={opening} pack={draft.packs.find((p) => p.id === opening.packId)!} />}
    </div>
  );
}

function PackTile({ pack, tool }: { pack: Pack; tool: string | null }) {
  const targetable =
    (tool === 'premonition' && !pack.opened && pack.kind !== 'baptized') ||
    (tool === 'dejavu' && !pack.opened && pack.kind !== 'baptized') ||
    (tool === 'delorean' && pack.opened && !!pack.picked && !pack.picked.startsWith('taken'));
  const picked = pack.picked && !pack.picked.startsWith('taken') && pack.picked !== 'none' ? CARD_BY_ID[pack.picked] : null;
  const taken = pack.picked?.startsWith('taken');
  const cls = ['pack', pack.opened && pack.picked ? 'opened' : '', pack.locked ? 'locked' : '', targetable ? 'targetable' : '', pack.peeked && !pack.opened ? 'peeked' : ''];
  return (
    <button className={cls.join(' ')} style={{ ['--hue' as string]: HUES[pack.kind] }} onClick={() => controller.tapPack(pack.id)}>
      {picked ? (
        <div className="pickedcard">
          <Card def={picked} size="xs" />
        </div>
      ) : (
        <span className="glyph">{taken ? '😈' : pack.opened ? '👀' : GLYPHS[pack.kind]}</span>
      )}
      <div className="kind">{pack.label}</div>
      <div className="meta">{taken ? 'Taken' : pack.opened && pack.picked ? 'Picked' : pack.opened ? 'Choose a card' : pack.peeked ? 'Peeked' : `${pack.size} card${pack.size === 1 ? '' : 's'}`}</div>
    </button>
  );
}

function Opening({ opening, pack }: { opening: OpeningPack; pack: Pack }) {
  const [stage, setStage] = useState<'tear' | 'cards'>(opening.cards.length ? 'tear' : 'cards');
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => {
    setStage(opening.cards.length ? 'tear' : 'cards');
    setSel(null);
    const t = setTimeout(() => setStage('cards'), 650);
    return () => clearTimeout(t);
  }, [opening.packId, opening.cards.length]);

  const needsCategory = pack.kind === 'baptized' && !pack.category;
  const selected = sel ? opening.cards.find((c) => c.id === sel) : null;

  return (
    <div className="overlay" onClick={() => opening.mode === 'peek' && controller.closeOpening()}>
      <div className="inner" onClick={(e) => e.stopPropagation()}>
        {needsCategory ? (
          <>
            <div className="detail">
              <h2>Baptize this pack</h2>
              <div className="blurb">Choose a category. One blessed card from it is yours.</div>
            </div>
            <div className="catgrid">
              {MAIN_CATEGORIES.map((cat) => (
                <button key={cat} className="btn" style={{ ['--hue' as string]: CATEGORY_META[cat].hue }} onClick={() => controller.tapPack(pack.id, cat as MainCategory)}>
                  {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
                </button>
              ))}
            </div>
            <button className="btn ghost" onClick={() => controller.closeOpening()}>
              Not yet
            </button>
          </>
        ) : stage === 'tear' ? (
          <div className="pack tear" style={{ ['--hue' as string]: HUES[pack.kind] }}>
            <span className="glyph">{GLYPHS[pack.kind]}</span>
            <div className="kind">{pack.label}</div>
          </div>
        ) : (
          <>
            <div className="detail">
              <span className="eyebrow">{opening.mode === 'peek' ? 'Premonition' : pack.label}</span>
              <h2>{opening.mode === 'peek' ? 'A glimpse inside' : 'Pick one'}</h2>
            </div>
            <div className="reveal">
              {opening.cards.map((c, i) => (
                <Card key={c.id} def={c} size={opening.cards.length <= 2 ? 'lg' : 'md'} style={{ animationDelay: `${i * 0.12}s` }} selected={sel === c.id} onClick={opening.mode === 'open' ? () => setSel(c.id) : undefined} />
              ))}
            </div>
            {selected ? (
              <div className="detail">
                <h2>
                  {selected.emoji} {selected.name}
                </h2>
                <div className="blurb">{selected.blurb}</div>
              </div>
            ) : (
              <div className="detail">
                <div className="blurb">{opening.mode === 'peek' ? 'Tap anywhere to close. The pack stays sealed.' : 'Tap a card to see it. Tap keep to take it.'}</div>
              </div>
            )}
            {opening.mode === 'open' ? (
              <div className="row" style={{ width: '100%' }}>
                <button className="btn ghost" onClick={() => controller.closeOpening()}>
                  Later
                </button>
                <button className="btn primary" style={{ flex: 1 }} disabled={!selected} onClick={() => selected && controller.pickCard(pack.id, selected.id)}>
                  Keep {selected ? selected.name : ''}
                </button>
              </div>
            ) : (
              <button className="btn block" onClick={() => controller.closeOpening()}>
                Close
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
