import { describe, it, expect } from 'vitest';
import { shiftCues, linearResync, scaleByFps } from '../src/lib/transform';
import type { Cue } from '../src/lib/types';

const cues: Cue[] = [
  { id: 1, start: 1000, end: 2000, text: 'a' },
  { id: 2, start: 3000, end: 4000, text: 'b' },
  { id: 3, start: 10000, end: 12000, text: 'c' },
];

describe('shiftCues', () => {
  it('shifts forward', () => {
    const out = shiftCues(cues, 500);
    expect(out[0]).toMatchObject({ start: 1500, end: 2500 });
  });
  it('shifts backward and clamps at zero', () => {
    const out = shiftCues(cues, -1500);
    expect(out[0].start).toBe(0); // 1000 - 1500 clamped
    expect(out[1]).toMatchObject({ start: 1500, end: 2500 });
  });
  it('keeps end >= start after clamping', () => {
    const out = shiftCues([{ id: 1, start: 100, end: 200, text: 'x' }], -10000);
    expect(out[0].start).toBe(0);
    expect(out[0].end).toBeGreaterThanOrEqual(out[0].start);
  });
});

describe('linearResync', () => {
  it('applies a pure offset when scale is 1', () => {
    // anchors: cue at 1000 should be 2000, cue at 10000 should be 11000 -> +1000
    const out = linearResync(cues, 1000, 2000, 10000, 11000);
    expect(out[0].start).toBe(2000);
    expect(out[2].start).toBe(11000);
    expect(out[1].start).toBe(4000); // 3000 + 1000
  });
  it('corrects drift (stretch) and offset together', () => {
    // map [1000->1000] and [10000->19000]: a=2, b=-1000
    const out = linearResync(cues, 1000, 1000, 10000, 19000);
    expect(out[0].start).toBe(1000); // 2*1000 - 1000
    expect(out[1].start).toBe(5000); // 2*3000 - 1000
    expect(out[2].start).toBe(19000); // 2*10000 - 1000
  });
  it('throws when anchors share a source time', () => {
    expect(() => linearResync(cues, 1000, 2000, 1000, 9000)).toThrow();
  });
});

describe('scaleByFps', () => {
  it('stretches when going 25 -> 23.976 (PAL slow-down)', () => {
    const out = scaleByFps([{ id: 1, start: 100000, end: 101000, text: 'x' }], 25, 23.976);
    // factor = 25/23.976 ≈ 1.0427
    expect(out[0].start).toBe(Math.round(100000 * (25 / 23.976)));
    expect(out[0].start).toBeGreaterThan(100000);
  });
  it('compresses when going 23.976 -> 25 (PAL speed-up)', () => {
    const out = scaleByFps([{ id: 1, start: 100000, end: 101000, text: 'x' }], 23.976, 25);
    expect(out[0].start).toBeLessThan(100000);
  });
  it('is identity for equal frame rates', () => {
    const out = scaleByFps(cues, 25, 25);
    expect(out.map((c) => c.start)).toEqual(cues.map((c) => c.start));
  });
  it('throws on non-positive fps', () => {
    expect(() => scaleByFps(cues, 0, 25)).toThrow();
    expect(() => scaleByFps(cues, 25, -1)).toThrow();
  });
});
