// The showdown plays out on the normal table: the two home places lift out of their slots over a dim
// screen, clash, and the winner returns home with +30; then each home tie lights up on the board with
// its connection to the place, and home combos flash their cards. Totals run up on the board's own
// score badges as it goes.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { HOME_BONUS, PLACE_LINKS } from '../data/places';
import { CARD_BY_ID } from '../data/cards';
import { deckOf, matchShowdown, type MatchState } from '../engine/match';
import type { SideShowdown } from '../engine/finale';
import type { CardInst, Side } from '../engine/types';
import { Card } from './Card';
import { controller, type ComboFlash } from './store';

export interface Mark {
  kind: 'tie' | 'combo' | 'home' | 'lifted';
  label?: string;
}

export interface Playback {
  totals: Record<Side, number>;
  marks: Record<string, Mark>;
  pop: ComboFlash | null;
  layer: ReactNode;
}

type Step =
  | { t: 'battle' }
  | { t: 'tie'; side: Side; uid: string; homeUid: string; label: string; n: number }
  | { t: 'hcombo'; side: Side; name: string; n: number; uids: string[]; cards: string[] }
  | { t: 'end' };

const rectOf = (uid: string) => document.querySelector(`[data-uid="${uid}"] .card`)?.getBoundingClientRect() ?? null;

export function useShowdownPlayback(m: MatchState | null, active: boolean): Playback | null {
  const sd = useMemo(() => (m && active ? matchShowdown(m) : null), [m, active]);
  const steps = useMemo(() => {
    if (!sd || !m) return [] as Step[];
    const out: Step[] = [];
    const sides: Side[] = sd.bot ? ['you', 'bot'] : ['you'];
    const sideOf = (w: Side) => (w === 'you' ? sd.you : sd.bot!);
    if (sides.some((w) => sideOf(w).home)) out.push({ t: 'battle' });
    const ties = sides.map((w) => sideOf(w).ties.map((l) => ({ t: 'tie' as const, side: w, uid: l.uid, homeUid: sideOf(w).home!.uid, label: l.label ?? 'home tie', n: l.n })));
    for (let i = 0; i < Math.max(0, ...ties.map((x) => x.length)); i++) for (const x of ties) if (x[i]) out.push(x[i]);
    for (const w of sides) {
      const ss = w === 'you' ? m.you : m.bot;
      const slotted = deckOf(ss).slots.map((x) => x.card).filter((c): c is CardInst => !!c);
      for (const k of sideOf(w).homeCombos) {
        const inCombo = slotted.filter((c) => k.parts.some((alts) => alts.includes(c.def.id)));
        out.push({ t: 'hcombo', side: w, name: k.name, n: k.bonus, uids: inCombo.map((c) => c.uid), cards: inCombo.map((c) => c.def.name) });
      }
    }
    out.push({ t: 'end' });
    return out;
  }, [sd, m]);

  const [i, setI] = useState(0);
  const [turf, setTurf] = useState<Side | 'tie' | null | undefined>(undefined);
  const [lifted, setLifted] = useState(false);
  useEffect(() => {
    setI(0);
    setTurf(undefined);
  }, [sd]);

  const step = steps[i];
  // timing for everything except the battle, which advances itself
  useEffect(() => {
    if (!step || step.t === 'battle') return;
    if (step.t === 'end') {
      const id = setTimeout(() => controller.ackShowdown(), 1100);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setI((x) => x + 1), step.t === 'tie' ? 1150 : 1900);
    return () => clearTimeout(id);
  }, [step]);

  if (!sd || !m || !step) return null;

  // running totals: base, plus home place once decided, plus every tie and home combo played so far
  const totals: Record<Side, number> = { you: sd.you.base, bot: sd.bot?.base ?? 0 };
  const decided = turf !== undefined || steps.slice(0, i).some((x) => x.t === 'battle');
  const winner = turf !== undefined ? turf : sd.homeWinner;
  if (decided && (winner === 'you' || winner === 'bot')) totals[winner] += HOME_BONUS;
  for (const x of steps.slice(0, i + 1)) if ((x.t === 'tie' || x.t === 'hcombo') && x !== undefined) totals[x.side] += x.n;

  const marks: Record<string, Mark> = {};
  let pop: ComboFlash | null = null;
  let layer: ReactNode = null;
  if (step.t === 'battle') {
    if (lifted) for (const w of ['you', 'bot'] as Side[]) {
      const h = w === 'you' ? sd.you.home : sd.bot?.home;
      if (h) marks[h.uid] = { kind: 'lifted' };
    }
    layer = (
      <HomeBattle
        key={`battle-${m.seed}`}
        m={m}
        you={sd.you}
        bot={sd.bot}
        winner={sd.homeWinner}
        onLift={setLifted}
        onDecide={() => setTurf(sd.homeWinner)}
        onDone={() => {
          setLifted(false);
          setTurf(sd.homeWinner);
          setI((x) => x + 1);
        }}
      />
    );
  }
  if (step.t === 'tie') {
    marks[step.uid] = { kind: 'tie', label: `${step.label} +${step.n}` };
    marks[step.homeUid] = { kind: 'home' };
    layer = <TieLink key={`${step.uid}-${i}`} from={step.uid} to={step.homeUid} />;
  }
  if (step.t === 'hcombo') {
    for (const u of step.uids) marks[u] = { kind: 'combo' };
    pop = { side: step.side, name: `Home combo: ${step.name}`, bonus: step.n, uids: step.uids, cards: step.cards, home: true, key: i };
  }
  const skip = step.t !== 'end' && (
    <button
      className="btn ghost small sdskip"
      onClick={() => {
        setLifted(false);
        setTurf(sd.homeWinner);
        setI(steps.length - 1);
      }}
    >
      Skip
    </button>
  );
  return { totals, marks, pop, layer: (
    <>
      {layer}
      {skip}
    </>
  ) };
}

