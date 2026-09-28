import { useEffect, useRef, useState, type RefObject } from 'react';

// The family curve (portfolio, EDGAR, Signal Dash): cubic-bezier(0.22, 1, 0.36, 1).
export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const EASE_DEAL = 'cubic-bezier(0.16, 0.74, 0.18, 1)';
export const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, t), 4);

const reducedQuery = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

export function prefersReducedMotion() {
  return Boolean(reducedQuery()?.matches);
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const query = reducedQuery();
    if (!query) return;
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function useMedia(query: string) {
  const get = () =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(query).matches
      : false;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

// Eases a displayed number toward its latest value.
export function useCountUp(value: number, duration = 700) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduced || !Number.isFinite(value) || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const k = easeOut((now - start) / duration);
      const next = origin + (value - origin) * k;
      from.current = next;
      setShown(next);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);
  return shown;
}

// One to two degrees of pointer tilt plus a moving glint on fine pointers.
export function usePointerTilt(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  maxDeg = 2,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (
      prefersReducedMotion() ||
      !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
    )
      return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        el.style.setProperty(
          '--ry',
          `${((x - 0.5) * 2 * maxDeg).toFixed(2)}deg`,
        );
        el.style.setProperty(
          '--rx',
          `${((0.5 - y) * 2 * maxDeg).toFixed(2)}deg`,
        );
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [ref, enabled, maxDeg]);
}
