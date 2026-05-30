import { describe, it, expect } from 'vitest';
import { validateCues } from '../src/lib/validate';
import type { Cue } from '../src/lib/types';

describe('validateCues', () => {
  it('reports a clean file as ok', () => {
    const cues: Cue[] = [
      { id: 1, start: 0, end: 1000, text: 'a' },
      { id: 2, start: 1000, end: 2000, text: 'b' },
    ];
    const r = validateCues(cues);
    expect(r.ok).toBe(true);
    expect(r.overlaps).toBe(0);
  });
  it('flags overlaps', () => {
    const cues: Cue[] = [
      { id: 1, start: 0, end: 2000, text: 'a' },
      { id: 2, start: 1000, end: 3000, text: 'b' },
    ];
    const r = validateCues(cues);
    expect(r.overlaps).toBe(1);
    expect(r.perCue[1].overlap).toBe(true);
    expect(r.ok).toBe(false);
  });
  it('flags non-positive durations', () => {
    const cues: Cue[] = [{ id: 1, start: 1000, end: 1000, text: 'a' }];
    const r = validateCues(cues);
    expect(r.invalidDurations).toBe(1);
    expect(r.perCue[0].negativeOrZeroDuration).toBe(true);
  });
  it('flags out-of-order cues', () => {
    const cues: Cue[] = [
      { id: 1, start: 5000, end: 6000, text: 'a' },
      { id: 2, start: 1000, end: 2000, text: 'b' },
    ];
    const r = validateCues(cues);
    expect(r.outOfOrder).toBe(1);
    expect(r.perCue[1].outOfOrder).toBe(true);
  });
});
