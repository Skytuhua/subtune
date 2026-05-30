# RESEARCH — SubTune

> Phase 1 artifact. Market scan, shortlist, scoring, and the chosen product with justification.

## 1. Method

Broad-then-narrow demand research, cross-checked against multiple independent sources
(help-forum threads, existing tools, and "how do I fix…" guides). The goal was a niche
that is (a) genuinely in demand, (b) fully buildable client-side with the available
toolchain (no paid APIs, no data I can't lawfully obtain), and (c) demonstrable in a browser.

## 2. Market scan — candidate niches

| Idea | Demand signal | Buildable client-side? | Crowding | Verdict |
|---|---|---|---|---|
| **Subtitle timing fixer** (resync / drift / FPS) | Very high, evergreen — "subtitles out of sync" is one of the most common media complaints; many forum threads & dedicated guides | Yes — pure text parsing & arithmetic | Several single-purpose tools, mostly closed-source | **Chosen** |
| EXIF metadata viewer / remover | High (privacy) | Yes | Crowded | Runner-up |
| GPX toolkit (merge/split/clean) for runners | Medium | Yes | Light | Shortlisted |
| JSON → TS/Zod schema generator | Medium | Yes | Very crowded | Rejected |
| Cron/regex visualizer | Medium | Yes | Very crowded | Rejected |

## 3. Demand evidence (subtitle timing)

The pain is specific, repeated, and well-documented:

- **Constant offset** — subtitles start a few seconds early/late (wrong release/encode).
- **Progressive drift** — subtitles slowly desync over the runtime. The classic cause is a
  **frame-rate mismatch** (e.g. a 25 fps PAL subtitle played against a 23.976 fps film rip,
  or the reverse). This is the single most-asked-about subtitle problem in help forums.
- The professional fix (Subtitle Edit's "Change frame rate" / "Point Sync") is a
  **Windows desktop** workflow — a real barrier for macOS/Linux/Chromebook/mobile users.

Sources consulted:
- Subtitle Edit — "Fix Subtitles Gradually Going Out Of Sync" (subtitleedit.net)
- Subtitle Edit — "Subtitles Are Out Of Sync After A Frame Rate Change" (subtitleedit.net)
- VideoHelp Forum — "Syncing subtitles from 25 fps to 29.97 fps"
- AfterDawn Forums — "Synchronizing subtitles from 23.976 Input FPS to 25"
- SubtitleWise Blog — "How to Fix Out of Sync Subtitles — Complete Subtitle Shifter Guide"
- Existing tools: SubShifter, subtitletools.com, GoTranscript Sync Shifter, MeTool, SoftSubs, WriteVoice FPS Fixer

## 4. Gap analysis — why a new tool is justified

Existing free online tools are **fragmented and shallow**:

- Most do exactly **one** operation (shift **or** FPS **or** format convert). Fixing a real
  file often needs *several* of these in sequence, forcing users to chain multiple sites.
- The powerful **two-anchor linear resync** (anchor the first & last line to known correct
  times and interpolate everything between) is largely confined to **desktop** software.
- Few offer a real **editable cue table** with **overlap/validation warnings** and a
  **before → after** view, so users can't see or trust what changed.
- Many are **closed-source** and several quietly **upload** your file to a server.

**SubTune's wedge:** one open-source (MIT), privacy-first, in-browser app that combines
constant shift, two-anchor linear resync, FPS conversion, SRT↔VTT conversion, and cleanup,
on top of a real editable cue table with live validation — files never leave the browser.

## 5. Scoring (chosen product: SubTune)

| Criterion | Score (1–5) | Note |
|---|---|---|
| Niche | 4 | Specific audience: people fixing downloaded subtitles, esp. drift/FPS cases on non-Windows |
| Real demand | 5 | Evergreen, heavily documented pain across many forums & guides |
| Doable & shippable | 5 | Pure client-side text processing; no APIs, no licensing issues |
| Demonstrable | 5 | Runs in a browser; every operation is screenshot-able with real before/after |
| Defensible scope | 4 | Sharp v1 feature set (see SPEC.md); clear non-goals |
| Legal/ethical | PASS | Processes the user's own files locally; no scraping, no data collection |

## 6. Chosen product — one-paragraph pitch

**SubTune** is a privacy-first, open-source subtitle timing fixer that runs entirely in your
browser. Drop in an `.srt` or `.vtt` file and fix the two things that actually break
subtitles: a **constant offset** (shift everything earlier/later) and **progressive drift**
(stretch/compress timing via two-anchor linear resync or one-click frame-rate conversion
such as 23.976↔25 fps). Convert between SRT and VTT, clean up overlaps/empty cues/stray
formatting, edit any cue by hand with live validation, then download the fixed file. Nothing
is ever uploaded — all processing happens locally on your device.

## 7. Target user

A viewer who downloaded a movie/show plus a separate subtitle file that doesn't line up —
often on macOS, Linux, ChromeOS, or mobile where the gold-standard desktop tool (Subtitle
Edit, Windows-only) isn't an option. Secondary: fansubbers/editors who want a quick,
trustworthy in-browser cleanup and resync without installing software.
