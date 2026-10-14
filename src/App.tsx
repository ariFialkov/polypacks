import { DeckScreen } from './ui/DeckScreen';
import { DraftScreen } from './ui/DraftScreen';
import { Home } from './ui/Home';
import { PlayScreen } from './ui/PlayScreen';
import { ResultScreen } from './ui/ResultScreen';
import { Shop } from './ui/Shop';
import { useGame } from './ui/store';

export default function App() {
  const s = useGame();
  const game = s.game;
  let screen: JSX.Element;
  if (!game) screen = <Home hasSave={false} />;
  else if (game.phase === 'shop') screen = <Shop game={game} />;
  else if (game.phase === 'draft' && s.draft) screen = <DraftScreen game={game} draft={s.draft} opening={s.opening} botDraft={s.botDraft} tool={s.tool} />;
  else if (game.phase === 'deck' && s.deck) screen = <DeckScreen game={game} deck={s.deck} />;
  else if (game.phase === 'play' && s.round) screen = <PlayScreen game={game} round={s.round} botThinking={s.botThinking} lastBotPlayUid={s.lastBotPlayUid} />;
  else if (game.phase === 'roundResult' || game.phase === 'gameOver') screen = <ResultScreen game={game} deck={s.deck} highScores={s.highScores} />;
  else screen = <Home hasSave={false} />;
  return (
    <div className="app">
      {screen}
      <div className="toasts">
        {s.toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone ?? ''}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
