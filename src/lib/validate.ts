import type { Cue, CueDiagnostic, ValidationResult } from './types';

/**
 * Validate cues for the problems that actually break playback:
 *  - non-positive duration (end <= start)
 *  - overlap with the previous cue (start < previous end)
 *  - out-of-order start (start < previous start)
 *
 * Returns diagnostics aligned 1:1 with the input array plus summary counts.
 */
export function validateCues(cues: Cue[]): ValidationResult {
  const perCue: CueDiagnostic[] = [];
  let overlaps = 0;
  let invalidDurations = 0;
  let outOfOrder = 0;

  for (let i = 0; i < cues.length; i++) {
    const cur = cues[i];
    const prev = i > 0 ? cues[i - 1] : null;

    const negativeOrZeroDuration = cur.end <= cur.start;
    const overlap = prev !== null && cur.start < prev.end;
    const order = prev !== null && cur.start < prev.start;

    if (negativeOrZeroDuration) invalidDurations++;
    if (overlap) overlaps++;
    if (order) outOfOrder++;

    perCue.push({ negativeOrZeroDuration, overlap, outOfOrder: order });
  }

  return {
    perCue,
    overlaps,
    invalidDurations,
    outOfOrder,
    ok: overlaps === 0 && invalidDurations === 0 && outOfOrder === 0,
  };
}