/** The home places lift out, clash, and the winner goes home. */
function HomeBattle({ m, you, bot, winner, onLift, onDecide, onDone }: { m: MatchState; you: SideShowdown; bot: SideShowdown | null; winner: Side | 'tie' | null; onLift: (v: boolean) => void; onDecide: () => void; onDone: () => void }) {
  const contenders = (['bot', 'you'] as Side[]).filter((w) => (w === 'you' ? you.home : bot?.home));
  const both = contenders.length === 2;
  const [phase, setPhase] = useState<'start' | 'rise' | 'clash' | 'result' | 'return' | 'out'>('start');
  const starts = useRef<Record<string, DOMRect | null>>({});
  const [, force] = useState(0);
  const sideOf = (w: Side) => (w === 'you' ? you : bot!);

  useLayoutEffect(() => {
    for (const w of contenders) starts.current[w] = rectOf(sideOf(w).home!.uid);
    force((x) => x + 1);
    onLift(true);
    const t: number[] = [];
    const at = (ms: number, f: () => void) => t.push(window.setTimeout(f, ms));
    at(40, () => setPhase('rise'));
    if (both) {
      at(1700, () => setPhase('clash'));
      at(2050, () => {
        setPhase('result');
        onDecide();
      });
      at(3900, () => {
        for (const w of contenders) starts.current[w] = rectOf(sideOf(w).home!.uid) ?? starts.current[w];
        setPhase('return');
      });
      at(4600, () => setPhase('out'));
      at(4900, onDone);
    } else {
      at(1500, () => {
        setPhase('result');
        onDecide();
      });
      at(3200, () => setPhase('return'));
      at(3900, () => setPhase('out'));
      at(4200, onDone);
    }
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const W = Math.round(Math.min(160, vw * 0.34, vh * 0.2));
  const H = W * 1.4;
  const cx = vw / 2;
  const cy = vh / 2;
  // every position is the card's top-left corner plus a scale of the fixed W-wide clone (transform-origin 0 0),
  // so moving between the board slot and the centre animates smoothly
  const box = (x: number, y: number, scale: number, opacity = 1) => ({ left: x - (W * scale) / 2, top: y - (H * scale) / 2, scale, opacity });
  const posFor = (w: Side): { left: number; top: number; scale: number; opacity: number } => {
    const r = starts.current[w];
    const home = r ? { left: r.left, top: r.top, scale: r.width / W, opacity: 1 } : box(cx, cy, 1, 0);
    const isWinner = winner === w || (!both && winner !== 'tie');
    if (phase === 'start' || phase === 'out') return home;
    if (phase === 'return') return isWinner || winner === 'tie' ? home : { ...home, opacity: 0 };
    const gap = 26;
    const linedY = !both ? cy : w === 'bot' ? cy - H / 2 - gap / 2 : cy + H / 2 + gap / 2;
    if (phase === 'rise') return box(cx, linedY, 1);
    if (phase === 'clash') return box(cx + (w === 'bot' ? -6 : 6), w === 'bot' ? cy - H * 0.12 : cy + H * 0.12, 1.04);
    // result
    if (winner === 'tie') return box(cx, linedY, 1);
    return isWinner ? box(cx, cy - H * 0.15, 1.14) : box(cx, w === 'bot' ? cy - H * 0.8 : cy + H * 0.8, 0.6, 0);
  };

  const name = (w: Side) => (w === 'you' ? 'You' : m.bot.name);
  const note =
    winner === 'you' ? 'You have home place' : winner === 'bot' ? `${m.bot.name} has home place` : winner === 'tie' ? 'Home place is a draw' : '';
  const why = (() => {
    if (winner !== 'you' && winner !== 'bot') return 'No bonus either way.';
    const s = sideOf(winner);
    if (s.homeField) return `Home field advantage: ${CARD_BY_ID[PLACE_LINKS[s.home!.def.id].homeField].name} +${HOME_BONUS}`;
    return `+${HOME_BONUS}`;
  })();
  const dim = phase !== 'start' && phase !== 'out' && phase !== 'return';
  return (
    <div className={`hb ${phase} ${both ? 'both' : 'solo'}`}>
      <div className={`hb-dim ${dim ? 'on' : ''}`} />
      {contenders.map((w) => {
        const p = posFor(w);
        const s = sideOf(w);
        const showInfo = phase === 'rise';
        return (
          <div key={w} className={`hb-card ${w} ${phase === 'result' && winner === w ? 'win' : ''}`} style={{ left: p.left, top: p.top, ['--hbw' as string]: `${W}px`, transform: `scale(${p.scale})`, opacity: p.opacity }}>
            <Card def={s.home!.def} badge="home" />
            <div className={`hb-info ${w} ${showInfo ? 'on' : ''}`}>
              <b>{name(w)}</b>
              <span className="pw">home power {s.power}</span>
              <span className="sub">
                {s.home!.def.name} {s.home!.def.rating}
                {s.rally.length > 0 && ` · ${s.rally.length} event${s.rally.length > 1 ? 's' : ''} +${s.rally.reduce((t, r) => t + r.n, 0)}`}
              </span>
              {s.homeField && <span className="field">home field: {CARD_BY_ID[PLACE_LINKS[s.home!.def.id].homeField].name}</span>}
            </div>
          </div>
        );
      })}
      {both && (phase === 'clash' || phase === 'result') && <div className="hb-burst" style={{ left: cx, top: cy }} />}
      <div className={`hb-note ${phase === 'result' ? 'on' : ''}`} style={{ top: cy + H * 0.62 }}>
        <h2>{note}</h2>
        <p>{why}</p>
      </div>
    </div>
  );
}

/** A glowing line from a tied card to its home place. */
function TieLink({ from, to }: { from: string; to: string }) {
  const [pts, setPts] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  useLayoutEffect(() => {
    const a = rectOf(from);
    const b = rectOf(to);
    if (a && b) setPts({ x1: a.left + a.width / 2, y1: a.top + a.height / 2, x2: b.left + b.width / 2, y2: b.top + b.height / 2 });
  }, [from, to]);
  if (!pts) return null;
  return (
    <svg className="tielink" width="100%" height="100%">
      <line x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2} />
      <circle cx={pts.x2} cy={pts.y2} r="6" />
    </svg>
  );
}
