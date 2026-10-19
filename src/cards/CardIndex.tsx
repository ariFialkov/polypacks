import { useEffect, useMemo, useState } from 'react';
import { CARDS, CARD_BY_ID, CATEGORY_META, TIER_META, tierScore } from '../data/cards';
import { CARD_ART_NAMES } from '../data/art';
import { COMBOS, comboHints, findCombos } from '../data/combos';
import type { CardDef, Category, Rarity } from '../engine/types';
import { Card } from '../ui/Card';
import { ABILITIES } from '../data/abilities';
import { MINIGAMES } from '../data/minigames';
import { ArtDefs, CatIcon } from '../ui/Icon';

const CATS: Category[] = ['life', 'stuff', 'places', 'ideas', 'happenings', 'special'];
const NOTES_KEY = 'polypacks.cardnotes.v1';

function loadNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
  } catch {
    return {};
  }
}

function extraText(c: CardDef): string {
  if (!c.ability) return '';
  const a = ABILITIES[c.ability];
  return `${a.name} (${a.timing}): ${a.text}`;
}

export function CardIndex() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [tier, setTier] = useState<Rarity | 0>(0);
  const [sort, setSort] = useState<'name' | 'rating' | 'tier'>('name');
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes);
  const [exported, setExported] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch {
      /* ignore */
    }
  }, [notes]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = CARDS.filter((c) => (cat === 'all' || c.cat === cat) && (tier === 0 || c.rarity === tier));
    if (needle) out = out.filter((c) => c.name.toLowerCase().includes(needle) || c.id.includes(needle) || (c.blurb ?? '').toLowerCase().includes(needle));
    out = [...out].sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'rating' ? b.rating - a.rating : tierScore(b) - tierScore(a)));
    return out;
  }, [q, cat, tier, sort]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const valid = findCombos(selected);
  const near = comboHints(selected).filter((h) => h.have >= 1).slice(0, 6);
  const counts = CATS.map((c) => [c, CARDS.filter((x) => x.cat === c).length] as const);

  const exportNotes = () => {
    const lines = Object.entries(notes)
      .filter(([, v]) => v.trim())
      .map(([id, v]) => `${CARD_BY_ID[id]?.name ?? id} (${id}): ${v.trim()}`);
    const text = lines.length ? lines.join('\n') : '(no notes yet)';
    setExported(text);
    try {
      void navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="index">
      <ArtDefs />
      <header className="ix-head">
        <div>
          <div className="eyebrow">Polypacks</div>
          <h1>Card Index</h1>
          <p className="sub">
            {CARDS.length} cards · {COMBOS.length} combos. Tap a card to select it; valid combos among your selection show up in the bar below. Notes are saved in this browser and can be exported.
          </p>
        </div>
        <a className="btn small" href="../index.html">Back to game</a>
      </header>

      <div className="ix-tools">
        <input className="ix-search" placeholder="Search name, id or blurb…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>All {CARDS.length}</button>
          {counts.map(([c, n]) => (
            <button key={c} className={`chip ${cat === c ? 'on' : ''}`} style={{ ['--hue' as string]: CATEGORY_META[c].hue }} onClick={() => setCat(c)}>
              <CatIcon cat={c} /> {CATEGORY_META[c].label} {n}
            </button>
          ))}
        </div>
        <div className="chips">
          <button className={`chip ${tier === 0 ? 'on' : ''}`} onClick={() => setTier(0)}>Any tier</button>
          {([1, 2, 3, 4, 5, 6] as Rarity[]).map((t) => (
            <button key={t} className={`chip tier ${tier === t ? 'on' : ''}`} style={{ ['--tier' as string]: TIER_META[t].color }} onClick={() => setTier(t)}>
              {TIER_META[t].label} {CARDS.filter((c) => c.rarity === t).length}
            </button>
          ))}
          <span className="spacer" />
          <label className="sortlbl">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="tier">Tier score</option>
            </select>
          </label>
          <button className="btn small" onClick={exportNotes}>Export notes</button>
        </div>
      </div>

      {exported !== null && (
        <div className="ix-export">
          <div className="row spread">
            <b>Your notes (copied to clipboard)</b>
            <button className="btn small ghost" onClick={() => setExported(null)}>Close</button>
          </div>
          <textarea readOnly value={exported} rows={Math.min(14, exported.split('\n').length + 1)} />
        </div>
      )}

      <main className="ix-grid">
        {list.map((c) => {
          const art = CARD_ART_NAMES[c.id];
          const on = selected.includes(c.id);
          return (
            <article key={c.id} className={`ix-card ${on ? 'on' : ''}`}>
              <div className="ix-cardwrap">
                <Card def={c} className="lg" onClick={() => toggle(c.id)} selected={on} />
              </div>
              <div className="ix-info">
                <div className="ix-title">
                  <h3>{c.name}</h3>
                  <span className="tierpill" style={{ ['--tier' as string]: TIER_META[c.rarity].color }}>{TIER_META[c.rarity].label}</span>
                </div>
                <dl>
                  <dt>id</dt><dd><code>{c.id}</code></dd>
                  <dt>category</dt><dd>{CATEGORY_META[c.cat].label}</dd>
                  <dt>rating</dt><dd>{c.rating} <span className="sub">(tier score {tierScore(c)})</span></dd>
                  {extraText(c) && (<><dt>ability</dt><dd>{extraText(c)}</dd></>)}
                  <dt>blurb</dt><dd>{c.blurb}</dd>
                  <dt>art</dt><dd><code>{art?.main}</code> · scene <code>{art?.scene}</code></dd>
                </dl>
                <textarea className="ix-note" placeholder="Your notes for this card…" value={notes[c.id] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))} rows={2} />
              </div>
            </article>
          );
        })}
        {list.length === 0 && <p className="sub">Nothing matches.</p>}
      </main>

      <section className="ix-combos" id="combos">
        <h2>Combos ({COMBOS.length})</h2>
        <div className="combo-list">
          {COMBOS.map((combo) => {
            const complete = combo.parts.every((alts) => alts.some((id) => selected.includes(id)));
            return (
              <div key={combo.id} className={`combo-row ${complete ? 'complete' : ''}`}>
                <div className="combo-name">
                  <b>{combo.name}</b> <span className="bonus">+{combo.bonus}</span>
                  {combo.unlock ? <span className="unlock">unlocks {combo.unlock} special slot{combo.unlock > 1 ? 's' : ''}</span> : null}
                </div>
                <div className="combo-parts">
                  {combo.parts.map((alts, i) => (
                    <span key={i} className="part">
                      {alts.map((id, j) => (
                        <span key={id}>
                          {j > 0 && <i> / </i>}
                          <button className={`partbtn ${selected.includes(id) ? 'on' : ''}`} onClick={() => toggle(id)}>{CARD_BY_ID[id]?.name ?? id}</button>
                        </span>
                      ))}
                    </span>
                  ))}
                </div>
                {combo.blurb && <div className="sub">{combo.blurb}</div>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="ix-combos" id="minigames">
        <h2>Minigames ({MINIGAMES.length})</h2>
        <p className="sub" style={{ marginBottom: 10 }}>Unlike combos, these fire when the whole table meets a condition, and resolve with one seeded roll.</p>
        <div className="combo-list">
          {MINIGAMES.map((mg) => (
            <div key={mg.id} className="combo-row">
              <div className="combo-name"><b>{mg.name}</b> <span className="sub">{mg.tagline}</span></div>
              <div className="sub">{mg.rules}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="ix-foot sub">Illustrations: Game Icons (game-icons.net), CC BY 3.0.</footer>

      {selected.length > 0 && (
        <div className="ix-selbar">
          <div className="sel-cards">
            {selected.map((id) => (
              <button key={id} className="selchip" onClick={() => toggle(id)} title="Remove">
                {CARD_BY_ID[id].name} ×
              </button>
            ))}
            <button className="btn small ghost" onClick={() => setSelected([])}>Clear</button>
          </div>
          <div className="sel-combos">
            {valid.length > 0 ? (
              valid.map((c) => (
                <span key={c.id} className="combo-ok">✓ {c.name} +{c.bonus}{c.unlock ? ' · unlocks a special slot' : ''}</span>
              ))
            ) : (
              <span className="sub">{selected.length < 2 ? 'Select at least two cards to check for combos.' : 'No valid combo among the selected cards.'}</span>
            )}
            {near.length > 0 && selected.length >= 1 && (
              <span className="near">
                {near.map((h) => (
                  <span key={h.combo.id}>
                    {h.combo.name}: needs {h.missing.map((alts) => alts.map((id) => CARD_BY_ID[id].name).join(' / ')).join(' + ')}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
