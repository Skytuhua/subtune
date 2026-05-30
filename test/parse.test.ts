import { describe, it, expect } from 'vitest';
import { parse, detectFormat, parseBlocks } from '../src/lib/parse';
import { parseSrt } from '../src/lib/parseSrt';
import { parseVtt } from '../src/lib/parseVtt';

const SRT = `1
00:00:01,000 --> 00:00:03,000
Hello world

2
00:00:04,000 --> 00:00:06,500
Second line
with a wrap
`;

const VTT = `WEBVTT

NOTE this is a comment

intro
00:00:01.000 --> 00:00:03.000 line:80%
Hello world

00:00:04.000 --> 00:00:06.500
Second line
`;

describe('detectFormat', () => {
  it('detects vtt by header', () => {
    expect(detectFormat(VTT)).toBe('vtt');
  });
  it('detects srt by comma timing', () => {
    expect(detectFormat(SRT)).toBe('srt');
  });
});

describe('parse SRT', () => {
  it('parses cues and preserves multi-line text', () => {
    const sub = parse(SRT);
    expect(sub.format).toBe('srt');
    expect(sub.cues).toHaveLength(2);
    expect(sub.cues[0]).toMatchObject({ start: 1000, end: 3000, text: 'Hello world' });
    expect(sub.cues[1].text).toBe('Second line\nwith a wrap');
  });
});

describe('parse VTT', () => {
  it('ignores header, NOTE, cue ids and cue settings', () => {
    const sub = parse(VTT);
    expect(sub.format).toBe('vtt');
    expect(sub.cues).toHaveLength(2);
    expect(sub.cues[0]).toMatchObject({ start: 1000, end: 3000, text: 'Hello world' });
  });
});

describe('robustness', () => {
  it('strips a UTF-8 BOM and handles CRLF', () => {
    const crlf = '﻿1\r\n00:00:01,000 --> 00:00:02,000\r\nHi\r\n';
    const cues = parseSrt(crlf);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe('Hi');
  });
  it('tolerates missing/duplicate indices', () => {
    const messy = `00:00:01,000 --> 00:00:02,000
A

7
00:00:03,000 --> 00:00:04,000
B

7
00:00:05,000 --> 00:00:06,000
C`;
    const cues = parseSrt(messy);
    expect(cues.map((c) => c.text)).toEqual(['A', 'B', 'C']);
    expect(cues.map((c) => c.id)).toEqual([1, 2, 3]);
  });
  it('skips blocks with broken timing and warns', () => {
    const broken = `1
00:00:01,000 --> oops
Bad

2
00:00:03,000 --> 00:00:04,000
Good`;
    const { cues, warnings } = parseBlocks(broken);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe('Good');
    expect(warnings.length).toBeGreaterThan(0);
  });
  it('keeps cue text that contains a bare "-->"', () => {
    const tricky = `1
00:00:01,000 --> 00:00:02,000
wait --> then go

2
00:00:03,000 --> 00:00:04,000
ok`;
    const cues = parseSrt(tricky);
    expect(cues).toHaveLength(2);
    expect(cues[0].text).toBe('wait --> then go');
  });
  it('throws a helpful error when there are no cues', () => {
    expect(() => parse('just some random text')).toThrow(/no subtitle cues/i);
  });
  it('parseVtt also reads the short MM:SS form', () => {
    const v = `WEBVTT

00:01.000 --> 00:02.000
short`;
    expect(parseVtt(v)[0]).toMatchObject({ start: 1000, end: 2000, text: 'short' });
  });
});
