import type { ReactNode } from 'react';

// A number written on the table: large, tabular, editable in place.
export function AmountField({
  id,
  label,
  srLabel,
  value,
  onChange,
  unit = 'BB',
  note,
  placeholder = '—',
  size = 'md',
  invalid = false,
  readOnly = false,
}: {
  id: string;
  label: string;
  srLabel?: string;
  value: string;
  onChange?: (value: string) => void;
  unit?: string;
  note?: ReactNode;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  readOnly?: boolean;
}) {
  const chars = Math.max(1.6, (value || placeholder).length);
  return (
    <div
      className="amount"
      data-size={size}
      data-empty={value.trim() === '' || undefined}
      data-invalid={invalid || undefined}
    >
      {readOnly ? (
        <>
          <span className="kicker amount-label">{label}</span>
          <span className="amount-row">
            <span className="amount-input num">{value}</span>
            <span className="amount-unit">{unit}</span>
          </span>
        </>
      ) : (
        <>
          <label htmlFor={id} className="kicker amount-label">
            {label}
            {srLabel && (
              <>
                {' '}
                <span className="sr-only">{srLabel}</span>
              </>
            )}
          </label>
          <span className="amount-row">
            <input
              id={id}
              name={id}
              className="amount-input num"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={value}
              placeholder={placeholder}
              aria-invalid={invalid || undefined}
              aria-describedby={note ? `${id}-note` : undefined}
              onChange={(event) => onChange?.(event.target.value)}
              style={{ width: `${chars + 0.35}ch` }}
            />
            <span className="amount-unit" aria-hidden="true">
              {unit}
            </span>
          </span>
        </>
      )}
      {note && (
        <span id={`${id}-note`} className="amount-note">
          {note}
        </span>
      )}
    </div>
  );
}
