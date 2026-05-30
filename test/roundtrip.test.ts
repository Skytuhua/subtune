import { describe, it, expect } from 'vitest';
import { parse } from '../src/lib/parse';
import { toSrt, toVtt, serialize } from '../src/lib/serialize';
import { parseSrt } from '../src/lib/parseSrt';

const SRT = `1
00:00:01,000 --> 00:00:03,000
Hello world

2
00:00:04,000 --> 00:00:06,500
Second line
`;

describe('serialize round-trips', () => {
  it('SRT -> parse -> SRT is stable', () => {
    const a = parse(SRT).cues;
    const out = toSrt(a);
    const b = parseSrt(out);
    expect(b.map((c) => [c.start, c.end, c.text])).toEqual(
      a.map((c) => [c.start, c.end, c.text]),
    );
  });

  it('converts SRT to VTT with dot separators and header', () => {
    const cues = parse(SRT).cues;
    const vtt = toVtt(cues);
    expect(vtt.startsWith('WEBVTT')).toBe(true);
    expect(vtt).toContain('00:00:01.000 --> 00:00:03.000');
  });

  it('serialize() dispatches on format', () => {
    const cues = parse(SRT).cues;
    expect(serialize(cues, 'vtt').startsWith('WEBVTT')).toBe(true);
    expect(serialize(cues, 'srt')).toContain('00:00:01,000 -->');
  });

  it('renumbers SRT output sequentially', () => {
    const cues = [
      { id: 9, start: 0, end: 1000, text: 'a' },
      { id: 3, start: 1000, end: 2000, text: 'b' },
    ];
    const out = toSrt(cues);
    expect(out.startsWith('1\n')).toBe(true);
    expect(out).toContain('\n2\n');
  });
});
