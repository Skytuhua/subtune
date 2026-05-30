import { describe, it, expect } from 'vitest';
import { cleanupCues, stripFormatting, defaultCleanupOptions } from '../src/lib/cleanup';
import type { Cue } from '../src/lib/types';

describe('stripFormatting', () => {
  it('removes HTML and ASS tags', () => {
    expect(stripFormatting('<i>hi</i>')).toBe('hi');
    expect(stripFormatting('{\\an8}top')).toBe('top');
    expect(stripFormatting('<font color="red">x</font>')).toBe('x');
  });
});

describe('cleanupCues', () => {
  it('removes empty cues', () => {
    const cues: Cue[] = [
      { id: 1, start: 0, end: 1000, text: 'a' },
      { id: 2, start: 1000, end: 2000, text: '   ' },
    ];
    const { cues: out, removed } = cleanupCues(cues, { ...defaultCleanupOptions });
    expect(out).toHaveLength(1);
    expect(removed).toBe(1);
  });
  it('fixes overlaps by clamping end to next start', () => {
    const cues: Cue[] = [
      { id: 1, start: 0, end: 5000, text: 'a' },
      { id: 2, start: 3000, end: 6000, text: 'b' },
    ];
    const { cues: out } = cleanupCues(cues, { ...defaultCleanupOptions });
    expect(out[0].end).toBe(3000);
  });
  it('sorts out-of-order cues', () => {
    const cues: Cue[] = [
      { id: 1, start: 5000, end: 6000, text: 'late' },
      { id: 2, start: 1000, end: 2000, text: 'early' },
    ];
    const { cues: out } = cleanupCues(cues, { ...defaultCleanupOptions });
    expect(out.map((c) => c.text)).toEqual(['early', 'late']);
  });
  it('enforces a minimum duration', () => {
    const cues: Cue[] = [{ id: 1, start: 0, end: 100, text: 'a' }];
    const { cues: out } = cleanupCues(cues, {
      ...defaultCleanupOptions,
      fixOverlaps: false,
      minDurationMs: 1000,
    });
    expect(out[0].end).toBe(1000);
  });
  it('strips tags when enabled', () => {
    const cues: Cue[] = [{ id: 1, start: 0, end: 1000, text: '<i>hi</i>' }];
    const { cues: out } = cleanupCues(cues, { ...defaultCleanupOptions, stripTags: true });
    expect(out[0].text).toBe('hi');
  });
  it('does not mutate the input array', () => {
    const cues: Cue[] = [{ id: 1, start: 0, end: 1000, text: ' a ' }];
    const snapshot = JSON.stringify(cues);
    cleanupCues(cues, { ...defaultCleanupOptions });
    expect(JSON.stringify(cues)).toBe(snapshot);
  });
});
