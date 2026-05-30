import type { Cue } from './types';

/** Apply an affine transform t' = a*t + b to a single time, clamped to >= 0. */
function affine(t: number, a: number, b: number): number {
  return Math.max(0, Math.round(a * t + b));
}

/**
 * Constant shift: move every cue by `deltaMs` (can be negative).
 * Starts are clamped at 0; ends never fall below their (clamped) start.
 */
export function shiftCues(cues: Cue[], deltaMs: number): Cue[] {
  return cues.map((c) => {
    const start = Math.max(0, c.start + deltaMs);
    const end = Math.max(start, c.end + deltaMs);
    return { ...c, start, end };
  });
}

/**
 * Two-anchor linear resync. Given two cues whose CURRENT start times are
 * `oldA`/`oldB` and whose CORRECT start times should be `newA`/`newB`, derive
 * the affine transform that fixes offset and drift together, and apply it to
 * every cue's start and end.
 *
 * Throws if the two anchors share the same source time (transform undefined).
 */
export function linearResync(
  cues: Cue[],
  oldA: number,
  newA: number,
  oldB: number,
  newB: number,
): Cue[] {
  if (oldA === oldB) {
    throw new Error('The two anchor cues must have different original times.');
  }
  const a = (newB - newA) / (oldB - oldA);
  const b = newA - a * oldA;
  return cues.map((c) => ({
    ...c,
    start: affine(c.start, a, b),
    end: affine(c.end, a, b),
  }));
}

/**
 * Frame-rate conversion. When a subtitle authored for `sourceFps` is played
 * against video running at `targetFps`, every time must be scaled by
 * sourceFps / targetFps. Pure ratio scale, no offset.
 *
 * Throws on non-positive frame rates.
 */
export function scaleByFps(cues: Cue[], sourceFps: number, targetFps: number): Cue[] {
  if (sourceFps <= 0 || targetFps <= 0) {
    throw new Error('Frame rates must be positive.');
  }
  const factor = sourceFps / targetFps;
  return cues.map((c) => ({
    ...c,
    start: affine(c.start, factor, 0),
    end: affine(c.end, factor, 0),
  }));
}
