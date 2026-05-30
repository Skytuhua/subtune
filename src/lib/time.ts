/**
 * Timestamp parsing/formatting. Internally everything is integer milliseconds.
 * SRT uses a comma before millis (00:00:01,500); VTT uses a dot (00:00:01.500)
 * and also permits the short MM:SS.mmm form. We accept both separators on input.
 */

const TS_RE = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/;

/** Parse a single "HH:MM:SS,mmm" / "MM:SS.mmm" timestamp to ms, or null if invalid. */
export function parseTimestamp(input: string): number | null {
  const m = input.trim().match(TS_RE);
  if (!m) return null;
  const hours = m[1] ? parseInt(m[1], 10) : 0;
  const minutes = parseInt(m[2], 10);
  const seconds = parseInt(m[3], 10);
  const millis = parseInt(m[4].padEnd(3, '0'), 10);
  if (minutes > 59 || seconds > 59) return null;
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
}

/** Format ms as a timestamp. Negatives clamp to zero. */
export function formatTimestamp(ms: number, separator: ',' | '.' = ','): string {
  const clamped = Math.max(0, Math.round(ms));
  const h = Math.floor(clamped / 3_600_000);
  const m = Math.floor((clamped % 3_600_000) / 60_000);
  const s = Math.floor((clamped % 60_000) / 1000);
  const millis = clamped % 1000;
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}${separator}${pad(millis, 3)}`;
}

const CLOCK_RE = /^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/;

/** Parse a flexible clock value (used inside offset parsing) to ms, or null. */
function parseClock(s: string): number | null {
  const m = s.match(CLOCK_RE);
  if (!m) return null;
  const hours = m[1] ? parseInt(m[1], 10) : 0;
  const minutes = parseInt(m[2], 10);
  const seconds = parseInt(m[3], 10);
  const millis = m[4] ? parseInt(m[4].padEnd(3, '0'), 10) : 0;
  if (minutes > 59 || seconds > 59) return null;
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
}

/**
 * Parse a user-entered offset into signed milliseconds.
 * Accepts: "2.5" (seconds), "2500ms", "1.5s", "-00:02.500", "+1:02:03.250".
 * Returns null on unparseable input.
 */
export function parseOffset(input: string): number | null {
  let s = input.trim();
  if (s === '') return null;
  let sign = 1;
  if (s.startsWith('+')) s = s.slice(1).trim();
  else if (s.startsWith('-')) {
    sign = -1;
    s = s.slice(1).trim();
  }
  if (s.includes(':')) {
    const clock = parseClock(s);
    return clock === null ? null : sign * clock;
  }
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(ms|s|sec|secs|seconds?)?$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!Number.isFinite(value)) return null;
  const unit = (m[2] || 's').toLowerCase();
  const ms = unit === 'ms' ? value : value * 1000;
  return sign * Math.round(ms);
}

/** Human-friendly signed duration, e.g. "+2.500s" or "-1m 03.200s". */
export function formatSignedDuration(ms: number): string {
  const sign = ms < 0 ? '-' : '+';
  const abs = Math.abs(Math.round(ms));
  const minutes = Math.floor(abs / 60_000);
  const seconds = (abs % 60_000) / 1000;
  if (minutes > 0) return `${sign}${minutes}m ${seconds.toFixed(3)}s`;
  return `${sign}${seconds.toFixed(3)}s`;
}
