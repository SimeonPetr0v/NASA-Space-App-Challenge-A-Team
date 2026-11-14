# Design direction — "Instrument panel, not dashboard"

Status: proposal for the UI lead to confirm (2026-11-14). Built from PRODUCT.md and the `astro-ui-design`, `frontend-design` and `impeccable` (Operate mode, craft floor) skills.

## 1. The idea in one sentence
The app should feel like a **piece of flight equipment for one's own body**: calm, exact, readable at a glance like a spacecraft caution-and-warning panel — not like a SaaS analytics dashboard and not like a sci-fi movie screen.

Why: the user is an astronaut mid-task in a lit cabin (day) or in a sleep shift (night). Judges score usability under *Validity*. Every hackathon team will ship "dark space dashboard with neon cards"; a precise, light, instrument-like tool stands out *and* is more credible.

## 2. Anti-goals (what would make it feel wrong)
- Grid of identical rounded cards with icon + number + label (the SaaS template)
- Starfields, glassmorphism, neon glows, gradient text, sci-fi fonts
- Big-number "hero metric" tiles and decorative sparklines
- Motion that plays for show; modals where an inline panel works
- Unicode/emoji as icons; colour as the only status signal

## 3. Layout (desktop ≥ 1024 px)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ STATUS STRIP  ▲ Caution · 3 items need attention   [Do now: re-measure  │
│               heart rate in 30 min]      Day 47 · Mars transit · ⇄ 14 min│
├────────┬─────────────────────────────────────────┬───────────────────────┤
│ RAIL   │  BODY (3D, focal element)               │  INSTRUMENTS          │
│ Overview│                                        │  Heart rate   108 bpm ▲│
│ Body    │        markers on organs                │  ├──[====|==]────┤     │
│ Log     │                                        │  Blood pressure 118/76●│
│ Trends  │                                        │  Oxygen sat.   97 %   ●│
│ Earth   │                                        │  ...                  │
│ Schedule│                                        │  [+ Log reading]      │
│         │                                        │                       │
│ ☾ Night │                                        │  Next check 07:30     │
└────────┴─────────────────────────────────────────┴───────────────────────┘
```
- **Status strip** (top, full width): overall status icon + word, how many items need attention, the single next action, mission day, mission mode and the Earth link delay. This is the 3-second answer.
- **Rail** (left, 72–200 px): Overview · Body · Log · Trends · Earth link · Schedule, plus the night-mode toggle at the bottom. Icons + labels, collapses to icons on medium screens.
- **Body** (centre): the 3D model is the one focal element. Selecting an organ opens its detail in the instruments column (no modal).
- **Instruments** (right): one panel, rows separated by hairlines — not cards. Each row: name · value · unit · status icon + word · **range gauge** · trend vs. baseline.
- **Tablet/mobile:** status strip stays on top; body and instruments stack; the rail becomes a bottom tab bar (5 items).

## 4. Signature components
1. **Range gauge** (replaces sparklines and hero numbers): a thin horizontal bar with the caution and danger zones drawn as segments and the normal band in the middle; a marker shows today's value and a faint tick shows the astronaut's own baseline. Reads as "where am I within safe limits" instantly.
2. **Status chip**: drawn icon + word, never colour alone — `CircleCheck` Nominal, `TriangleAlert` Caution, `OctagonAlert` Act now, `CircleDashed` Measure. (Lucide icons, already installed.)
3. **Earth-link chip**: "⇄ Earth link · 14 min one-way" — a small signal-dot animation only while a message is in transit.
4. **Guidance block** (inside an indicator's detail): *What we saw → Why it matters in space → Do now → Re-check in → Escalate if*, each one line.
5. **Log drawer**: slides in from the right over the instruments column; big steppers, the last value pre-filled, live status preview before saving.

## 5. Visual system (tokens — replace placeholders in `src/styles/tokens.css`)
### Type
One family for everything: **Public Sans** (SIL OFL; the typeface of the U.S. Web Design System — fitting for a NASA-adjacent tool, very legible, true tabular figures). Self-host via `@fontsource-variable/public-sans`.
- Scale (ratio 1.2, fixed rem): 12 · 14 · 16 (body) · 19 · 23 · 28 · 34
- Vital values 28–34 px semibold, `font-variant-numeric: tabular-nums`; units 14 px regular, muted
- Sentence case everywhere; no all-caps labels, no eyebrow labels above headings

### Colour — day ("cabin")
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#EEF1F3` | page (cool cabin grey, not cream) |
| `--surface` | `#FFFFFF` | panels |
| `--surface-2` | `#F6F8F9` | rail, strip, inputs |
| `--ink` | `#14202B` | text (deep navy-ink, not pure black) |
| `--ink-muted` | `#5B6B78` | secondary text (≥ 4.5:1 on white) |
| `--line` | `#D6DEE4` | hairlines |
| `--accent` | `#1F5AA6` | primary actions, selection, focus ring only |
| `--status-ok` | `#1E7F4F` | Nominal |
| `--status-caution` | `#B57800` | Caution (darkened amber for contrast on white) |
| `--status-danger` | `#C2342B` | Act now |
| `--status-none` | `#7A8894` | Measure / stale |

### Colour — night ("sleep shift", see `docs/night-mode.md`)
`--bg #140C08` · `--surface #1D130D` · `--ink #F0C9A0` · `--ink-muted #BF9A78` · `--line #3A2A1F` · `--accent #E39A4C` · ok `#BFAE5A` · caution `#E6A03C` · danger `#E2583A` · none `#8B7A66` — no blue anywhere; shape + word carry the status.

### Shape, depth, spacing
- Radius: 6 px controls, 10 px panels (not one radius for everything); pills only for chips
- Depth: panels separated by hairlines and `--surface` contrast; one soft shadow (`0 1px 2px rgb(20 32 43 / .06), 0 8px 24px rgb(20 32 43 / .06)`) only for the drawer
- Spacing scale 4 · 8 · 12 · 16 · 24 · 32 · 48; dense inside panels, generous between zones
- Hit targets ≥ 44 px; visible focus ring `2px solid var(--accent)` + 2 px offset

## 6. Motion
150–250 ms, ease-out (`--ease-out` token). Motion only for state: drawer open/close, camera zoom to an organ, a status changing (icon cross-fade), the Earth-link signal in transit. No page-load choreography. Respect reduced motion (already wired).

## 7. Screens (build order)
1. **Overview** — strip + body + instruments (the demo shot)
2. **Log reading** — drawer with steppers and live status preview
3. **Indicator detail** — gauge, 7/30-day chart with normal band and baseline, guidance block, how to measure, source
4. **Earth link** — Mars ↔ Earth split with message timeline (docs/flight-surgeon-view.md)
5. **Trends** — all indicators, small multiples sharing one time axis (mission days)
6. **Schedule** — today's checks, streak; reminders
7. **Night mode** — reduced layout (docs/night-mode.md)

## 8. How to work with the tools
- Before building a screen: `/impeccable shape <screen>` for the brief.
- After building: `/impeccable critique <screen>` and `/impeccable audit <screen>`; fix P0/P1.
- Motion: `animate` / `review-animations` (Emil Kowalski skills).
- Charts: follow the range-gauge and normal-band rules above; one message per chart.
- Every PR: the `astro-ui-design` checklist + a screenshot.
