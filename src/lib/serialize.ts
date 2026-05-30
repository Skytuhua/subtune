import type { Cue, SubtitleFormat } from './types';
import { formatTimestamp } from './time';

/** Serialize cues to SRT. Cues are renumbered sequentially from 1. */
export function toSrt(cues: Cue[]): string {
  return (
    cues
      .map((c, idx) => {
        const start = formatTimestamp(c.start, ',');
        const end = formatTimestamp(c.end, ',');
        return `${idx + 1}\n${start} --> ${end}\n${c.text}`;
      })
      .join('\n\n') + '\n'
  );
}

/** Serialize cues to WebVTT. */
export function toVtt(cues: Cue[]): string {
  const body = cues
    .map((c) => {
      const start = formatTimestamp(c.start, '.');
      const end = formatTimestamp(c.end, '.');
      return `${start} --> ${end}\n${c.text}`;
    })
    .join('\n\n');
  return `WEBVTT\n\n${body}\n`;
}

/** Serialize cues to the requested format. */
export function serialize(cues: Cue[], format: SubtitleFormat): string {
  return format === 'vtt' ? toVtt(cues) : toSrt(cues);
}
