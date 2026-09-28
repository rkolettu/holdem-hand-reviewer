import { Popover } from '@base-ui/react/popover';
import {
  BASE_RANGES,
  PLAYSTYLES,
  POSITIONS,
  type OpponentRange,
  type Playstyle,
  type Position,
} from '../poker/ranges';

export const POSITION_NAMES: Record<Position, string> = {
  UTG: 'Under the gun',
  MP: 'Middle position',
  HJ: 'Hijack',
  CO: 'Cutoff',
  BTN: 'Button',
  SB: 'Small blind',
  BB: 'Big blind',
};

export const STYLE_SHORT: Record<Playstyle, string> = {
  'Tight-Aggressive': 'Tight-aggressive',
  'Loose-Aggressive': 'Loose-aggressive',
  'Calling Station': 'Calling station',
  Nit: 'Nit',
};

/** 13 × 13 starting-hand grid: pairs on the diagonal, suited above it. */
export function RangeGrid({ range }: { range: OpponentRange }) {
  return (
    <div className="range-grid" aria-hidden="true">
      {range.matrix.flat().map((cell) => (
        <span
          key={cell.hand}
          className="range-cell"
          data-on={cell.selected || undefined}
          title={cell.hand}
        />
      ))}
    </div>
  );
}

function Plaque({
  range,
  readOnly,
}: {
  range: OpponentRange;
  readOnly: boolean;
}) {
  return (
    <>
      <span className="villain-pos">{range.position}</span>
      <span className="villain-text">
        <span className="villain-name">Villain</span>
        <span className="villain-style">
          {STYLE_SHORT[range.playstyle]}
          <span className="villain-dot" aria-hidden="true">
            ·
          </span>
          <span className="num">{range.percentage.toFixed(1)}%</span>
        </span>
      </span>
      {!readOnly && (
        <svg className="villain-caret" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" />
        </svg>
      )}
    </>
  );
}

export function VillainSeat({
  range,
  onPosition,
  onPlaystyle,
  readOnly = false,
}: {
  range: OpponentRange;
  onPosition?: (position: Position) => void;
  onPlaystyle?: (playstyle: Playstyle) => void;
  readOnly?: boolean;
}) {
  if (readOnly)
    return (
      <div className="villain">
        <span className="sr-only">
          Villain: {POSITION_NAMES[range.position]}, {range.playstyle}.
        </span>
        <Plaque range={range} readOnly />
      </div>
    );

  return (
    <Popover.Root>
      <Popover.Trigger
        className="villain"
        aria-label={`Villain: ${POSITION_NAMES[range.position]}, ${range.playstyle}. Change the opponent`}
      >
        <Plaque range={range} readOnly={false} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="center"
          sideOffset={12}
          collisionPadding={12}
          className="pop-positioner"
        >
          <Popover.Popup className="pop villain-pop">
            <div className="pop-head">
              <p className="kicker">Villain</p>
              <Popover.Title className="pop-title">
                Who are you up against?
              </Popover.Title>
              <Popover.Description className="pop-desc">
                An assumed opening range, not a read on a real player.
              </Popover.Description>
            </div>

            <fieldset className="pop-field">
              <legend className="kicker">Position</legend>
              <div className="segmented segmented-7">
                {POSITIONS.map((position) => (
                  <button
                    key={position}
                    type="button"
                    className="seg"
                    aria-pressed={range.position === position}
                    aria-label={POSITION_NAMES[position]}
                    title={POSITION_NAMES[position]}
                    onClick={() => onPosition?.(position)}
                  >
                    {position}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="pop-field">
              <legend className="kicker">Playstyle</legend>
              <div className="styles">
                {PLAYSTYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    className="style-option"
                    aria-pressed={range.playstyle === style}
                    aria-label={style}
                    onClick={() => onPlaystyle?.(style)}
                  >
                    <span className="style-name">{STYLE_SHORT[style]}</span>
                    <span className="style-base num">
                      Base {BASE_RANGES[style]}%
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="pop-range">
              <RangeGrid range={range} />
              <div className="pop-range-copy">
                <p className="pop-range-value num">
                  {range.percentage.toFixed(1)}%
                </p>
                <p className="pop-range-sub">
                  {range.combinations.length} of 1,326 starting combinations
                </p>
                <p className="pop-note">
                  Base % is the share of all starting hands this playstyle
                  opens. Position then widens or tightens it: {range.position}{' '}
                  moves {BASE_RANGES[range.playstyle]}% to{' '}
                  {range.percentage.toFixed(1)}%.
                </p>
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
