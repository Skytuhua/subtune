import { describe, it, expect } from 'vitest';
import {
  parseTimestamp,
  formatTimestamp,
  parseOffset,
  formatSignedDuration,
} from '../src/lib/time';

describe('parseTimestamp', () => {
  it('parses SRT (comma) timestamps', () => {
    expect(parseTimestamp('00:00:01,500')).toBe(1500);
    expect(parseTimestamp('01:02:03,250')).toBe(3_723_250);
  });
  it('parses VTT (dot) timestamps', () => {
    expect(parseTimestamp('00:00:01.500')).toBe(1500);
  });
  it('parses the short VTT MM:SS form', () => {
    expect(parseTimestamp('00:20.000')).toBe(20_000);
    expect(parseTimestamp('02:20.500')).toBe(140_500);
  });
  it('right-pads short millis', () => {
    expect(parseTimestamp('00:00:01,5')).toBe(1500);
    expect(parseTimestamp('00:00:01,05')).toBe(1050);
  });
  it('rejects garbage and out-of-range fields', () => {
    expect(parseTimestamp('nonsense')).toBeNull();
    expect(parseTimestamp('00:99:00,000')).toBeNull();
    expect(parseTimestamp('00:00:99,000')).toBeNull();
  });
});

describe('formatTimestamp', () => {
  it('formats ms with the requested separator', () => {
    expect(formatTimestamp(1500, ',')).toBe('00:00:01,500');
    expect(formatTimestamp(1500, '.')).toBe('00:00:01.500');
    expect(formatTimestamp(3_723_250, ',')).toBe('01:02:03,250');
  });
  it('clamps negatives to zero', () => {
    expect(formatTimestamp(-5000, ',')).toBe('00:00:00,000');
  });
  it('round-trips with parseTimestamp', () => {
    for (const ms of [0, 1, 999, 1000, 61_001, 3_599_999, 7_200_500]) {
      expect(parseTimestamp(formatTimestamp(ms, ','))).toBe(ms);
    }
  });
});

describe('parseOffset', () => {
  it('treats a bare number as seconds', () => {
    expect(parseOffset('2.5')).toBe(2500);
    expect(parseOffset('2')).toBe(2000);
  });
  it('honours sign', () => {
    expect(parseOffset('-2.5')).toBe(-2500);
    expect(parseOffset('+1')).toBe(1000);
  });
  it('honours units', () => {
    expect(parseOffset('250ms')).toBe(250);
    expect(parseOffset('1.5s')).toBe(1500);
  });
  it('parses clock forms', () => {
    expect(parseOffset('-00:02.500')).toBe(-2500);
    expect(parseOffset('1:02:03.250')).toBe(3_723_250);
  });
  it('rejects empty/garbage', () => {
    expect(parseOffset('')).toBeNull();
    expect(parseOffset('abc')).toBeNull();
  });
});

describe('formatSignedDuration', () => {
  it('formats sub-minute and minute durations', () => {
    expect(formatSignedDuration(2500)).toBe('+2.500s');
    expect(formatSignedDuration(-2500)).toBe('-2.500s');
    expect(formatSignedDuration(63_200)).toBe('+1m 3.200s');
  });
});
