import { useEffect, useRef } from 'react';

// The fixed felt surface. `review` dims the room around the hand.
export function Room({ review, mode }: { review: boolean; mode: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (
      !el ||
      !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
    )
      return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--px', `${event.clientX}px`);
        el.style.setProperty('--py', `${event.clientY}px`);
        el.dataset.glint = 'true';
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
    };
  }, []);
  return (
    <div
      ref={ref}
      className="room"
      aria-hidden="true"
      data-review={review}
      data-mode={mode}
    >
      <div className="room-lamp" />
      <div className="room-mottle" />
      <div className="room-nap" />
      <div className="room-grain" />
      <div className="room-glint" />
      <div className="room-shade" />
      <div className="room-vignette" />
    </div>
  );
}
