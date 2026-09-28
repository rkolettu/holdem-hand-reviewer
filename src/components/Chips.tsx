import type { CSSProperties, ReactNode } from 'react';
import {
  CHIP_RATIO,
  CHIP_THICKNESS,
  PER_STACK,
  chipCount,
  chipJitter,
  stackSpot,
} from '../lib/chips';

export type ChipKind = 'onyx' | 'ivory' | 'ghost';

export type PlacedChip = {
  id: number | string;
  kind: ChipKind;
  x: number;
  y: number;
  z: number;
  delay?: number;
  mark?: 'gain' | 'loss';
  moving?: boolean;
};

export type StackShadow = { id: string; x: number; y: number; w: number };

// Ellipse outline as a path so pathLength can normalise the edge inserts.
const ring = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;

function ChipSymbol({
  id,
  face,
  inlay,
  side,
  insert,
  sideInsert,
  line,
}: {
  id: string;
  face: string;
  inlay: string;
  side: string;
  insert: string;
  sideInsert: string;
  line: string;
}) {
  return (
    <symbol id={id} viewBox="0 0 40 26">
      <path d="M1 11v4.5a19 9.5 0 0 0 38 0V11Z" fill={side} />
      <path
        d="M1 13.25a19 9.5 0 0 0 38 0"
        fill="none"
        stroke={sideInsert}
        strokeWidth="4.5"
        pathLength={40}
        strokeDasharray="2.8 10.53"
        style={{ strokeDashoffset: 'var(--spin, 0)' }}
      />
      <path d="M1 11v4.5a19 9.5 0 0 0 38 0V11Z" fill="url(#felt-chip-side)" />
      <ellipse cx="20" cy="11" rx="19" ry="9.5" fill={face} />
      <path
        d={ring(20, 11, 16.9, 8.45)}
        fill="none"
        stroke={insert}
        strokeWidth="2.5"
        pathLength={80}
        strokeDasharray="3.4 9.93"
        style={{ strokeDashoffset: 'var(--spin, 0)' }}
      />
      <ellipse
        cx="20"
        cy="11"
        rx="11.2"
        ry="5.6"
        fill={inlay}
        stroke={line}
        strokeWidth="0.6"
      />
      <ellipse cx="20" cy="11" rx="19" ry="9.5" fill="url(#felt-chip-light)" />
    </symbol>
  );
}

/** Chip artwork, rendered once and referenced by every chip on the page. */
export function ChipDefs() {
  return (
    <svg width="0" height="0" className="chip-defs" aria-hidden="true">
      <defs>
        <linearGradient id="felt-chip-side" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.38" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0.02" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.42" />
        </linearGradient>
        <radialGradient id="felt-chip-light" cx="0.34" cy="0.12" r="0.9">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </radialGradient>
        <ChipSymbol
          id="felt-chip-ivory"
          face="#ece5d6"
          inlay="#e3dac7"
          side="#cdc1a7"
          insert="#1c1e1d"
          sideInsert="#4d463a"
          line="rgba(28,30,29,0.3)"
        />
        <ChipSymbol
          id="felt-chip-onyx"
          face="#1e201f"
          inlay="#252826"
          side="#121413"
          insert="#c9a96c"
          sideInsert="#86703f"
          line="rgba(201,169,108,0.45)"
        />
        <symbol id="felt-chip-ghost" viewBox="0 0 40 26">
          <ellipse
            cx="20"
            cy="11"
            rx="18.4"
            ry="9"
            fill="rgba(241,236,226,0.035)"
            stroke="rgba(241,236,226,0.42)"
            strokeWidth="0.9"
            strokeDasharray="2.2 2.4"
          />
        </symbol>
      </defs>
    </svg>
  );
}

export function ChipField({
  chips,
  shadows = [],
  width,
  height,
  chipWidth,
  className = '',
  label,
  children,
}: {
  chips: PlacedChip[];
  shadows?: StackShadow[];
  width: number;
  height: number;
  chipWidth: number;
  className?: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <figure
      className={`chip-field ${className}`}
      style={
        {
          width,
          height,
          '--chip-w': `${chipWidth}px`,
        } as CSSProperties
      }
    >
      {shadows.map((shadow) => (
        <span
          key={shadow.id}
          className="chip-shadow"
          style={{
            width: shadow.w,
            transform: `translate3d(${shadow.x}px, ${shadow.y}px, 0)`,
          }}
        />
      ))}
      {chips.map((chip) => (
        <svg
          key={chip.id}
          viewBox="0 0 40 26"
          className="chip"
          data-kind={chip.kind}
          data-mark={chip.mark}
          data-moving={chip.moving || undefined}
          aria-hidden="true"
          style={
            {
              transform: `translate3d(${chip.x}px, ${chip.y}px, 0)`,
              zIndex: chip.z,
              transitionDelay: chip.delay ? `${chip.delay}ms` : undefined,
              animationDelay: chip.delay ? `${chip.delay}ms` : undefined,
              '--spin': chipJitter(Number(chip.id) || 0).spin.toFixed(2),
            } as CSSProperties
          }
        >
          <use href={`#felt-chip-${chip.kind}`} />
        </svg>
      ))}
      <figcaption className="sr-only">{label}</figcaption>
      {children}
    </figure>
  );
}

/** One amount as physical stacks of twenty, left to right. */
export function ChipStacks({
  amount,
  unit,
  kind,
  chipWidth = 26,
  maxStacks = 3,
  label,
  className = '',
}: {
  amount: number;
  unit: number;
  kind: ChipKind;
  chipWidth?: number;
  maxStacks?: number;
  label: string;
  className?: string;
}) {
  const count = Math.min(chipCount(amount, unit), maxStacks * PER_STACK);
  const t = chipWidth * CHIP_THICKNESS;
  const h = chipWidth * CHIP_RATIO;
  const pitch = chipWidth * 1.08;
  const stacks = Math.max(1, Math.ceil(count / PER_STACK));
  const width = pitch * (maxStacks - 1) + chipWidth + 4;
  const height = h + t * (PER_STACK - 1) + 6;
  const baseY = height - h - 3;
  const offsetX = (width - (pitch * (stacks - 1) + chipWidth)) / 2;

  const chips: PlacedChip[] = Array.from({ length: count }, (_, i) => {
    const { stack, level } = stackSpot(i);
    return {
      id: i,
      kind,
      x: offsetX + stack * pitch + chipJitter(i).dx,
      y: baseY - level * t,
      z: level + 1,
      delay: Math.min(level, 12) * 14,
    };
  });
  const shadows: StackShadow[] =
    count > 0
      ? Array.from({ length: stacks }, (_, s) => ({
          id: `s${s}`,
          x: offsetX + s * pitch - chipWidth * 0.1,
          y: baseY + h * 0.35,
          w: chipWidth * 1.2,
        }))
      : [];

  return (
    <ChipField
      chips={chips}
      shadows={shadows}
      width={width}
      height={height}
      chipWidth={chipWidth}
      label={label}
      className={className}
    />
  );
}
