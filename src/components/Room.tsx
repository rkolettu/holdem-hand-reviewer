import { useEffect, useRef } from 'react';

// The felt cloth: layered under a `.felt` card. `review` dims the cloth
// around the hand once the analysis is ready.
export function Room({
  review = false,
  mode = 'table',
}: {
  review?: boolean;
  mode?: 'entry' | 'table' | 'panel';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (
      !el ||
      !host ||
      mode === 'panel' ||
      !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
    )
      return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--px', `${event.clientX - rect.left}px`);
        el.style.setProperty('--py', `${event.clientY - rect.top}px`);
        el.dataset.glint = 'true';
      });
    };
    host.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener('pointermove', move);
    };
  }, [mode]);
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
