import { useCallback, useMemo, useState } from 'react';
import type { Cue, Subtitle, SubtitleFormat } from '../lib/types';
import { parse } from '../lib/parse';
import { validateCues } from '../lib/validate';

interface DocState {
  fileName: string | null;
  importFormat: SubtitleFormat;
  cues: Cue[];
  /** Cues exactly as imported, for the before/after comparison. */
  original: Cue[];
  warnings: string[];
}

const MAX_HISTORY = 50;

/**
 * Holds the loaded subtitle document plus an undo history. Every mutating
 * operation is expressed as a pure `Cue[] -> Cue[]` mapper passed to `apply`.
 */
export function useSubtitleDoc() {
  const [doc, setDoc] = useState<DocState | null>(null);
  const [history, setHistory] = useState<Cue[][]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((text: string, fileName: string | null) => {
    try {
      const sub: Subtitle = parse(text);
      setDoc({
        fileName,
        importFormat: sub.format,
        cues: sub.cues,
        original: sub.cues,
        warnings: sub.warnings,
      });
      setHistory([]);
      setError(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not parse this file.');
      return false;
    }
  }, []);

  const apply = useCallback((mapper: (cues: Cue[]) => Cue[]) => {
    setDoc((prev) => {
      if (!prev) return prev;
      let next: Cue[];
      try {
        next = mapper(prev.cues);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Operation failed.');
        return prev;
      }
      setError(null);
      setHistory((h) => [...h.slice(-MAX_HISTORY + 1), prev.cues]);
      return { ...prev, cues: next };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setDoc((prev) => (prev ? { ...prev, cues: last } : prev));
      return h.slice(0, -1);
    });
  }, []);

  const reset = useCallback(() => {
    setDoc((prev) => {
      if (!prev) return prev;
      setHistory((h) => [...h.slice(-MAX_HISTORY + 1), prev.cues]);
      return { ...prev, cues: prev.original };
    });
  }, []);

  const close = useCallback(() => {
    setDoc(null);
    setHistory([]);
    setError(null);
  }, []);

  const validation = useMemo(() => (doc ? validateCues(doc.cues) : null), [doc]);

  return {
    doc,
    error,
    history,
    canUndo: history.length > 0,
    validation,
    load,
    apply,
    undo,
    reset,
    close,
    setError,
  };
}
