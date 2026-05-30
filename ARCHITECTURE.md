# ARCHITECTURE — SubTune

## Tech stack & rationale

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Type safety for timing math and parser correctness |
| UI | **React 18** | Component model fits an editor + control panels; supported by the design engine (`react` stack) |
| Build | **Vite 5** | Fast dev loop, tiny static output, trivial GitHub Pages / Vercel deploy |
| Styling | **Tailwind CSS 3** | Token-driven styling that maps directly onto the design system; no runtime cost |
| Tests | **Vitest** | First-class Vite integration; fast unit tests for the pure core |
| Lint/format | **ESLint + Prettier** | Consistent, reviewable code |

**Why fully client-side / static:** the product's core promise is privacy ("files never
leave your browser"). A static SPA also has zero hosting cost, deploys anywhere, and is
trivially reproducible. No backend, no database, no API keys.

## Module boundaries

The app is split into a **pure core library** (`src/lib`, no DOM/React) and a thin **UI layer**
(`src/components`). This keeps all correctness-critical logic unit-testable in isolation.

```
src/
  lib/
    types.ts        # Cue, Subtitle, ParseResult, validation types
    time.ts         # parse/format timestamps (SRT & VTT), ms<->string
    parseSrt.ts     # tolerant SRT parser
    parseVtt.ts     # tolerant VTT parser
    parse.ts        # format detection + dispatch
    serialize.ts    # Cue[] -> SRT / VTT strings
    transform.ts    # shift, linear two-anchor resync, fps scale  (pure)
    cleanup.ts      # overlaps, empty, trim, strip tags, min-duration, renumber
    validate.ts     # overlap / negative / zero-length / order diagnostics
    fps.ts          # frame-rate presets & ratio helpers
  components/       # React UI (Dropzone, CuePanel, controls, table, states)
  App.tsx
  main.tsx
test/               # Vitest specs mirroring src/lib
```

### Data flow

1. **Import** → `parse()` detects format and returns `Subtitle { format, cues, warnings }`.
2. Cues live in React state. Each **operation** (shift / resync / fps / cleanup / manual edit)
   is a **pure function** `Cue[] -> Cue[]`, applied to produce new state; the previous state
   is kept for **undo** and for the before/after summary.
3. **Validate** runs on every change to drive inline warnings.
4. **Export** → `serialize()` to the chosen format → Blob → download / clipboard.

All transforms operate on integer **milliseconds** internally to avoid float drift; formatting
to/from `HH:MM:SS,mmm` (SRT) or `HH:MM:SS.mmm` (VTT) happens only at the edges.

## Third-party dependencies & licenses

Runtime deps are intentionally minimal (no parsing/subtitle libraries — the core is hand-written
and tested). Dev/build deps: Vite, React, TypeScript, Tailwind, Vitest, ESLint, Prettier — all
MIT/ISC/BSD licensed. Fonts: Google Fonts (open licensed) per the design system.

## Deployment

`vite build` → static `dist/`. Published to **GitHub Pages** (and optionally Vercel). A
distributable `.zip` of `dist/` is attached to the GitHub release as a build artifact.
