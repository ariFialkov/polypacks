import { useState } from 'react';
import { MODE_INFO, STAKES, type Mode } from '../engine/game';
import { PackArt } from './PackTile';
import { Ui } from './Icon';
import { controller, SERIES_ENTRY, SERIES_PRIZE, type Snapshot } from './store';

const RAIL: { kind: 'basic' | 'enhanced' | 'baptized' | 'category' | 'redemption'; label: string; count: number; category?: string }[] = [
  { kind: 'basic', label: 'Basic', count: 5 },
  { kind: 'enhanced', label: 'Enhanced', count: 3 },
  { kind: 'category', label: 'Life', count: 2, category: 'life' },
  { kind: 'baptized', label: 'Baptized', count: 1 },
  { kind: 'category', label: 'Stuff', count: 2, category: 'stuff' },
  { kind: 'enhanced', label: 'Enhanced', count: 3 },
  { kind: 'category', label: 'Places', count: 2, category: 'places' },
  { kind: 'redemption', label: 'Redemption', count: 2 },
  { kind: 'category', label: 'Ideas', count: 2, category: 'ideas' },
  { kind: 'enhanced', label: 'Enhanced', count: 3 },
  { kind: 'category', label: 'Events', count: 2, category: 'happenings' },
  { kind: 'basic', label: 'Basic', count: 5 },
];

export function Home({ s }: { s: Snapshot }) {
  const [rules, setRules] = useState(false);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <div className="home" onClick={() => !s.menuOpen && !rules && controller.openMenu(true)}>
      <div className="hud" onClick={stop}>
        <div className="hud-left">
          <button className="hudbtn" onClick={() => controller.toggleSound()} aria-label="Sound">
            <Ui name={s.sound ? 'sound-on' : 'sound-off'} />
          </button>
          <button className="hudbtn" onClick={() => setRules(true)} aria-label="How to play">
            <Ui name="help" />
          </button>
        </div>
        <Wallet amount={s.wallet} />
      </div>

      <div className="rail-wrap" aria-hidden>
        <div className="spot" />
        <div className="rail">
          {[...RAIL, ...RAIL].map((p, i) => (
            <div className="rail-item" key={i} style={{ ['--i' as string]: i }}>
              <PackArt kind={p.kind} label={p.label} count={p.count} category={p.category} />
            </div>
          ))}
        </div>
      </div>

      <div className="title-block">
        <h1 className="logo">
          <span>POLY</span>
          <span className="pink">PACKS</span>
        </h1>
        <div className="cta">Tap anywhere to play</div>
      </div>

      {s.menuOpen && (
        <div className="menu" onClick={stop}>
          <button className="hudbtn back" onClick={() => controller.openMenu(false)} aria-label="Back">
            ‹
          </button>
          <div className="modes">
            {(Object.keys(MODE_INFO) as Mode[]).map((m, i) => (
              <button key={m} className={`modecard m-${m}`} style={{ ['--i' as string]: i }} onClick={() => controller.start(m)}>
                <div className="mico">
                  <Ui name={`mode-${m}`} />
                </div>
                <div className="mname">{MODE_INFO[m].title}</div>
                <div className="mdesc">{MODE_INFO[m].tagline}</div>
                <div className="mstake">{m === 'series' ? `Entry $${SERIES_ENTRY} · win $${SERIES_PRIZE}` : m === 'margin' ? `Buy-in $${STAKES.margin}` : 'Spend what you like'}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {rules && (
        <div className="sheet-backdrop" onClick={(e) => { stop(e); setRules(false); }}>
          <div className="sheet rules" onClick={stop}>
            <h2>How to play</h2>
            <h3>Packs</h3>
            <p>5 Basic (5 cards), 2 Enhanced (3 cards, better odds), 1 Baptized (one blessed card from a category you choose) and 2 Utility packs (2 cards from one category, or a Redemption pack that opens last). ??? cards can hide in any pack.</p>
            <h3>Turns</h3>
            <p>You open a pack and take one card, then your opponent does the same. Every pick lands face up in your set: Place, Happening, Place-or-Happening on top; 2 Life, 3 Stuff, 1 Idea below. Combos add value and can unlock special slots. Empty slots at the end get a random common card.</p>
            <h3>Abilities</h3>
            <p>Some cards do something when picked: burn, steal, swap, protect, peek, revive, cancel a combo. A card that changes hands fires its ability again for its new owner. Area 51 can classify a card so nobody can touch or see it.</p>
            <h3>Minigames</h3>
            <p>When the whole table meets a condition (Natural Selection with animals on both sides, a disaster hitting the places, a trawler and a tuna across the table, a crime crew, a bouncer against a frat guy) a minigame fires and one seeded roll decides who loses what.</p>
            <h3>??? cards</h3>
            <ul>
              <li><b>Redemption</b> – a 2-card pack that opens after everything else.</li>
              <li><b>God</b> – every slot opens, every pack opens, the best set is built for you.</li>
              <li><b>Karma</b> – playing badly? Your luck turns. Playing well? Also turns.</li>
              <li><b>Deal with the Devil</b> – a great card now, one taken before your last pack.</li>
              <li><b>Premonition</b> – peek inside one unopened pack.</li>
              <li><b>Aether</b> – nothing.</li>
            </ul>
            <h3>Modes</h3>
            <ul>
              {(Object.keys(MODE_INFO) as Mode[]).map((m) => (
                <li key={m}><b>{MODE_INFO[m].title}</b> – {MODE_INFO[m].rules.join(' ')}</li>
              ))}
            </ul>
            <p className="credit">Card illustrations: Game Icons (game-icons.net), CC BY 3.0. <a href="cards/" style={{ color: "var(--gold)" }}>Browse the full card index</a>.</p>
            <button className="btn block" onClick={() => setRules(false)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Wallet({ amount }: { amount: number }) {
  return (
    <div className="wallet">
      <Ui name="wallet" />
      <span className="money">${amount.toLocaleString()}</span>
    </div>
  );
}
