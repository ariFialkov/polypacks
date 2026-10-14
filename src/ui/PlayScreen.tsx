import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '../engine/game';
import { cardValue, sideCombos, sideScore, type RoundState, type SideState } from '../engine/round';
import { Card } from './Card';
import { controller } from './store';

export function PlayScreen({ game, round, botThinking, lastBotPlayUid }: { game: GameState; round: RoundState; botThinking: boolean; lastBotPlayUid: string | null }) {
  const youScore = sideScore(round.you);
  const botScore = sideScore(round.bot);
  const yourTurn = round.turn === 'you' && !round.done && !botThinking;
  const last = round.events[round.events.length - 1];
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => setSel(null), [round.turnNo]);

  return (
    <div className="screen wide" style={{ paddingTop: 'calc(var(--safe-top) + 10px)' }}>
      <div className="topbar" style={{ paddingBottom: 8 }}>
        <div className="title">
          <span className="eyebrow">
            {game.mode === 'series' ? `Round ${game.roundIndex + 1} · ${game.you.roundsWon}–${game.bot.roundsWon}` : `Round ${game.roundIndex + 1} · you $${game.you.money} · them $${game.bot.money}`}
          </span>
          <h2>{round.done ? 'Round over' : yourTurn ? 'Your move' : botThinking ? `${game.bot.name} is thinking…` : 'Waiting…'}</h2>
        </div>
        <button className="iconbtn" onClick={() => controller.home()} aria-label="Quit">
          ✕
        </button>
      </div>
      <div className="table">
        <SidePanel side={round.bot} score={botScore} avatar={game.bot.avatar} isTurn={round.turn === 'bot' && !round.done} thinking={botThinking} freshUid={lastBotPlayUid} />
        <div className="ticker">{last ? <span dangerouslySetInnerHTML={{ __html: bold(last.text) }} /> : null}</div>
        <SidePanel side={round.you} score={youScore} avatar="🫵" isTurn={yourTurn} you selected={sel} onSelect={setSel} />
      </div>
      {sel && yourTurn && (
        <div className="row" style={{ paddingTop: 8 }}>
          <button className="btn ghost" onClick={() => setSel(null)}>
            Cancel
          </button>
          <button className="btn primary" style={{ flex: 1 }} onClick={() => controller.play(sel)}>
            Play {round.you.hand.find((c) => c.uid === sel)?.def.name}
          </button>
        </div>
      )}
    </div>
  );
}

function bold(s: string) {
  return s.replace(/^([^ ]+)/, '<b>$1</b>');
}

function SidePanel({
  side,
  score,
  avatar,
  isTurn,
  thinking,
  you,
  selected,
  onSelect,
  freshUid,
}: {
  side: SideState;
  score: number;
  avatar: string;
  isTurn: boolean;
  thinking?: boolean;
  you?: boolean;
  selected?: string | null;
  onSelect?: (uid: string | null) => void;
  freshUid?: string | null;
}) {
  const combos = sideCombos(side);
  const prev = useRef(score);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  useEffect(() => {
    if (score !== prev.current) {
      setFlash(score > prev.current ? 'up' : 'down');
      prev.current = score;
      const t = setTimeout(() => setFlash(null), 700);
      return () => clearTimeout(t);
    }
  }, [score]);
  const canSwap = you && !!side.altPlace && !side.swappedPlace && isTurn;
  const fieldSorted = useMemo(() => side.field, [side.field]);

  return (
    <div className={`side ${you ? 'you' : 'bot'} ${isTurn ? 'turn' : ''}`}>
      <div className="sidehead">
        <div className="av">{avatar}</div>
        <div>
          <div className="nm">{side.name}</div>
          <div className="st">
            {combos.length ? combos.map((c) => `${c.name} +${c.bonus}`).join(' · ') : you ? `${side.hand.length} in hand` : `${side.hand.length} concealed`}
          </div>
        </div>
        {isTurn && <span className="turnpill" style={{ marginLeft: 8 }}>{you ? 'Your turn' : 'Their turn'}</span>}
        <div className="score" style={{ color: flash === 'up' ? 'var(--good)' : flash === 'down' ? 'var(--bad)' : undefined }}>
          ${score}
          {side.penalty > 0 && <span className="score pen">−{side.penalty}</span>}
        </div>
      </div>
      <div className="fieldrow">
        <div className="placecol">
          <span className="lbl">SCENE</span>
          {side.place ? <Card def={side.place.def} size="sm" /> : <div className="slot"><div className="empty" style={{ width: 78 }}>—</div></div>}
          {you && side.altPlace && (
            <button className="btn small" disabled={!canSwap} onClick={() => controller.swapPlace()} title={side.altPlace.def.name}>
              {side.swappedPlace ? 'Moved' : `→ ${side.altPlace.def.emoji}`}
            </button>
          )}
        </div>
        <div className="field">
          {fieldSorted.length === 0 && <span className="sub" style={{ alignSelf: 'center', padding: 8 }}>{you ? 'Play a card from your hand.' : 'Nothing on the table yet.'}</span>}
          {fieldSorted.map((f) => (
            <Card key={f.inst.uid} def={f.inst.def} size="sm" value={cardValue(f, side.place)} flags={{ halved: f.halved, doubled: f.doubled, stolen: f.stolen, fresh: f.inst.uid === freshUid }} />
          ))}
        </div>
      </div>
      {you ? (
        <div className={`hand ${isTurn ? '' : 'locked'}`}>
          {side.hand.map((c) => (
            <Card key={c.uid} def={c.def} selected={selected === c.uid} onClick={isTurn && onSelect ? () => onSelect(selected === c.uid ? null : c.uid) : undefined} />
          ))}
          {side.hand.length === 0 && <span className="sub">No cards left.</span>}
        </div>
      ) : (
        <div className="bothand">
          {side.hand.map((c, i) => (
            <Card key={c.uid} back size="xs" flags={{ thinking: !!thinking && i === 0 }} />
          ))}
        </div>
      )}
    </div>
  );
}
