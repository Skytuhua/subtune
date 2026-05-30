# BUILD LOG — SubTune

A running, reconstructable journal of decisions, dead ends, fixes, and review findings.

---

## Phase 0 — Environment & capability setup

- **Platform:** Ubuntu 24.04, running as `root`. Working dir `/home/user`, writable.
- **Toolchain present:** git 2.43, Node 22.22, npm 10.9, Python 3.11, curl 8.5. Network OK (GitHub reachable).
- **Installed:** GitHub CLI (`gh` 2.93) via apt.
- **GitHub auth:** authenticated as account **Skytuhua** (full `repo` scope) via `gh auth login --with-token` (token piped over stdin, never echoed/committed). `gh auth setup-git` configured so `git push` uses it.
- **Git identity:** `Skytuhua <Skytuhua@users.noreply.github.com>` set globally. `commit.gpgsign=false` to avoid signing-source errors in a fresh repo.
- **Dynamic workflows:** **No `Workflow` runtime/tool is available in this environment.** Per the fallback directive, scale-heavy/parallel work uses ordinary `Agent` subagents and multi-pass self-review instead. Noted and proceeding.
- **Workspace:** scratch + project under `/home/user/work/`; project folder `subtune/`.

## Phase 1 — Discovery & research

- Ran targeted demand-validation web searches (cross-checked across forums, guides, and
  existing tools). Findings recorded in `RESEARCH.md`.
- **Decision:** build **SubTune**, a privacy-first, open-source, in-browser subtitle timing
  fixer. Chosen over EXIF remover / GPX toolkit on the strength of evergreen, heavily
  documented demand and a clear gap (existing free tools are fragmented, mostly closed-source,
  and the powerful two-anchor / FPS resync is stuck on Windows desktop software).

## Phase 2 — Scaffolding

- Created `subtune/`, `git init`, signing disabled.
- Wrote `SPEC.md`, `ARCHITECTURE.md`, `.gitignore`, `LICENSE` (MIT, © Skytuhua).

## Phase 3 — Dependencies

- Stack: React 18 + TypeScript + Vite 5 + Tailwind 3, Vitest for tests, ESLint + Prettier.
- All pinned in `package.json`; `npm install` OK (212 packages). Dev binaries present
  (vite, vitest, tsc, eslint, prettier).
- Note: an earlier `npm install` ran in the wrong cwd (working dir had drifted between calls);
  re-ran with an absolute path. Lesson logged: always cd with absolute paths in one command.

## Phase 3.5 — UI/UX design (ui-ux-pro-max workflow)

- Cloned the design engine to `/home/user/work/uipro` (outside the project). Smoke-tested
  `src/ui-ux-pro-max/scripts/search.py` — works.
- Step 1 brief: developer utility / subtitle timing editor, dark + privacy-first, stack `react`.
- Step 2: generated `design-system/MASTER.md` (all required sections present: pattern, colors
  w/ hex, typography, effects, anti-patterns, pre-delivery checklist).
- Step 2b: per-page overrides `design-system/pages/editor.md` and `landing.md`.
- Step 3: domain deep-dives (`style`, `color`, `typography`, `ux`) + Step 4 `--stack react`,
  folded into the notes.
- Step 5: wrote `DESIGN_NOTES.md` — the binding contract: Linear/Vercel Minimalism, dark-first,
  blue `#3B82F6` accent on neutral grays, Inter + JetBrains Mono, 4px spacing grid, 6–8px radius,
  subtle borders/shadows, 2px focus rings, reduced-motion respected.
- No skill files copied into the project; no attribution to the generator anywhere (per rules).

## Phase 4 — Build (in progress)

- Configuring Tailwind tokens → base styles → pure core lib (`src/lib`) + Vitest specs →
  React UI implementing the design contract.
