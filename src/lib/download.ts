import type { SubtitleFormat } from './types';

/** Trigger a client-side file download of `content`. No network involved. */
export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Derive an output filename, swapping the extension to the export format. */
export function outputFilename(input: string | null, format: SubtitleFormat): string {
  const base = (input ?? 'subtitles').replace(/\.(srt|vtt)$/i, '');
  return `${base}.fixed.${format}`;
}
