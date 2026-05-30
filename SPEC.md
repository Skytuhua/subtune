# SPEC — SubTune v1

Privacy-first, in-browser subtitle timing fixer. This document defines the v1 feature set,
explicit non-goals, primary user flows, and the definition of "done".

## Definition of done (success criteria)

- Every feature below is implemented for real and covered by automated tests for its core logic.
- A user can complete each primary flow end-to-end and download a correct, valid output file.
- All processing is client-side; no network requests carry user file content anywhere.
- UI has real loading / empty / error / success states and is responsive (375–1440 px).
- Build is green; lint passes; tests pass.

## In scope (v1 features)

### F1 — Import
- Load `.srt` and `.vtt` via **drag-and-drop**, **file picker**, or **paste** into a textarea.
- Robust parser tolerant of: UTF-8 BOM, CRLF/LF, blank-line variance, non-sequential or
  missing indices, WebVTT headers/`NOTE` blocks/cue settings, and inline formatting tags.
- On parse, show cue count, total duration, and detected format.

### F2 — Constant shift
- Shift **all** cues by a signed offset entered in `mm:ss.mmm` or raw milliseconds.
- Clamp so no cue start goes below `00:00:00.000`.

### F3 — Two-anchor linear resync (the differentiator)
- User specifies the **correct** time for a chosen "first" cue and a chosen "last" cue.
- Apply an affine transform `t' = a*t + b` derived from the two anchor pairs to every cue,
  correcting both offset and drift simultaneously.
- Guard against degenerate input (anchors equal / reversed).

### F4 — Frame-rate conversion
- Presets: 23.976→25, 25→23.976, 23.976→24, 24→23.976, 24→25, 25→24, 25→29.97, 29.97→25,
  plus 23.976↔29.97, and a **custom** source/target fps.
- Implemented as a pure ratio scale `t' = t * (source/target)`.

### F5 — Format conversion
- Convert SRT ↔ VTT losslessly for timing; map separators (`,` ↔ `.`) and headers correctly.
- Choose export format independently of import format.

### F6 — Cleanup
- Fix overlaps (clamp a cue's end to the next cue's start), remove empty/whitespace-only cues,
  trim trailing whitespace, optionally strip formatting tags (`<i>`, `{\\an8}`, etc.),
  enforce a minimum duration, and renumber sequentially. Each toggle is independent.

### F7 — Editable cue table + validation
- Table of cues with editable start, end, and text.
- Live validation: highlight overlaps, negative durations, zero-length cues, and out-of-order cues.
- Show a **before → after** summary (counts of cues changed, total shift applied).

### F8 — Export
- Download the result as `.srt` or `.vtt` with a sensible filename.
- Copy-to-clipboard of the full output.

### F9 — Privacy & UX polish
- Explicit "files never leave your browser" messaging.
- Empty state (no file), loading state (parsing large files), error state (unpar-seable input),
  success state (after an operation). Keyboard accessible; respects `prefers-reduced-motion`.

## Out of scope (explicit non-goals for v1)

- Speech/audio-based **automatic** sync (no media decoding, no ML).
- Formats beyond SRT/VTT (no ASS/SSA, SUB, SBV, STL) — may come later.
- Translation, OCR, or transcription.
- Accounts, cloud storage, or any server component.
- Embedding a video player for visual sync (anchors are entered as times, not scrubbed on video).

## Primary user flows

1. **Fix a constant offset:** import → enter shift (e.g. +2.5s) → preview → export.
2. **Fix drift via FPS:** import → pick "25 → 23.976" preset → preview before/after → export.
3. **Fix drift via anchors:** import → set first cue's correct time and last cue's correct
   time → apply linear resync → verify in table → export.
4. **Convert & clean:** import SRT → enable cleanup toggles → choose VTT export → download.
