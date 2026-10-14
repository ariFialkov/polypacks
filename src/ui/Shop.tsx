import { PACK_INFO, PACK_PRICES } from '../engine/draft';
import type { GameState } from '../engine/game';
import { controller } from './store';

const KINDS: (keyof typeof PACK_PRICES)[] = ['basic', 'enhanced', 'baptized', 'utility'];
const HUES: Record<string, number> = { basic: 260, enhanced: 300, baptized: 45, utility: 190 };

export function Shop({ game }: { game: GameState }) {
  const left = game.stake - game.spent;
  return (
    <div className="screen">
      <div className="topbar">
        <div className="title">
          <span className="eyebrow">Solitaire</span>
          <h1>Buy packs</h1>
        </div>
        <button className="iconbtn" onClick={() => controller.home()} aria-label="Home">
          ✕
        </button>
      </div>
      <div className="scroll stack">
        <div className="panel row spread">
          <div>
            <div className="eyebrow">Stake left</div>
            <div className="bigstat money">${left}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Spent</div>
            <div className="money" style={{ fontSize: 22 }}>${game.spent}</div>
          </div>
        </div>
        <div className="panel">
          {KINDS.map((k) => {
            const info = PACK_INFO[k === 'utility' ? 'category' : k];
            return (
              <div className="shoprow" key={k}>
                <div className="row">
                  <div className="pack" style={{ width: 44, aspectRatio: '4/5.4', padding: 0, ['--hue' as string]: HUES[k] }} />
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {k === 'utility' ? 'Utility' : info.label} <span className="sub">${PACK_PRICES[k]}</span>
                    </div>
                    <div className="sub">{k === 'utility' ? 'Random category, ??? or redemption' : info.desc}</div>
                  </div>
                </div>
                <div className="stepper">
                  <button onClick={() => controller.setLoadout(k, -1)} disabled={game.loadout[k] === 0}>
                    −
                  </button>
                  <span>{game.loadout[k]}</span>
                  <button onClick={() => controller.setLoadout(k, 1)} disabled={left < PACK_PRICES[k]}>
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="sub">Your score is the value of the set you build minus what you spent. Best sets get remembered.</p>
        <button className="btn primary block" onClick={() => controller.beginDraft()} disabled={game.spent <= 0}>
          Open packs
        </button>
      </div>
    </div>
  );
}
