import { useMemo, useState } from 'react';
import type { Cue, SubtitleFormat, ValidationResult } from '../lib/types';
import { CueRow } from './CueRow';

const PAGE = 200;

/**
 * Editable list of cues. Uses CSS `content-visibility` (see index.css `.cv-row`)
 * so off-screen rows are cheap, plus a "load more" cap so the initial paint of a
 * very large file stays fast.
 */
export function CueTable({
  cues,
  validation,
  format,
  onEdit,
}: {
  cues: Cue[];
  validation: ValidationResult;
  format: SubtitleFormat;
  onEdit: (id: number, patch: Partial<Pick<Cue, 'start' | 'end' | 'text'>>) => void;
}) {
  const [limit, setLimit] = useState(PAGE);
  const visible = useMemo(() => cues.slice(0, limit), [cues, limit]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface">
      <div className="hidden grid-cols-[2.5rem_8.5rem_8.5rem_minmax(0,1fr)] gap-3 border-b border-border bg-surface-2/50 px-3 py-2 text-xs font-medium text-muted sm:grid">
        <span>#</span>
        <span>Start</span>
        <span>End</span>
        <span>Text</span>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto">
        {visible.map((cue, i) => (
          <CueRow
            key={cue.id}
            cue={cue}
            index={i}
            diag={validation.perCue[i]}
            format={format}
            onEdit={onEdit}
          />
        ))}

        {limit < cues.length && (
          <div className="flex items-center justify-center gap-3 p-4 text-sm text-muted">
            <span>
              Showing {limit.toLocaleString()} of {cues.length.toLocaleString()} cues
            </span>
            <button
              onClick={() => setLimit((l) => l + PAGE * 2)}
              className="rounded border border-border bg-surface-2 px-3 py-1.5 text-text transition-colors duration-150 hover:border-muted/40"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export type { Cue };
