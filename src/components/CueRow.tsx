import { memo, useEffect, useState } from 'react';
import type { Cue, CueDiagnostic, SubtitleFormat } from '../lib/types';
import { formatTimestamp, parseTimestamp } from '../lib/time';
import { AlertIcon } from './icons';

const sep = (fmt: SubtitleFormat) => (fmt === 'vtt' ? '.' : ',');

/** A single editable cue row. Memoised so only edited rows re-render. */
function CueRowImpl({
  cue,
  index,
  diag,
  format,
  onEdit,
}: {
  cue: Cue;
  index: number;
  diag: CueDiagnostic;
  format: SubtitleFormat;
  onEdit: (id: number, patch: Partial<Pick<Cue, 'start' | 'end' | 'text'>>) => void;
}) {
  const s = sep(format);
  const [start, setStart] = useState(formatTimestamp(cue.start, s));
  const [end, setEnd] = useState(formatTimestamp(cue.end, s));
  const [text, setText] = useState(cue.text);

  // Keep local fields in sync when the cue changes from an operation/undo.
  useEffect(() => setStart(formatTimestamp(cue.start, s)), [cue.start, s]);
  useEffect(() => setEnd(formatTimestamp(cue.end, s)), [cue.end, s]);
  useEffect(() => setText(cue.text), [cue.text]);

  const commitTime = (raw: string, field: 'start' | 'end') => {
    const ms = parseTimestamp(raw.replace('.', s).replace(',', s));
    if (ms === null) {
      // revert to the known-good value
      field === 'start' ? setStart(formatTimestamp(cue.start, s)) : setEnd(formatTimestamp(cue.end, s));
      return;
    }
    onEdit(cue.id, { [field]: ms });
  };

  const bad = diag.negativeOrZeroDuration;
  const warn = diag.overlap || diag.outOfOrder;
  const rowTone = bad
    ? 'border-l-2 border-l-danger'
    : warn
      ? 'border-l-2 border-l-warning'
      : 'border-l-2 border-l-transparent';

  const issues = [
    bad && 'non-positive duration',
    diag.overlap && 'overlaps previous',
    diag.outOfOrder && 'out of order',
  ].filter(Boolean) as string[];

  return (
    <div
      className={`cv-row grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1 border-b border-border px-3 py-2.5 hover:bg-surface-2/60 sm:grid-cols-[2.5rem_8.5rem_8.5rem_minmax(0,1fr)] ${rowTone}`}
    >
      <div className="pt-2 font-mono text-xs text-muted">{index + 1}</div>

      <input
        aria-label={`Cue ${index + 1} start time`}
        value={start}
        onChange={(e) => setStart(e.target.value)}
        onBlur={(e) => commitTime(e.target.value, 'start')}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="col-start-2 row-start-2 w-full rounded border border-border bg-surface-2 px-2 py-1.5 font-mono text-xs text-text focus:border-primary sm:col-start-2 sm:row-start-1"
      />
      <input
        aria-label={`Cue ${index + 1} end time`}
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        onBlur={(e) => commitTime(e.target.value, 'end')}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className={`col-start-2 row-start-2 w-full rounded border bg-surface-2 px-2 py-1.5 font-mono text-xs text-text focus:border-primary sm:col-start-3 sm:row-start-1 ${
          bad ? 'border-danger/60' : 'border-border'
        }`}
      />

      <div className="col-span-2 sm:col-start-4 sm:row-start-1">
        <textarea
          aria-label={`Cue ${index + 1} text`}
          value={text}
          rows={Math.min(4, Math.max(1, text.split('\n').length))}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => onEdit(cue.id, { text: e.target.value })}
          className="scroll-thin w-full resize-none rounded border border-border bg-surface-2 px-2 py-1.5 text-sm leading-snug text-text focus:border-primary"
        />
        {issues.length > 0 && (
          <p
            className={`mt-1 flex items-center gap-1 text-xs ${bad ? 'text-danger' : 'text-warning'}`}
          >
            <AlertIcon width={12} height={12} />
            {issues.join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}

export const CueRow = memo(CueRowImpl);
