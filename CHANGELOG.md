# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-05-30

First public release.

### Added
- **Import** SRT and VTT via drag-and-drop, file picker, or paste, with a tolerant parser
  (handles BOM, CRLF, missing/duplicate indices, WebVTT headers/NOTE blocks/cue settings, and
  cue text containing a bare `-->`).
- **Constant shift** of all cues by a signed offset (`+2.5`, `-1.2s`, `250ms`, `-0:02.500`).
- **Two-anchor linear resync** that corrects offset and drift together via an affine transform.
- **Frame-rate conversion** with common presets (23.976 ↔ 25, 24 ↔ 25, 29.97, …) and custom fps.
- **SRT ↔ VTT conversion** on export.
- **Cleanup**: sort, fix overlaps, remove empty cues, trim whitespace, strip formatting tags,
  minimum-duration enforcement, sequential renumbering.
- **Editable cue table** with live validation (overlaps, out-of-order, non-positive durations).
- **Undo / reset**, **copy to clipboard**, **download**, dark/light themes, responsive layout.
- Fully client-side and offline-capable: self-hosted fonts, no backend, no uploads, no tracking.
- 49 unit tests for the core engine and a 17-check Playwright end-to-end QA harness.

[1.0.0]: https://github.com/Skytuhua/subtune/releases/tag/v1.0.0
