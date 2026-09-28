// FELT's mark: two hole cards drawn in a gold hairline, one tucked behind
// the other. Poker without chips, crowns, suits or neon.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="7.2"
        y="6.4"
        width="12.4"
        height="17.4"
        rx="2"
        transform="rotate(-11 13.4 15.1)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <rect
        x="12.4"
        y="8.4"
        width="12.4"
        height="17.4"
        rx="2"
        transform="rotate(7 18.6 17.1)"
        fill="var(--mark-fill, #0f1110)"
        stroke="currentColor"
        strokeWidth="1.35"
      />
    </svg>
  );
}

export function Brand({
  onClick,
  label = 'FELT home',
}: {
  onClick?: () => void;
  label?: string;
}) {
  const content = (
    <>
      <span className="brand-tile">
        <BrandMark className="brand-mark" />
      </span>
      <span className="brand-word">FELT</span>
    </>
  );
  return onClick ? (
    <button
      type="button"
      className="brand"
      onClick={onClick}
      aria-label={label}
    >
      {content}
    </button>
  ) : (
    <span className="brand">{content}</span>
  );
}
