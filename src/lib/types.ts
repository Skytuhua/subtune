/** A single subtitle cue. All times are integer milliseconds. */
export interface Cue {
  /** Stable identity for React keys & editing (not the on-disk index). */
  id: number;
  /** Start time in milliseconds (>= 0). */
  start: number;
  /** End time in milliseconds. */
  end: number;
  /** Cue text; may contain newlines. */
  text: string;
}

export type SubtitleFormat = 'srt' | 'vtt';

/** Result of parsing a subtitle file. */
export interface Subtitle {
  format: SubtitleFormat;
  cues: Cue[];
  /** Non-fatal issues encountered while parsing (e.g. dropped malformed blocks). */
  warnings: string[];
}

/** Per-cue validation diagnostics. */
export interface CueDiagnostic {
  /** end <= start */
  negativeOrZeroDuration: boolean;
  /** start < previous cue's end (cues overlap) */
  overlap: boolean;
  /** start < previous cue's start (out of chronological order) */
  outOfOrder: boolean;
}

export interface ValidationResult {
  /** Aligned 1:1 with the cues array. */
  perCue: CueDiagnostic[];
  overlaps: number;
  invalidDurations: number;
  outOfOrder: number;
  /** True when there are no problems at all. */
  ok: boolean;
}
