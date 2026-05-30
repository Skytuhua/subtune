import { useCallback, useRef, useState } from 'react';
import { Button } from './ui';
import { UploadIcon, ShieldIcon } from './icons';

const SAMPLE = `1
00:00:01,000 --> 00:00:03,200
Looks like these subtitles
are a little out of sync.

2
00:00:04,000 --> 00:00:06,500
Drop in your own .srt or .vtt
to fix the timing.

3
00:00:07,000 --> 00:00:09,000
Everything happens in your browser.`;

/** Accepts a file via drag-drop or picker, or pasted text. Reads locally only. */
export function Dropzone({
  onLoad,
  error,
}: {
  onLoad: (text: string, fileName: string | null) => void;
  error: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => onLoad(String(reader.result ?? ''), file.name);
      reader.readAsText(file);
    },
    [onLoad],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a subtitle file by clicking, or drop a file here"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 border-dashed px-6 py-14 text-center transition-colors duration-150 ${
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-surface hover:border-muted/50'
        }`}
      >
        <span className="text-primary">
          <UploadIcon width={32} height={32} />
        </span>
        <p className="text-base font-medium text-text">
          Drop a subtitle file here, or click to browse
        </p>
        <p className="text-sm text-muted">Supports .srt and .vtt — up to thousands of cues</p>
        <input
          ref={inputRef}
          type="file"
          accept=".srt,.vtt,text/plain"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button variant="ghost" onClick={() => setShowPaste((s) => !s)}>
          {showPaste ? 'Hide paste box' : 'Paste text instead'}
        </Button>
        <Button variant="ghost" onClick={() => onLoad(SAMPLE, 'sample.srt')}>
          Try a sample file
        </Button>
      </div>

      {showPaste && (
        <div className="mt-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'Paste .srt or .vtt content here…'}
            className="scroll-thin h-40 w-full rounded border border-border bg-surface-2 p-3 font-mono text-xs text-text focus:border-primary"
          />
          <div className="mt-2 flex justify-end">
            <Button
              variant="primary"
              disabled={pasteText.trim() === ''}
              onClick={() => onLoad(pasteText, 'pasted.srt')}
            >
              Load pasted text
            </Button>
          </div>
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
        <span className="text-success">
          <ShieldIcon width={14} height={14} />
        </span>
        Your file is processed entirely on your device. Nothing is uploaded.
      </p>
    </div>
  );
}
