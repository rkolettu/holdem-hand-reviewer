import type { CSSProperties } from 'react';
import { fmt } from './Analysis';

// Test a raise size and a fold assumption. The slider carries a gold tick at
// the fold rate this raise needs to break even.
export function RaiseTest({
  pot,
  call,
  raiseTo,
  onRaiseTo,
  foldToRaise,
  onFoldToRaise,
  breakEven,
  message,
  invalid,
}: {
  pot: number;
  call: number;
  raiseTo: string;
  onRaiseTo: (value: string) => void;
  foldToRaise: string;
  onFoldToRaise: (value: string) => void;
  breakEven: number | null;
  message: string;
  invalid: boolean;
}) {
  const presets = [
    { label: 'Min', value: call * 2 },
    { label: '3× bet', value: call * 3 },
    { label: 'Pot', value: pot + call * 2 },
  ];
  const fold = Math.min(100, Math.max(0, Number(foldToRaise) || 0));
  const chars = Math.max(2, raiseTo.length || 4);

  return (
    <div className="raise">
      <div className="raise-size">
        <label htmlFor="raise-to" className="kicker">
          Test a raise
        </label>
        <div className="raise-input-row">
          <span className="raise-prefix">to</span>
          <input
            id="raise-to"
            name="raise-to"
            className="raise-input num"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="size"
            value={raiseTo}
            aria-label="Raise to"
            aria-invalid={invalid || undefined}
            onChange={(event) => onRaiseTo(event.target.value)}
            style={{ width: `${chars + 0.4}ch` }}
          />
          <span className="raise-unit">BB</span>
          <span className="raise-presets">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="preset"
                aria-pressed={
                  Number(raiseTo) === Number(preset.value.toFixed(1))
                }
                onClick={() => onRaiseTo(preset.value.toFixed(1))}
              >
                {preset.label}
                <span className="num">{fmt(preset.value)}</span>
              </button>
            ))}
          </span>
        </div>
      </div>

      <div className="raise-fold">
        <div className="raise-fold-head">
          <label htmlFor="fold-to-raise" className="kicker">
            Villain folds to raise
          </label>
          <span className="raise-fold-value num">{fold.toFixed(0)}%</span>
        </div>
        <div
          className="slider"
          style={
            {
              '--value': fold / 100,
              '--mark': breakEven === null ? undefined : breakEven,
            } as CSSProperties
          }
        >
          <input
            id="fold-to-raise"
            name="fold-to-raise"
            type="range"
            min={0}
            max={100}
            step={1}
            value={fold}
            aria-valuetext={`${fold.toFixed(0)} percent`}
            onChange={(event) => onFoldToRaise(event.target.value)}
          />
          {breakEven !== null && (
            <span className="slider-mark" aria-hidden="true">
              <span className="slider-mark-label num">
                {(breakEven * 100).toFixed(0)}% breaks even
              </span>
            </span>
          )}
        </div>
        <p className="raise-note" data-invalid={invalid || undefined}>
          {message ||
            (breakEven === null
              ? 'An assumption, not a read: how often villain gives up to this raise.'
              : breakEven <= 0
                ? 'This raise is profitable even if villain never folds.'
                : `Above the tick, the raise beats folding. Villain continues with the strongest part of the range.`)}
        </p>
      </div>
    </div>
  );
}
