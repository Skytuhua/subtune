import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { Controls } from './components/Controls';
import { CueTable } from './components/CueTable';
import { Button, Badge } from './components/ui';
import {
  DownloadIcon,
  CopyIcon,
  UndoIcon,
  TrashIcon,
  ShieldIcon,
  CheckIcon,
  AlertIcon,
  ClockIcon,
  AnchorIcon,
  FilmIcon,
} from './components/icons';
import { useSubtitleDoc } from './hooks/useSubtitleDoc';
import { serialize } from './lib/serialize';
import { downloadText, outputFilename } from './lib/download';
import { formatTimestamp } from './lib/time';
import type { Cue, SubtitleFormat } from './lib/types';

function useTheme() {
  const [theme, setTheme] = useState<string>(() => {
    const saved = localStorage.getItem('subtune-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('subtune-theme', theme);
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}

const FEATURES = [
  { icon: <ClockIcon />, title: 'Constant shift', desc: 'Nudge everything earlier or later.' },
  { icon: <AnchorIcon />, title: 'Two-anchor resync', desc: 'Fix drift with first/last anchors.' },
  { icon: <FilmIcon />, title: 'Frame-rate fix', desc: '23.976 ↔ 25 and more, one click.' },
  { icon: <ShieldIcon />, title: 'Fully private', desc: 'Files never leave your browser.' },
];

export default function App() {
  const { theme, toggle } = useTheme();
  const { doc, error, validation, canUndo, load, apply, undo, reset, close, setError } =
    useSubtitleDoc();
  const [exportFormat, setExportFormat] = useState<SubtitleFormat>('srt');
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (doc) setExportFormat(doc.importFormat);
  }, [doc?.fileName]); // eslint-disable-line react-hooks/exhaustive-deps

  const onEdit = useCallback(
    (id: number, patch: Partial<Pick<Cue, 'start' | 'end' | 'text'>>) => {
      apply((cues) => cues.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [apply],
  );

  const doExport = useCallback(() => {
    if (!doc) return;
    const text = serialize(doc.cues, exportFormat);
    downloadText(outputFilename(doc.fileName, exportFormat), text);
    setStatus(`Downloaded ${outputFilename(doc.fileName, exportFormat)}.`);
  }, [doc, exportFormat]);

  const doCopy = useCallback(async () => {
    if (!doc) return;
    try {
      await navigator.clipboard.writeText(serialize(doc.cues, exportFormat));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Clipboard unavailable in this browser. Use Download instead.');
    }
  }, [doc, exportFormat, setError]);

  const setStatusMsg = useCallback((s: string) => setStatus(s), []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header theme={theme} onToggleTheme={toggle} />

      <main className="mx-auto w-full max-w-app flex-1 px-4 py-8 sm:px-6">
        {!doc ? (
          /* ----------------------------------------------- Empty state --- */
          <div>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                Fix out-of-sync subtitles, privately
              </h1>
              <p className="mt-3 text-base text-muted">
                Shift timing, correct drift with two anchors or a frame-rate change, convert
                between SRT and VTT, and clean up your file — all in your browser.
              </p>
            </div>
            <Dropzone onLoad={load} error={error} />
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-md border border-border bg-surface p-4 text-center"
                >
                  <span className="mb-2 inline-flex text-primary">{f.icon}</span>
                  <h3 className="text-sm font-medium text-text">{f.title}</h3>
                  <p className="mt-1 text-xs text-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* --------------------------------------------- Editor state --- */
          <div className="space-y-5">
            {/* File bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-text">{doc.fileName}</span>
                <Badge>{doc.importFormat.toUpperCase()}</Badge>
                <Badge>{doc.cues.length.toLocaleString()} cues</Badge>
                {doc.cues.length > 0 && (
                  <Badge>ends {formatTimestamp(doc.cues[doc.cues.length - 1].end, ',')}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" onClick={undo} disabled={!canUndo}>
                  <UndoIcon width={15} height={15} /> Undo
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Reset
                </Button>
                <Button variant="danger" onClick={close}>
                  <TrashIcon width={15} height={15} /> Close
                </Button>
              </div>
            </div>

            {/* Status / validation banners */}
            {status && (
              <p className="flex items-center gap-2 rounded border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                <CheckIcon width={15} height={15} /> {status}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                <AlertIcon width={15} height={15} /> {error}
              </p>
            )}
            {doc.warnings.map((w) => (
              <p
                key={w}
                className="flex items-center gap-2 rounded border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
              >
                <AlertIcon width={15} height={15} /> {w}
              </p>
            ))}

            {/* Workspace */}
            <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-5">
                <Controls cues={doc.cues} apply={apply} setStatus={setStatusMsg} />

                {/* Export */}
                <div className="rounded-md border border-border bg-surface p-5 shadow-subtle">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
                    <span className="text-primary">
                      <DownloadIcon width={16} height={16} />
                    </span>
                    Export
                  </h2>
                  <div className="mb-3 flex gap-1 rounded-md border border-border bg-surface-2 p-1">
                    {(['srt', 'vtt'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setExportFormat(f)}
                        aria-pressed={exportFormat === f}
                        aria-label={`Export as ${f.toUpperCase()}`}
                        className={`flex-1 rounded px-2 py-1.5 text-xs font-medium uppercase transition-colors duration-150 ${
                          exportFormat === f
                            ? 'bg-surface text-text shadow-subtle'
                            : 'text-muted hover:text-text'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" className="flex-1" onClick={doExport}>
                      <DownloadIcon width={15} height={15} /> Download
                    </Button>
                    <Button onClick={doCopy}>
                      {copied ? <CheckIcon width={15} height={15} /> : <CopyIcon width={15} height={15} />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cue table + validation summary */}
              <div className="flex min-h-[60vh] flex-col gap-3">
                {validation && (
                  <div className="flex flex-wrap items-center gap-2">
                    {validation.ok ? (
                      <Badge tone="success">
                        <CheckIcon width={12} height={12} /> No timing problems
                      </Badge>
                    ) : (
                      <>
                        {validation.invalidDurations > 0 && (
                          <Badge tone="danger">
                            {validation.invalidDurations} bad duration
                          </Badge>
                        )}
                        {validation.overlaps > 0 && (
                          <Badge tone="warning">{validation.overlaps} overlap</Badge>
                        )}
                        {validation.outOfOrder > 0 && (
                          <Badge tone="warning">{validation.outOfOrder} out of order</Badge>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className="min-h-0 flex-1">
                  {validation && (
                    <CueTable
                      cues={doc.cues}
                      validation={validation}
                      format={exportFormat}
                      onEdit={onEdit}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-app flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:px-6">
          <span className="flex items-center gap-1.5">
            <ShieldIcon width={13} height={13} /> 100% local — your files never leave your device.
          </span>
          <span>SubTune · MIT licensed · open source</span>
        </div>
      </footer>
    </div>
  );
}
