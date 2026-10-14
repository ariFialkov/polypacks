import { useState } from 'react';
import { CARD_BY_ID } from '../data/cards';
import { MODE_INFO, type Mode } from '../engine/game';
import { Card } from './Card';
import { controller } from './store';

const ICONS: Record<Mode, string> = { series: '🏆', margin: '💸', solitaire: '🧘' };

export function Home({ hasSave }: { hasSave: boolean }) {
  const [rules, setRules] = useState(false);
  return (
    <div className="screen home">
      <div className="hero">
        <div className="herocards">
          <Card def={CARD_BY_ID['cocaine-bear']} size="sm" />
          <Card def={CARD_BY_ID['the-moon']} size="sm" />
          <Card def={CARD_BY_ID['las-vegas']} size="sm" />
        </div>
        <div className="logo">Polypacks</div>
        <div className="tag">Open packs. Build the set. Outplay the table.</div>
      </div>
      <div className="modes">
        {(Object.keys(MODE_INFO) as Mode[]).map((m) => (
          <button key={m} className="mode" onClick={() => controller.start(m)}>
            <span className="ico">{ICONS[m]}</span>
            <span>
              <div className="name">{MODE_INFO[m].title}</div>
              <div className="desc">{MODE_INFO[m].tagline}</div>
            </span>
            <span className="arrow">›</span>
          </button>
        ))}
      </div>
      <button className="btn ghost" onClick={() => setRules(true)}>
        How to play
      </button>
      {hasSave && (
        <p className="sub" style={{ textAlign: 'center' }}>
          Starting a mode replaces your saved game.
        </p>
      )}
      {rules && (
        <div className="overlay" onClick={() => setRules(false)}>
          <div className="inner" onClick={(e) => e.stopPropagation()}>
            <div className="rules panel">
              <h2>How to play</h2>
              <h3>Packs</h3>
              <p>You get 5 Basic packs (5 cards), 2 Enhanced packs (3 cards, better odds), 1 Baptized pack (1 blessed card from a category you choose) and 2 Utility packs (a single-category pack, a ??? pack, or a Redemption pack that opens last). Keep one card from each.</p>
              <h3>The set</h3>
              <p>2 Life, 3 Stuff, 1 Place, 1 Idea, 1 Happening, plus one Place-or-Happening slot. Combos between cards add bonus value, and some unlock special slots.</p>
              <h3>The round</h3>
              <ul>
                <li>Places flip first and set each player's scene for the round. A scene multiplies the value of certain categories.</li>
                <li>Take turns playing one card from your hand. Every card is worth its value under your scene.</li>
                <li>Happenings stay concealed until you play them: boost yourself, hit your opponent, shake the whole table, halve their best card, double your last card, or steal their weakest.</li>
                <li>A second Place can be swapped in on any of your turns. It does not cost your turn.</li>
                <li>When both hands are empty, the higher total takes the round.</li>
              </ul>
              <h3>??? cards</h3>
              <ul>
                <li><b>Redemption</b> – a 2-card pack that opens after everything else.</li>
                <li><b>God</b> – every slot opens, every pack opens at once, and the best set is built for you.</li>
                <li><b>Karma</b> – playing badly? Your luck turns. Playing well? Also turns.</li>
                <li><b>Deal with the Devil</b> – a great card now; one of yours is taken before your last pack.</li>
                <li><b>Premonition</b> – peek inside one unopened pack.</li>
                <li><b>Aether</b> – nothing.</li>
              </ul>
              <h3>Modes</h3>
              <ul>
                {(Object.keys(MODE_INFO) as Mode[]).map((m) => (
                  <li key={m}>
                    <b>{MODE_INFO[m].title}</b> – {MODE_INFO[m].rules.join(' ')}
                  </li>
                ))}
              </ul>
              <button className="btn block" style={{ marginTop: 16 }} onClick={() => setRules(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
