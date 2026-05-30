import type { Cue } from './types';
import { parseBlocks } from './parse';

/**
 * Parse WebVTT text into cues. The shared block parser already ignores the
 * WEBVTT header, NOTE/STYLE blocks, cue identifiers, and trailing cue settings.
 */
export function parseVtt(text: string): Cue[] {
  return parseBlocks(text).cues;
}
