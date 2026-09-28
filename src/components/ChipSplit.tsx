import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  CHIP_RATIO,
  CHIP_THICKNESS,
  chipJitter,
  hundredths,
  stackSpot,
} from '../lib/chips';
import { pct, signed } from '../lib/format';
import { prefersReducedMotion } from '../lib/motion';
import { Room } from './Room';
import { ChipField, type PlacedChip, type StackShadow } from './Chips';

type Stage = 'price' | 'split';

const fmt = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/**
 * The final pot (pot + your call) as 100 chips, 1% each.
 *
 * The price: your call chips (onyx) sit opposite the pot (ivory). Your call's
 * share of the final pot is the break-even equity.
 *
 * The split: the same 100 chips divide by your equity. The chips that change
 * sides are the expected value: pot chips crossing to you when equity beats the
 * price, your own chips crossing to villain when it doesn't.
 */
export function ChipSplit({
  pot,
  call,
  equity,
  ev,
}: {
  pot: number;
  call: number;
  equity: number | null;
  ev: number | null;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(420);
  const [stage, setStage] = useState<Stage>(() =>
    prefersReducedMotion() ? 'split' : 'price',
  );
  const [touched, setTouched] = useState(false);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth || 420);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Play the price, then let the pot divide once equity is known.
  const ready = equity !== null;
  useEffect(() => {
    if (!ready || touched || stage === 'split') return;
    const timer = setTimeout(() => setStage('split'), 1500);
    return () => clearTimeout(timer);
  }, [ready, touched, stage]);

  const final = pot + call;
  const callChips = hundredths(call / final);
  const eqChips = equity === null ? callChips : hundredths(equity);
  const split = stage === 'split' && equity !== null;
  const left = split ? eqChips : callChips;

  // Chips that just changed sides hop over the stacks instead of through them.
  const [move, setMove] = useState({ left, lo: 0, hi: 0, hop: 0 });
  if (move.left !== left)
    setMove({
      left,
      lo: Math.min(move.left, left),
      hi: Math.max(move.left, left),
      hop: move.hop + 1,
    });

  const cw = Math.max(16, Math.min(36, Math.floor(width / 12.6)));
  const pitch = cw * 1.1;
  const t = cw * CHIP_THICKNESS;
  const h = cw * CHIP_RATIO;
  const gap = cw * 1.6;
  const height = h + t * 19 + 14;
  const baseY = height - h - 6;
  const centre = width / 2;
  const stackX = (onLeft: boolean, stack: number) =>
    onLeft
      ? centre - gap / 2 - (stack + 1) * pitch + (pitch - cw) / 2
      : centre + gap / 2 + stack * pitch + (pitch - cw) / 2;

  const chips: PlacedChip[] = [];
  const stacks = new Map<string, number>();
  for (let i = 0; i < 100; i++) {
    const onLeft = i < left;
    const { stack, level } = stackSpot(onLeft ? i : 99 - i);
    const mover = i >= move.lo && i < move.hi;
    stacks.set(`${onLeft ? 'l' : 'r'}${stack}`, stackX(onLeft, stack));
    chips.push({
      id: i,
      kind: i < callChips ? 'onyx' : 'ivory',
      x: stackX(onLeft, stack) + chipJitter(i).dx,
      y: baseY - level * t,
      z: level + 1 + (mover ? 60 : 0),
      delay: mover ? (i - move.lo) * 24 : 0,
      moving: mover,
      mark: !split
        ? undefined
        : i >= callChips && i < eqChips
          ? 'gain'
          : i >= eqChips && i < callChips
            ? 'loss'
            : undefined,
    });
  }
  // Where your break-even chips would be, when equity falls short of them.
  if (split)
    for (let i = eqChips; i < callChips; i++) {
      const { stack, level } = stackSpot(i);
      chips.push({
        id: `g${i}`,
        kind: 'ghost',
        x: stackX(true, stack),
        y: baseY - level * t,
        z: 0,
      });
    }
  const shadows: StackShadow[] = [...stacks].map(([id, x]) => ({
    id,
    x: x - cw * 0.12,
    y: baseY + h * 0.32,
    w: cw * 1.24,
  }));

  // Break-even line: the top of the chips your call paid for.
  const mark =
    split && callChips > 0
      ? (() => {
          const { stack, level } = stackSpot(callChips - 1);
          return {
            x: stackX(true, stack) - 5,
            y: baseY - level * t + h * 0.34,
          };
        })()
      : null;

  const moved = Math.abs(eqChips - callChips);
  const po = call / final;
  const leftTitle = split ? 'Your share' : 'Your call';
  const rightTitle = split ? 'Villain’s share' : 'The pot';

  return (
    <div className="split">
      <fieldset className="split-tabs">
        <legend className="sr-only">Show the math</legend>
        {(['price', 'split'] as const).map((value, index) => (
          <button
            key={value}
            type="button"
            className="split-tab"
            aria-pressed={stage === value}
            disabled={value === 'split' && equity === null}
            onClick={() => {
              setTouched(true);
              setStage(value);
            }}
          >
            <span className="num">{index + 1}</span>
            {value === 'price' ? 'The price' : 'The split'}
          </button>
        ))}
      </fieldset>

      <div
        ref={box}
        className="split-stage felt"
        data-hop={move.hop % 2 ? 'a' : 'b'}
        data-stage={stage}
      >
        <Room mode="panel" />
        <ChipField
          chips={chips}
          shadows={shadows}
          width={width}
          height={height}
          chipWidth={cw}
          label={
            split
              ? `The ${fmt(final)} big blind final pot as 100 chips: ${eqChips} yours, ${100 - eqChips} villain's. Your call paid for ${callChips}.`
              : `The ${fmt(final)} big blind final pot as 100 chips: your ${fmt(call)} big blind call is ${callChips}, the pot is ${100 - callChips}.`
          }
        >
          <span
            className="split-seam"
            style={{ left: centre }}
            aria-hidden="true"
          />
          {mark && (
            <span
              className="split-mark"
              style={{
                transform: `translate(${mark.x}px, ${mark.y}px)`,
                width: cw + 10,
              }}
              aria-hidden="true"
            >
              <span className="split-mark-label">break-even</span>
            </span>
          )}
        </ChipField>
      </div>

      <div
        className="split-legend"
        style={{ '--gap': `${gap}px` } as CSSProperties}
      >
        <div className="split-side">
          <p className="kicker">{leftTitle}</p>
          <p className="split-value num">
            {split ? `${eqChips}%` : `${fmt(call)} BB`}
          </p>
          <p className="split-sub num">
            {split
              ? `${callChips} paid for by your call`
              : `${callChips} of 100 chips`}
          </p>
        </div>
        <div className="split-side split-side-right">
          <p className="kicker">{rightTitle}</p>
          <p className="split-value num">
            {split ? `${100 - eqChips}%` : `${fmt(pot)} BB`}
          </p>
          <p className="split-sub num">
            {split
              ? `${100 - eqChips} of 100 chips`
              : `${100 - callChips} of 100 chips`}
          </p>
        </div>
      </div>

      <p className="split-caption">
        {call === 0 ? (
          split ? (
            <>
              No bet to call, so every chip your equity claims is free:{' '}
              <strong className="num">{signed(ev ?? 0)} BB</strong> by checking.
            </>
          ) : (
            <>No bet to call: nothing to risk, so any equity is profit.</>
          )
        ) : !split ? (
          <>
            Risk <strong className="num">{fmt(call)}</strong> to play for a{' '}
            <strong className="num">{fmt(final)} BB</strong> pot. Your call is{' '}
            <strong className="num">{pct(po)}</strong> of it, so that is the
            equity you need to break even.
          </>
        ) : moved === 0 ? (
          <>
            Your equity and the price round to the same chip. The call is close
            to break-even: <strong className="num">{signed(ev ?? 0)} BB</strong>
            .
          </>
        ) : eqChips > callChips ? (
          <>
            Your equity claims <strong className="num">{eqChips}</strong> chips;
            your call paid for <strong className="num">{callChips}</strong>. The{' '}
            <strong className="split-gain num">{moved} extra</strong> that cross
            to you are your edge:{' '}
            <strong className="num">{signed(ev ?? 0)} BB</strong> per call.
          </>
        ) : (
          <>
            Your call paid for <strong className="num">{callChips}</strong>{' '}
            chips; your equity claims only{' '}
            <strong className="num">{eqChips}</strong>.{' '}
            <strong className="num">{moved}</strong> of your chips cross to
            villain: <strong className="num">{signed(ev ?? 0)} BB</strong> per
            call.
          </>
        )}
      </p>
      <p className="split-scale num">
        1 chip = 1% of the {fmt(final)} BB final pot ({(final / 100).toFixed(2)}{' '}
        BB)
      </p>
    </div>
  );
}
