import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
 * The latest doc is mirrored in a ref so handlers can read it without nesting
 * state setters inside one another.
 */
export function useSubtitleDoc() {
  const [doc, setDoc] = useState<DocState | null>(null);
  const [history, setHistory] = useState<Cue[][]>([]);
  const [error, setError] = useState<string | null>(null);

  const docRef = useRef<DocState | null>(null);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  const pushHistory = useCallback((cues: Cue[]) => {
    setHistory((h) => [...h.slice(-(MAX_HISTORY - 1)), cues]);
  }, []);

  const load = useCallback((text: string, fileName: string | null) => {
    try {
      const sub: Subtitle = parse(text);
      const next: DocState = {
        fileName,
        importFormat: sub.format,
        cues: sub.cues,
        original: sub.cues,
        warnings: sub.warnings,
      };
      docRef.current = next;
      setDoc(next);
      setHistory([]);
      setError(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not parse this file.');
      return false;
    }
  }, []);

  const apply = useCallback(
    (mapper: (cues: Cue[]) => Cue[]) => {
      const prev = docRef.current;
      if (!prev) return;
      let next: Cue[];
      try {
        next = mapper(prev.cues);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Operation failed.');
        return;
      }
      setError(null);
      pushHistory(prev.cues);
      const updated = { ...prev, cues: next };
      docRef.current = updated;
      setDoc(updated);
    },
    [pushHistory],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      const prev = docRef.current;
      const updated = prev ? { ...prev, cues: last } : prev;
      docRef.current = updated;
      setDoc(updated);
      return h.slice(0, -1);
    });
  }, []);

  const reset = useCallback(() => {
    const prev = docRef.current;
    if (!prev) return;
    pushHistory(prev.cues);
    const updated = { ...prev, cues: prev.original };
    docRef.current = updated;
    setDoc(updated);
  }, [pushHistory]);

  const close = useCallback(() => {
    docRef.current = null;
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
