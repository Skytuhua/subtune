import type { Cue } from './types';

export interface CleanupOptions {
  /** Sort cues by start time. */
  sort: boolean;
  /** Clamp each cue's end to the next cue's start so they don't overlap. */
  fixOverlaps: boolean;
  /** Drop cues whose text is empty after trimming. */
  removeEmpty: boolean;
  /** Trim leading/trailing whitespace on each text line. */
  trimText: boolean;
  /** Strip HTML-style <...> and ASS-style {...} formatting tags. */
  stripTags: boolean;
  /** Enforce a minimum on-screen duration (ms); 0 disables. */
  minDurationMs: number;
}

export const defaultCleanupOptions: CleanupOptions = {
  sort: true,
  fixOverlaps: true,
  removeEmpty: true,
  trimText: true,
  stripTags: false,
  minDurationMs: 0,
};

const TAG_RE = /<[^>]*>|\{[^}]*\}/g;

/** Remove formatting tags from a string. */
export function stripFormatting(text: string): string {
  return text.replace(TAG_RE, '');
}

/**
 * Apply the selected cleanup operations in a safe order. Returns new cues and a
 * count of how many were removed. Ids are preserved where possible.
 */
export function cleanupCues(
  input: Cue[],
  options: CleanupOptions,
): { cues: Cue[]; removed: number } {
  let cues = input.map((c) => ({ ...c }));

  if (options.stripTags) {
    cues = cues.map((c) => ({ ...c, text: stripFormatting(c.text) }));
  }
  if (options.trimText) {
    cues = cues.map((c) => ({
      ...c,
      text: c.text
        .split('\n')
        .map((l) => l.trim())
        .join('\n')
        .trim(),
    }));
  }

  const beforeCount = cues.length;
  if (options.removeEmpty) {
    cues = cues.filter((c) => c.text.trim() !== '');
  }

  if (options.sort) {
    cues = cues.slice().sort((a, b) => a.start - b.start || a.end - b.end);
  }

  if (options.minDurationMs > 0) {
    cues = cues.map((c) => ({
      ...c,
      end: Math.max(c.end, c.start + options.minDurationMs),
    }));
  }

  if (options.fixOverlaps) {
    for (let i = 0; i < cues.length - 1; i++) {
      if (cues[i].end > cues[i + 1].start) {
        cues[i] = { ...cues[i], end: cues[i + 1].start };
      }
      // Guard: never let the clamp invert the cue.
      if (cues[i].end < cues[i].start) {
        cues[i] = { ...cues[i], end: cues[i].start };
      }
    }
  }

  return { cues, removed: beforeCount - cues.length };
}
