import { useEffect, useMemo, useRef, useState } from 'react';
import { HOME_BONUS, HOME_TIE, PLACE_THEMES, THEME_LABEL } from '../data/places';
import { deckOf, matchShowdown, type MatchState, type SideState } from '../engine/match';
import type { CardInst, Side } from '../engine/types';
import { Card } from './Card';
import { controller } from './store';

type Ev =
  | { t: 'title'; text: string; sub?: string }
  | { t: 'home'; side: Side }
  | { t: 'rally'; side: Side; uid: string; n: number }
  | { t: 'turf'; winner: Side | 'tie' | null }
  | { t: 'tie'; side: Side; uid: string; n: number }
  | { t: 'hcombo'; side: Side; name: string; n: number }
  | { t: 'end' };

interface View {
  totals: Record<Side, number>;
  power: Record<Side, number>;
  homeShown: Record<Side, boolean>;
  lit: Record<string, string>;
  banner: { text: string; sub?: string };
  turf: Side | 'tie' | null | undefined;
  combos: Record<Side, string[]>;
  done: boolean;
}

/** A number that runs from its previous value to the new one, with a floating +N / -N. */
function Running({ value, big, plain }: { value: number; big?: boolean; plain?: boolean }) {
  const [shown, setShown] = useState(value);
  const [delta, setDelta] = useState<{ n: number; k: number } | null>(null);
  const from = useRef(value);
  useEffect(() => {
    if (value === from.current) return;
    const start = from.current;
    setDelta({ n: value - start, k: Date.now() });
    from.current = value;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 520);
      setShown(Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span className={`running ${big ? 'big' : ''}`}>
      <span className={plain ? 'num' : 'money'}>{plain ? shown : `$${shown}`}</span>
      {delta && (
        <span key={delta.k} className={`scoredelta ${delta.n > 0 ? 'up' : 'down'}`}>
          {delta.n > 0 ? '+' : '−'}
          {Math.abs(delta.n)}
        </span>
      )}
    </span>
  );
}

export function ShowdownOverlay({ m }: { m: MatchState }) {
  const sd = useMemo(() => matchShowdown(m), [m]);
  const solo = !sd.bot;
  const sides: Side[] = solo ? ['you'] : ['bot', 'you'];
  const sideOf = (who: Side) => (who === 'you' ? sd.you : sd.bot!);

  const events = useMemo(() => {
    const ev: Ev[] = [{ t: 'title', text: 'Showdown', sub: 'Every pick is in. Now the places have their say.' }];
    const homes = sides.filter((w) => sideOf(w).home);
    if (homes.length) {
      ev.push({ t: 'title', text: solo ? 'Your home' : 'Home turf', sub: solo ? 'Your best place anchors the set.' : `Home power is the place plus every event that rallies for it. The stronger home takes +${HOME_BONUS}.` });
      for (const w of homes) ev.push({ t: 'home', side: w });
      const rallies = sides.map((w) => sideOf(w).rally.map((r) => ({ t: 'rally' as const, side: w, uid: r.uid, n: r.n })));
      for (let i = 0; i < Math.max(0, ...rallies.map((r) => r.length)); i++) for (const r of rallies) if (r[i]) ev.push(r[i]);
      if (!solo) ev.push({ t: 'turf', winner: sd.homeWinner });
    }
    const ties = sides.map((w) => sideOf(w).ties.map((r) => ({ t: 'tie' as const, side: w, uid: r.uid, n: r.n })));
    if (ties.some((x) => x.length)) {
      ev.push({ t: 'title', text: 'Home ties', sub: `+${HOME_TIE} for every card that fits its home place.` });
      for (let i = 0; i < Math.max(0, ...ties.map((r) => r.length)); i++) for (const r of ties) if (r[i]) ev.push(r[i]);
    }
    const hc = sides.flatMap((w) => sideOf(w).homeCombos.map((k) => ({ t: 'hcombo' as const, side: w, name: k.name, n: k.bonus })));
    if (hc.length) {
      ev.push({ t: 'title', text: 'Home combos', sub: 'Combos that only count at home.' });
      ev.push(...hc);
    }
    ev.push({ t: 'end' });
    return ev;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sd]);

  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= events.length - 1) return;
    const e = events[i];
    const ms = e.t === 'title' ? 1500 : e.t === 'turf' ? 1400 : e.t === 'home' ? 900 : 620;
    const id = setTimeout(() => setI((x) => x + 1), ms);
    return () => clearTimeout(id);
  }, [i, events]);

  const view: View = useMemo(() => {
    const v: View = {
      totals: { you: sd.you.base, bot: sd.bot?.base ?? 0 },
      power: { you: 0, bot: 0 },
      homeShown: { you: false, bot: false },
      lit: {},
      banner: { text: '' },
      turf: undefined,
      combos: { you: [], bot: [] },
      done: false,
    };
    for (const e of events.slice(0, i + 1)) {
      if (e.t === 'title') v.banner = { text: e.text, sub: e.sub };
      if (e.t === 'home') {
        v.homeShown[e.side] = true;
        v.power[e.side] = sideOf(e.side).home!.def.rating;
      }
      if (e.t === 'rally') {
        v.power[e.side] += e.n;
        v.lit[e.uid] = v.lit[e.uid] ? `${v.lit[e.uid]} · +${e.n} power` : `+${e.n} power`;
      }
      if (e.t === 'turf') {
        v.turf = e.winner;
        if (e.winner === 'you' || e.winner === 'bot') v.totals[e.winner] += HOME_BONUS;
        v.banner = {
          text: e.winner === 'you' ? 'You take home turf' : e.winner === 'bot' ? `${m.bot.name} takes home turf` : e.winner === 'tie' ? 'Home turf is a draw' : 'Nobody has a home',
          sub: e.winner === 'you' || e.winner === 'bot' ? `+${HOME_BONUS} to the stronger home.` : 'No bonus either way.',
        };
      }
      if (e.t === 'tie') {
        v.totals[e.side] += e.n;
        v.lit[e.uid] = v.lit[e.uid] ? `${v.lit[e.uid]} · +${e.n}` : `+${e.n}`;
      }
      if (e.t === 'hcombo') {
        v.totals[e.side] += e.n;
        v.combos[e.side].push(`${e.name} +${e.n}`);
      }
      if (e.t === 'end') {
        v.done = true;
        const y = sd.you.total;
        const b = sd.bot?.total ?? 0;
        v.banner = solo ? { text: `Set value $${y}` } : { text: y > b ? 'You take it' : b > y ? `${m.bot.name} takes it` : 'Dead heat', sub: `$${y} to $${b}` };
      }
    }
    return v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, events, sd]);

  const panel = (who: Side) => {
    const ss: SideState = who === 'you' ? m.you : m.bot;
    const s = sideOf(who);
    const cards = deckOf(ss)
      .slots.map((x) => x.card)
      .filter((c): c is CardInst => !!c && c.uid !== s.home?.uid);
    const wonTurf = view.turf === who;
    return (
      <section key={who} className={`sdpanel ${who} ${wonTurf ? 'turf' : ''}`}>
        <header>
          <span className="nm">{who === 'you' ? 'You' : m.bot.name}</span>
          <Running value={view.totals[who]} big />
        </header>
        <div className="sdbody">
          <div className={`sdhome ${view.homeShown[who] ? 'shown' : ''}`}>
            {s.home ? (
              <>
                <Card def={s.home.def} className="sm" badge="home" />
                <div className="power">
                  <span className="lbl">home power</span>
                  <Running value={view.power[who]} plain />
                </div>
                <div className="themes">{(PLACE_THEMES[s.home.def.id] ?? []).map((t) => THEME_LABEL[t]).join(' · ')}</div>
              </>
            ) : (
              <div className="nohome">No place, no home</div>
            )}
          </div>
          <div className="sdcards">
            {cards.map((c) => (
              <div key={c.uid} className={`sdcell ${view.lit[c.uid] ? 'lit' : ''}`}>
                <Card def={c.def} className="mini" />
                {view.lit[c.uid] && <span className="sdtag">{view.lit[c.uid]}</span>}
              </div>
            ))}
          </div>
        </div>
        {view.combos[who].length > 0 && (
          <div className="sdcombos">
            {view.combos[who].map((t) => (
              <span key={t} className="combochip">
                {t}
              </span>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="overlay showdown">
      {!solo && panel('bot')}
      <div className="sdbanner" key={view.banner.text}>
        <h2>{view.banner.text}</h2>
        {view.banner.sub && <p>{view.banner.sub}</p>}
        <div className="ctarow">
          {view.done ? (
            <button className="btn primary glow" onClick={() => controller.ackShowdown()}>
              See the result
            </button>
          ) : (
            <button className="btn ghost small" onClick={() => setI(events.length - 1)}>
              Skip
            </button>
          )}
        </div>
      </div>
      {panel('you')}
    </div>
  );
}
