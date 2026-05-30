# REVIEW — SubTune

Phase 5 QA record: review passes, findings, fixes, and evidence. Screenshots live in
`review/shots/`; machine-checked results in `review/qa-results.json` and `review/qa-local.log`.

## Method

- **Automated functional QA** (`scripts/qa.mjs`) drives the *built* app in headless Chromium
  (Playwright), exercising every feature and asserting real outcomes. 17 checks, all passing.
- **Unit tests** (`npm test`) cover the pure core: parsing, serialization, all transforms,
  cleanup, and validation. **49 tests, all passing.**
- **Two independent adversarial review subagents** (run in parallel): one for
  code-correctness/security/edge-cases, one for accessibility (WCAG 2.1 AA) and
  design-system faithfulness. Their findings were triaged and fixed (below).

## Functional QA results (Playwright, headless Chromium)

All 17 assertions pass against the production build:

| Area | Check | Result |
|---|---|---|
| Landing | hero + dropzone render | PASS |
| Import | paste loads, parses 3 cues | PASS |
| Shift | `+2s` moves cue 1 `00:00:01,000 → 00:00:03,000` | PASS |
| Undo | restores prior state | PASS |
| FPS | 25→23.976 gives `00:00:00,959` (= 1000 × 25/23.976) | PASS |
| Resync | two-anchor stretch lands last cue exactly on 20.000s | PASS |
| Cleanup | toggles render & operate | PASS |
| Export | downloads a real `.vtt` file | PASS |
| Clipboard | copies valid `WEBVTT` text | PASS |
| Theme | light mode toggles correctly | PASS |
| Errors | garbage input shows an alert, no crash | PASS |
| Responsive | renders at 375 / 768 / 1440 px | PASS |
| Performance | 5,000-cue file parses + renders in ~330 ms | PASS |
| **Privacy** | **zero requests leave localhost** (fonts self-hosted) | PASS |
| Stability | no console/page errors across the whole run | PASS |

## Findings & fixes

### Correctness (code-review subagent)
- **[Medium] Bare `-->` in cue text broke parsing.** The parser treated any line containing
  `-->` as a timing line, so dialogue like `wait --> go` was mis-handled. **Fixed:** match a
  real `timestamp --> timestamp` pattern (`TIMING_RE`) for both the timing-line test and the
  text-accumulation guard. Added a regression test (`parse.test.ts`).
- **[Low] `apply` nested state setters.** Refactored `useSubtitleDoc` to mirror the latest doc
  in a ref and call setters sequentially — no setter-in-updater anti-pattern.
- Security: no `dangerouslySetInnerHTML` (React auto-escapes all cue text), no ReDoS-prone
  regexes, Blob URLs revoked after download, no secrets, no network calls with user data. Pass.

### Accessibility & design (a11y subagent)
- **[Medium] Touch targets < 44px.** Buttons, operation tabs, and the cleanup toggles were
  ~32–38px. **Fixed:** `min-h-[44px]` on mobile (38px on ≥sm) for buttons/tabs; the toggle is
  now a full-width 44px row button.
- **[Medium] Tabs lacked the tab/tabpanel relationship.** **Fixed:** added
  `role="tabpanel"`, `aria-controls`, and `aria-labelledby` linking; labeled the export toggles.
- **[Low] White-on-primary contrast 3.7:1 in dark mode.** **Fixed:** dark `--primary` →
  `#2563EB` (≈4.9:1), hover `#1D4ED8`; design notes updated to match.
- Confirmed passing: SVG-only icons (no emoji), visible focus rings, hover/active/disabled
  states, `role="alert"`/`role="switch"`, color never the sole signal (icons+text on
  warnings), empty/error/success states, `prefers-reduced-motion` honored, responsive layout.

## Design-system grading

Implemented UI matches `DESIGN_NOTES.md`: Linear/Vercel minimalism, dark-first with a working
light mode, blue accent on neutral grays, Inter (UI) + JetBrains Mono (timestamps), 4px spacing
grid, 6–8px radius, subtle borders/shadows, 2px focus rings. Contrast ratios computed and pass
AA in both themes. Pre-Delivery Checklist: all items pass.

## Final state

`npm run lint` ✓ · `npm test` (49) ✓ · `tsc -b` ✓ · `vite build` ✓ · QA 17/17 ✓ ·
live site HTTP 200 ✓
