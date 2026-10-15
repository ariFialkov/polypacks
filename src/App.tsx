import { Home } from './ui/Home';
import { Table } from './ui/Table';
import { useGame } from './ui/store';

export default function App() {
  const s = useGame();
  return (
    <div className="app">
      <div className="ambient" aria-hidden>
        <div className="blob a" />
        <div className="blob b" />
        <div className="blob c" />
        <div className="grid-floor" />
      </div>
      {s.game ? <Table s={s} /> : <Home s={s} />}
      <div className="toasts">
        {s.toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone ?? ''}`}>{t.text}</div>
        ))}
      </div>
    </div>
  );
}
