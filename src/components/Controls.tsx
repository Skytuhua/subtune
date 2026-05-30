import { useEffect, useState, type ReactNode } from 'react';
import type { Cue } from '../lib/types';
import { parseOffset, parseTimestamp, formatTimestamp, formatSignedDuration } from '../lib/time';
import { shiftCues, linearResync, scaleByFps } from '../lib/transform';
import { cleanupCues, defaultCleanupOptions, type CleanupOptions } from '../lib/cleanup';
import { FPS_PRESETS, FPS_VALUES } from '../lib/fps';
import { Button, Field, Panel, TextInput, Toggle } from './ui';
import { ClockIcon, AnchorIcon, FilmIcon, WandIcon } from './icons';

type Tab = 'shift' | 'resync' | 'fps' | 'cleanup';

const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'shift', label: 'Shift', icon: <ClockIcon width={15} height={15} /> },
  { id: 'resync', label: 'Resync', icon: <AnchorIcon width={15} height={15} /> },
  { id: 'fps', label: 'Frame rate', icon: <FilmIcon width={15} height={15} /> },
  { id: 'cleanup', label: 'Clean up', icon: <WandIcon width={15} height={15} /> },
];

export function Controls({
  cues,
  apply,
  setStatus,
}: {
  cues: Cue[];
  apply: (mapper: (c: Cue[]) => Cue[]) => void;
  setStatus: (s: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('shift');

  return (
    <Panel className="flex flex-col">
      <div
        role="tablist"
        aria-label="Operations"
        className="mb-4 flex gap-1 rounded-md border border-border bg-surface-2 p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls="op-panel"
            onClick={() => setTab(t.id)}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors duration-150 sm:min-h-[36px] ${
              tab === t.id ? 'bg-surface text-text shadow-subtle' : 'text-muted hover:text-text'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div id="op-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'shift' && <ShiftTab apply={apply} setStatus={setStatus} />}
        {tab === 'resync' && <ResyncTab cues={cues} apply={apply} setStatus={setStatus} />}
        {tab === 'fps' && <FpsTab apply={apply} setStatus={setStatus} />}
        {tab === 'cleanup' && <CleanupTab apply={apply} setStatus={setStatus} />}
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------- Shift --- */

function ShiftTab({
  apply,
  setStatus,
}: {
  apply: (m: (c: Cue[]) => Cue[]) => void;
  setStatus: (s: string) => void;
}) {
  const [value, setValue] = useState('+2.5');
  const ms = parseOffset(value);
  const valid = ms !== null;

  const run = (delta: number) => {
    apply((c) => shiftCues(c, delta));
    setStatus(`Shifted all cues by ${formatSignedDuration(delta)}.`);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Move every cue earlier or later by a fixed amount. Fixes subtitles that are
        consistently off.
      </p>
      <Field
        label="Offset"
        hint={
          valid ? (
            <span className="text-success">= {formatSignedDuration(ms)}</span>
          ) : (
            <span className="text-danger">Try “+2.5”, “-1.2s”, “250ms” or “-0:02.500”.</span>
          )
        }
      >
        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!valid}
          placeholder="+2.5"
        />
      </Field>
      <div className="grid grid-cols-4 gap-2">
        {[-1000, -500, 500, 1000].map((d) => (
          <Button key={d} onClick={() => run(d)}>
            {d > 0 ? '+' : '−'}
            {Math.abs(d / 1000)}s
          </Button>
        ))}
      </div>
      <Button variant="primary" className="w-full" disabled={!valid} onClick={() => run(ms!)}>
        Apply shift
      </Button>
    </div>
  );
}

/* --------------------------------------------------------------- Resync --- */

function ResyncTab({
  cues,
  apply,
  setStatus,
}: {
  cues: Cue[];
  apply: (m: (c: Cue[]) => Cue[]) => void;
  setStatus: (s: string) => void;
}) {
  const firstCue = cues[0];
  const lastCue = cues[cues.length - 1];
  const sep = '.';

  const [newA, setNewA] = useState(formatTimestamp(firstCue.start, sep));
  const [newB, setNewB] = useState(formatTimestamp(lastCue.start, sep));

  // Re-prime the targets if a different file is loaded.
  useEffect(() => setNewA(formatTimestamp(firstCue.start, sep)), [firstCue.start]);
  useEffect(() => setNewB(formatTimestamp(lastCue.start, sep)), [lastCue.start]);

  const msA = parseTimestamp(newA);
  const msB = parseTimestamp(newB);
  const valid = msA !== null && msB !== null && firstCue.start !== lastCue.start && msA < msB;

  const run = () => {
    if (!valid) return;
    apply((c) => linearResync(c, firstCue.start, msA!, lastCue.start, msB!));
    setStatus('Applied two-anchor linear resync (offset + drift corrected).');
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Fixes drift. Tell SubTune the <em>correct</em> time for the first and last lines; it
        stretches everything in between.
      </p>

      <div className="rounded border border-border bg-surface-2 p-3">
        <p className="mb-2 text-xs font-medium text-muted">First line</p>
        <p className="mb-2 line-clamp-2 text-sm text-text">{firstCue.text || '(empty)'}</p>
        <Field label={`Currently ${formatTimestamp(firstCue.start, sep)} — should be`}>
          <TextInput value={newA} onChange={(e) => setNewA(e.target.value)} />
        </Field>
      </div>

      <div className="rounded border border-border bg-surface-2 p-3">
        <p className="mb-2 text-xs font-medium text-muted">Last line</p>
        <p className="mb-2 line-clamp-2 text-sm text-text">{lastCue.text || '(empty)'}</p>
        <Field label={`Currently ${formatTimestamp(lastCue.start, sep)} — should be`}>
          <TextInput value={newB} onChange={(e) => setNewB(e.target.value)} />
        </Field>
      </div>

      {!valid && (
        <p className="text-xs text-danger">
          Enter two valid times with the first earlier than the last.
        </p>
      )}
      <Button variant="primary" className="w-full" disabled={!valid} onClick={run}>
        Apply linear resync
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ FPS --- */

function FpsTab({
  apply,
  setStatus,
}: {
  apply: (m: (c: Cue[]) => Cue[]) => void;
  setStatus: (s: string) => void;
}) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [presetIdx, setPresetIdx] = useState(0);
  const [src, setSrc] = useState('25');
  const [tgt, setTgt] = useState('23.976');

  const run = () => {
    let source: number;
    let target: number;
    let label: string;
    if (mode === 'preset') {
      const p = FPS_PRESETS[presetIdx];
      source = p.source;
      target = p.target;
      label = p.label;
    } else {
      source = parseFloat(src);
      target = parseFloat(tgt);
      label = `${source} → ${target} fps`;
    }
    if (!Number.isFinite(source) || !Number.isFinite(target) || source <= 0 || target <= 0) {
      return;
    }
    apply((c) => scaleByFps(c, source, target));
    setStatus(`Converted frame rate: ${label}.`);
  };

  const customValid =
    Number.isFinite(parseFloat(src)) &&
    Number.isFinite(parseFloat(tgt)) &&
    parseFloat(src) > 0 &&
    parseFloat(tgt) > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        The classic cause of progressive drift is a frame-rate mismatch (e.g. a 25 fps subtitle
        on a 23.976 fps film).
      </p>

      <div className="flex gap-1 rounded-md border border-border bg-surface-2 p-1 text-xs">
        {(['preset', 'custom'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`flex-1 rounded px-2 py-1.5 font-medium capitalize transition-colors duration-150 ${
              mode === m ? 'bg-surface text-text shadow-subtle' : 'text-muted hover:text-text'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'preset' ? (
        <Field label="Conversion">
          <select
            value={presetIdx}
            onChange={(e) => setPresetIdx(Number(e.target.value))}
            className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-primary"
          >
            {FPS_PRESETS.map((p, i) => (
              <option key={p.label} value={i}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Source fps">
            <input
              list="fps-list"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text focus:border-primary"
            />
          </Field>
          <Field label="Target fps">
            <input
              list="fps-list"
              value={tgt}
              onChange={(e) => setTgt(e.target.value)}
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text focus:border-primary"
            />
          </Field>
          <datalist id="fps-list">
            {FPS_VALUES.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
      )}

      <Button
        variant="primary"
        className="w-full"
        disabled={mode === 'custom' && !customValid}
        onClick={run}
      >
        Convert frame rate
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------- Cleanup --- */

function CleanupTab({
  apply,
  setStatus,
}: {
  apply: (m: (c: Cue[]) => Cue[]) => void;
  setStatus: (s: string) => void;
}) {
  const [opts, setOpts] = useState<CleanupOptions>(defaultCleanupOptions);
  const set = <K extends keyof CleanupOptions>(k: K, v: CleanupOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));

  const run = () => {
    let removed = 0;
    apply((c) => {
      const res = cleanupCues(c, opts);
      removed = res.removed;
      return res.cues;
    });
    setStatus(
      removed > 0 ? `Cleaned up — removed ${removed} empty cue${removed === 1 ? '' : 's'}.` : 'Cleaned up cues.',
    );
  };

  return (
    <div className="space-y-2">
      <p className="mb-2 text-sm text-muted">Tidy up structural problems in the file.</p>
      <Toggle label="Sort by start time" checked={opts.sort} onChange={(v) => set('sort', v)} />
      <Toggle
        label="Fix overlaps"
        checked={opts.fixOverlaps}
        onChange={(v) => set('fixOverlaps', v)}
      />
      <Toggle
        label="Remove empty cues"
        checked={opts.removeEmpty}
        onChange={(v) => set('removeEmpty', v)}
      />
      <Toggle
        label="Trim whitespace"
        checked={opts.trimText}
        onChange={(v) => set('trimText', v)}
      />
      <Toggle
        label="Strip formatting tags"
        checked={opts.stripTags}
        onChange={(v) => set('stripTags', v)}
      />
      <Field label="Minimum cue duration (ms, 0 = off)">
        <TextInput
          type="number"
          min={0}
          step={100}
          value={opts.minDurationMs}
          onChange={(e) => set('minDurationMs', Math.max(0, Number(e.target.value) || 0))}
        />
      </Field>
      <Button variant="primary" className="mt-2 w-full" onClick={run}>
        Apply cleanup
      </Button>
    </div>
  );
}
