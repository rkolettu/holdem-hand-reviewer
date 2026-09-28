import type { Card } from '../cards';

// Drawn suits: identical on every platform, crisp at any card size.
const stem = 'M11.05 14.6c-.2 3.2-1.2 5.5-3.1 7.2h8.1c-1.9-1.7-2.9-4-3.1-7.2Z';

function Shape({ suit }: { suit: Card['suit'] }) {
  switch (suit) {
    case 'Hearts':
      return (
        <path d="M12 21.3c-.8-1.4-9.5-7-9.5-13 0-2.9 2.2-5.2 5-5.2 2 0 3.7 1.1 4.5 2.9.8-1.8 2.5-2.9 4.5-2.9 2.8 0 5 2.3 5 5.2 0 6-8.7 11.6-9.5 13Z" />
      );
    case 'Diamonds':
      return (
        <path d="M12 1.8c2.2 3.8 4.9 7.2 7.8 10.2-2.9 3-5.6 6.4-7.8 10.2C9.8 18.4 7.1 15 4.2 12 7.1 9 9.8 5.6 12 1.8Z" />
      );
    case 'Spades':
      return (
        <>
          <path d="M12 2c.8 1.5 9.3 6.9 9.3 12.5 0 2.7-2 4.7-4.6 4.7-2.2 0-3.8-1.3-4.7-3.1-.9 1.8-2.5 3.1-4.7 3.1-2.6 0-4.6-2-4.6-4.7C2.7 8.9 11.2 3.5 12 2Z" />
          <path d={stem} />
        </>
      );
    case 'Clubs':
      return (
        <>
          <circle cx="12" cy="6.9" r="4.35" />
          <circle cx="7" cy="13.2" r="4.35" />
          <circle cx="17" cy="13.2" r="4.35" />
          <circle cx="12" cy="12" r="2.8" />
          <path d={stem} />
        </>
      );
  }
}

export function SuitGlyph({
  suit,
  className,
}: {
  suit: Card['suit'];
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <Shape suit={suit} />
    </svg>
  );
}
