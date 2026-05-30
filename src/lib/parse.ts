import type { Cue, Subtitle, SubtitleFormat } from './types';
import { parseTimestamp } from './time';

/** A line is a timing line only if it has timestamp --> timestamp (not a bare "-->"). */
const TIMING_RE = /(?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->/;

/**
 * Tolerant, line-based subtitle parser shared by SRT and VTT.
 *
 * Strategy: scan lines and treat a line as a timing line only when it matches
 * "timestamp --> timestamp" (so dialogue containing a bare "-->" is kept).
 * The cue text is the following non-empty lines up to the next blank line or
 * timing line. This naturally ignores index numbers, the WEBVTT header,
 * NOTE/STYLE blocks, cue identifiers, and cue settings appended to the timing
 * line — making it robust to the messy files people actually download.
 */
export function parseBlocks(text: string): { cues: Cue[]; warnings: string[] } {
  const warnings: string[] = [];
  // Strip BOM and normalise line endings.
  const normalised = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = normalised.split('\n');

  const cues: Cue[] = [];
  let id = 1;
  let i = 0;
  let droppedTimings = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (TIMING_RE.test(line)) {
      // Extract the first two timestamp-like tokens (ignores trailing cue settings).
      const stamps = line.match(/(?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3}/g);
      if (!stamps || stamps.length < 2) {
        droppedTimings++;
        i++;
        continue;
      }
      const start = parseTimestamp(stamps[0]);
      const end = parseTimestamp(stamps[1]);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '' && !TIMING_RE.test(lines[i])) {
        textLines.push(lines[i]);
        i++;
      }
      if (start === null || end === null) {
        droppedTimings++;
        continue;
      }
      cues.push({ id: id++, start, end, text: textLines.join('\n').trimEnd() });
    } else {
      i++;
    }
  }

  if (droppedTimings > 0) {
    warnings.push(
      `${droppedTimings} block${droppedTimings === 1 ? '' : 's'} with unreadable timing ${
        droppedTimings === 1 ? 'was' : 'were'
      } skipped.`,
    );
  }
  return { cues, warnings };
}

/** Detect the subtitle format from its content. Defaults to SRT. */
export function detectFormat(text: string): SubtitleFormat {
  const head = text.replace(/^\uFEFF/, '').trimStart();
  if (/^WEBVTT/.test(head)) return 'vtt';
  // SRT timing uses a comma before the millis; VTT uses a dot.
  const firstTiming = text.match(/(?:\d+:)?\d{1,2}:\d{2}([.,])\d{1,3}\s*-->/);
  if (firstTiming) return firstTiming[1] === ',' ? 'srt' : 'vtt';
  return 'srt';
}

/** Parse subtitle text into a Subtitle, auto-detecting the format. */
export function parse(text: string): Subtitle {
  const format = detectFormat(text);
  const { cues, warnings } = parseBlocks(text);
  if (cues.length === 0) {
    throw new Error(
      'No subtitle cues found. Make sure this is a valid .srt or .vtt file with "-->" timing lines.',
    );
  }
  return { format, cues, warnings };
}
