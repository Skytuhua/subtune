# DESIGN NOTES — SubTune

The binding front-end design contract that Phase 4 implements to. Synthesized from the
generated design system (`design-system/MASTER.md` + page overrides + domain/stack deep-dives).
Page overrides win where they differ; otherwise MASTER governs.

## Pattern & style

**Linear/Vercel Minimalism** for a developer/utility audience. Philosophy: *clarity through
restraint — every element earns its place.* Monochromatic neutral base + a single blue accent,
sharp typographic hierarchy, generous whitespace, fast and purposeful micro-interactions.
**Dark-first** (the tool's primary surface), with a fully working light mode.

## Layout

- App shell: a focused single-column workspace, max content width **1200px**, centered.
- Two regions: a **control panel** (operations) and the **cue table** (data), arranged as a
  responsive split — side-by-side ≥1024px, stacked below.
- 12-column thinking with 24px gutters; collapse to single column on mobile.

## Spacing

- **4px base unit**, scale: 4, 8, 16, 24, 32, 48, 64. Generous padding (24–32px) on panels.
- Consistent vertical rhythm; no ad-hoc margins.

## Color tokens (exact)

Defined as CSS variables and consumed via Tailwind. Dark is default.

### Dark (default)
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0A0A0A` | app background |
| `--surface` | `#141414` | panels / cards |
| `--surface-2` | `#1C1C1C` | raised rows / inputs |
| `--border` | `#262626` | 1px low-opacity borders |
| `--text` | `#EDEDED` | primary text |
| `--text-muted` | `#A1A1A1` | secondary text |
| `--primary` | `#3B82F6` | accent / primary actions |
| `--primary-hover` | `#2563EB` | accent hover |
| `--success` | `#22C55E` | valid / applied |
| `--warning` | `#F59E0B` | overlap / drift warnings |
| `--danger` | `#EF4444` | invalid / negative duration |

### Light
| Token | Hex |
|---|---|
| `--bg` | `#FFFFFF` |
| `--surface` | `#F8F9FA` |
| `--surface-2` | `#F1F3F5` |
| `--border` | `#E5E7EB` |
| `--text` | `#1A1A1A` |
| `--text-muted` | `#4B5563` |
| `--primary` | `#0066FF` |

Contrast target **WCAG AA, ≥4.5:1** for body text. Color is never the *only* signal — pair
warning/danger colors with an icon or text.

## Typography

- **UI/Sans:** Inter (Google Fonts), weights 400/500/600. Tight letter-spacing on headings.
- **Mono:** JetBrains Mono (Google Fonts) for all **timestamps and numbers** (timing is the
  product's substance — monospace makes columns align and digits scannable).
- Scale ~1.25 (major third); body **16px** minimum; line-height 1.5 body.

## Key effects

- Subtle shadows only: `0 1px 3px rgba(0,0,0,0.1)`; rely on **1px borders** for separation.
- Border radius **6–8px** (never pill-shaped for primary controls).
- `backdrop-filter: blur(8px)` for overlays/sticky header.
- Smooth 150ms ease-out color/background transitions on interactive elements.
- Focus ring: **2px solid accent, 2px offset**, visible on every interactive element.

## Motion

- 150–250ms, ease-out. No autoplaying motion. **Respect `prefers-reduced-motion`** (disable
  non-essential transitions/animations).

## Anti-patterns to avoid (graded in review)

Emoji used as functional icons (use inline SVG), missing hover/active/disabled/focus states,
heavy drop shadows, saturated backgrounds, low-contrast text, tiny touch targets (<44px),
inconsistent spacing/radius, color-only error states, missing loading/empty/error states,
hardcoded colors instead of tokens, placeholder text used as the only label, disabled buttons
with no explanation, and content shifting on load.

## Pre-delivery checklist (must pass in Phase 5)

- [ ] Consistent 4px/8px spacing; limited palette (1 accent + grays)
- [ ] SVG icons (no emoji as icons); consistent icon style
- [ ] Hover / active / focus / disabled states on all controls; cursor feedback
- [ ] Visible keyboard focus; full keyboard navigation; semantic HTML + ARIA where needed
- [ ] Contrast ≥ 4.5:1; color never the only signal
- [ ] Loading / empty / error / success states present
- [ ] Responsive at 375 / 768 / 1024 / 1440 px
- [ ] `prefers-reduced-motion` respected
- [ ] Touch targets ≥ 44px
- [ ] Dark + light mode both correct
