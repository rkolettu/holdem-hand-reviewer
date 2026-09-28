import { useLayoutEffect, useRef } from 'react';
import { type Card, suitInfo } from '../cards';
import { EASE_DEAL, EASE_OUT, prefersReducedMotion } from '../lib/motion';
import { SuitGlyph } from './SuitGlyph';
import { BrandMark } from './Brand';

export type CardMotion =
  // Dealt face down from the dealer's position, turned over as it lands.
  | { kind: 'deal'; delay?: number }
  // Slid across from a card the user picked in the deck tray.
  | { kind: 'fly'; from: DOMRect };

const COURT = new Set(['J', 'Q', 'K']);

function dealerOffset(el: HTMLElement) {
  const table = el.closest('[data-table]');
  const dealer = table?.querySelector('[data-dealer]');
  const rect = el.getBoundingClientRect();
  if (!dealer) return { dx: 0, dy: -Math.min(420, window.innerHeight * 0.5) };
  const d = dealer.getBoundingClientRect();
  return {
    dx: d.left + d.width / 2 - (rect.left + rect.width / 2),
    dy: d.top + d.height / 2 - (rect.top + rect.height / 2),
  };
}

function play(el: HTMLElement, body: HTMLElement, motion: CardMotion) {
  if (prefersReducedMotion() || typeof el.animate !== 'function') return;
  if (motion.kind === 'deal') {
    const { dx, dy } = dealerOffset(el);
    const timing: KeyframeAnimationOptions = {
      duration: 680,
      delay: motion.delay ?? 0,
      easing: EASE_DEAL,
      fill: 'backwards',
    };
    const spin = dx > 0 ? 9 : -9;
    el.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(0.9)`,
          opacity: 0,
        },
        { opacity: 1, offset: 0.1 },
        {
          transform: `translate(${dx * 0.025}px, ${dy * 0.025}px) rotate(${spin * 0.1}deg) scale(1.015)`,
          offset: 0.8,
        },
        { transform: 'none', opacity: 1 },
      ],
      timing,
    );
    body.animate(
      [
        { transform: 'rotateY(180deg)' },
        { transform: 'rotateY(180deg)', offset: 0.42 },
        { transform: 'rotateY(0deg)' },
      ],
      { ...timing, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
    );
    return;
  }
  const to = el.getBoundingClientRect();
  if (!to.width) return;
  const dx =
    motion.from.left + motion.from.width / 2 - (to.left + to.width / 2);
  const dy =
    motion.from.top + motion.from.height / 2 - (to.top + to.height / 2);
  const scale = motion.from.width / to.width;
  el.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      {
        transform: `translate(${dx * 0.04}px, ${dy * 0.04}px) rotate(${dx > 0 ? 1.5 : -1.5}deg) scale(1.03)`,
        offset: 0.82,
      },
      { transform: 'none' },
    ],
    { duration: 560, easing: EASE_OUT, fill: 'backwards' },
  );
}

export function PlayingCard({
  card,
  faceDown = false,
  motion,
  className = '',
}: {
  card: Card | null;
  faceDown?: boolean;
  motion?: CardMotion;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);

  // Motion plays once, when this card lands (the component is keyed by card).
  const landing = useRef(motion);
  useLayoutEffect(() => {
    if (landing.current && ref.current && body.current)
      play(ref.current, body.current, landing.current);
  }, []);

  const tone = card ? suitInfo[card.suit].tone : 'black';
  const court = card ? COURT.has(card.rank) : false;

  return (
    <div
      ref={ref}
      className={`pc ${className}`}
      aria-hidden="true"
      data-tone={tone}
      data-court={court || undefined}
      data-ace={card?.rank === 'A' || undefined}
      data-ten={card?.rank === '10' || undefined}
      data-face-down={faceDown || !card || undefined}
    >
      <div ref={body} className="pc-body">
        {card && (
          <div className="pc-face">
            <span className="pc-corner pc-corner-tl">
              <span className="pc-rank">{card.rank}</span>
              <SuitGlyph suit={card.suit} className="pc-corner-suit" />
            </span>
            <span className="pc-center">
              <SuitGlyph suit={card.suit} className="pc-pip" />
            </span>
            <span className="pc-corner pc-corner-br">
              <span className="pc-rank">{card.rank}</span>
              <SuitGlyph suit={card.suit} className="pc-corner-suit" />
            </span>
          </div>
        )}
        <div className="pc-back">
          <BrandMark className="pc-back-mark" />
        </div>
        <div className="pc-glare" />
      </div>
    </div>
  );
}
