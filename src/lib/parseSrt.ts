import type { Cue } from './types';
import { parseBlocks } from './parse';

/** Parse SRT text into cues (tolerant of missing/duplicate indices and CRLF). */
export function parseSrt(text: string): Cue[] {
  return parseBlocks(text).cues;
}
