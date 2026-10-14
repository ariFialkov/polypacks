import { CATEGORY_META } from '../data/cards';
import type { Deck } from '../engine/deck';
import { MODE_INFO, type GameState } from '../engine/game';
import { Card } from './Card';
import { controller } from './store';

export function ResultScreen({ game, deck, highScores }: { game: GameState; deck: Deck | null; highScores: number[] }) {
  const last = game.history[game.history.length - 1];
  const over = game.phase === 'gameOver';

  if (game.mode === 'solitaire') {
    const profit = game.you.money - game.spent;
    const best = highScores[0] ?? profit;
    return (
      <div className="screen result">
        <div className="scroll stack" style={{ justifyContent: 'center' }}>
          <span className="eyebrow">Solitaire</span>
          <div className={`headline ${profit >= 0 ? 'win' : 'lose'}`}>{profit >= 0 ? `+$${profit}` : `−$${-profit}`}</div>
          <p className="sub">
            Set value ${game.you.money} · spent ${game.spent} · best {best >= 0 ? `+$${best}` : `−$${-best}`}
          </p>
          {deck && <DeckStrip deck={deck} />}
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={() => controller.home()}>
              Home
            </button>
            <button className="btn primary" onClick={() => controller.restartSame()}>
              Play again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const won = over ? game.winner === 'you' : last?.winner === 'you';
  const headline = over
    ? game.cashedOut
      ? 'Cashed out'
      : won
        ? 'You win'
        : 'They win'
    : last?.winner === 'you'
      ? 'Round won'
      : last?.winner === 'tie'
        ? 'Dead heat'
        : 'Round lost';

  return (
    <div className="screen result">
      <div className="scroll stack" style={{ justifyContent: 'center' }}>
        <span className="eyebrow">
          {MODE_INFO[game.mode].title} · round {game.roundIndex + 1}
        </span>
        <div className={`headline ${won ? 'win' : 'lose'}`}>{headline}</div>
        {last && (
          <div className="panel scoreboard">
            <div>
              <div className="n money">${last.youScore}</div>
              <div className="who">You</div>
            </div>
            <div className="sub">vs</div>
            <div>
              <div className="n money">${last.botScore}</div>
              <div className="who">
                {game.bot.avatar} {game.bot.name}
              </div>
            </div>
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
          <div className="panel row spread">
            <div>
              <div className="eyebrow">Your bankroll</div>
              <div className="bigstat money" style={{ color: last && last.moneyDelta >= 0 ? 'var(--good)' : 'var(--bad)' }}>${game.you.money}</div>
              {last && <div className="sub">{last.moneyDelta >= 0 ? `+$${last.moneyDelta}` : `−$${-last.moneyDelta}`} this round</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="eyebrow">Theirs</div>
              <div className="money" style={{ fontSize: 24 }}>${game.bot.money}</div>
            </div>
          </div>
        )}
        {deck && <DeckStrip deck={deck} />}
        {over ? (
          <>
            <div className="seal">fate seal {game.fate.seal} · {game.history.map((h) => (h.winner === 'you' ? 'W' : 'L')).join('')}</div>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn" onClick={() => controller.home()}>
                Home
              </button>
              <button className="btn primary" onClick={() => controller.restartSame()}>
                Rematch
              </button>
            </div>
          </>
        ) : (
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn ghost" onClick={() => controller.home()} aria-label="Quit">
              Quit
            </button>
            {game.mode === 'margin' && (
              <button className="btn" onClick={() => controller.cashOut()}>
                Cash out ${game.you.money}
              </button>
            )}
            <button className="btn primary" onClick={() => controller.continueGame()}>
              Next round
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DeckStrip({ deck }: { deck: Deck }) {
  const cards = deck.slots.map((s) => s.card).filter((c) => !!c);
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6, textAlign: 'left' }}>
        Your set {deck.combos.length ? `· ${deck.combos.map((c) => c.name).join(', ')}` : ''}
      </div>
      <div className="bench">
        {cards.map((c) => (
          <Card key={c!.uid} def={c!.def} size="sm" badge={c!.def.cat === 'places' ? CATEGORY_META.places.label : undefined} />
        ))}
      </div>
    </div>
  );
}
