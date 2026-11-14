---
name: astro-ui-design
description: Design system, UX rules and design-review checklist for the astronaut health monitor (status semantics, glanceability, interactive body figure, charts, motion, accessibility, night mode). Use for ANY UI work in this repo — new screens, components, colours, typography, charts, animations — and before merging UI PRs. Pairs with the general `frontend-design` skill (use its two-pass plan → critique process).
---

# Astronaut health monitor — design rules

Design is scored twice: under **Validity** ("usable and user-friendly") and **Presentation**. NASA's brief says UI "plays an important role". Treat design as a feature, not a coat of paint.

## 1. Who and where
- User: an astronaut mid-mission, busy, maybe tired, maybe in a sleep shift, on a tablet or laptop (ISS crews use tablets). Not a doctor.
- Primary job: **"Am I OK? If not, what do I do now?" answered in under 3 seconds.**
- Secondary: understand why, see trends, learn how to measure.

## 2. The glance test (every screen must pass)
Show the screen for 3 seconds to a teammate who has not seen it. They must be able to say: overall status, which indicator is off, and the next action. If not, simplify.

## 3. Status semantics — the most important visual system
| State | Colour role | Shape | Word | Use |
|---|---|---|---|---|
| normal | `--status-ok` | ● circle | "Nominal" | quiet, low emphasis |
| caution | `--status-caution` | ▲ triangle | "Caution" | draws the eye |
| danger | `--status-danger` | ◆ diamond / octagon | "Act now" | strongest, never decorative |
| no data / stale | `--status-none` | ○ hollow | "Measure" | invites action, not alarm |

Rules:
- **Never colour alone** — always colour + shape + word (≈8 % of men are colour-blind; judges will notice).
- Status colours are reserved: don't use the caution/danger hues for brand, links or decoration.
- Use NASA-style spaceflight vocabulary where it is clearer, e.g. "Nominal", "Off-nominal", "Mission elapsed time" — but keep guidance in plain language.
- Contrast: text ≥ 4.5:1, status glyphs ≥ 3:1 in both light and dark themes.

## 4. Information hierarchy (default home screen)
1. Overall status band + the one action to take now.
2. Interactive body figure (the signature element) with status markers on organs/systems.
3. Indicator tiles: value, unit, status glyph, trend arrow vs personal baseline, time since measured.
4. Schedule: next measurement due, streak.
Detail view (tap a body part or tile): current value → 7/30-day chart with normal band shaded → "Why it matters in space" (RIDGE hazard) → "How to measure" → guidance → source link.

## 5. The interactive body figure (NASA's own example — make it ours)
- Regions: brain/mood & sleep, eyes (SANS), heart (HR, BP), lungs (SpO₂), bones/muscles (mass, exercise), immune/temperature, whole-body radiation.
- SVG with real `<button>` or `role="button"` regions, keyboard focusable, `aria-label` with status ("Heart, caution, heart rate 112").
- Hover/focus highlights the region; click opens the detail panel *beside* the figure (desktop) or as a bottom sheet (mobile).
- Status glyph sits on the region; subtle pulse only on `danger`.
- Idea for wow: show the **fluid shift** (more fluid in the head in 0 g) and **bone density** as a visual layer that changes with mission day / gravity mode.

## 6. Charts
- One message per chart. Shade the normal band; plot the personal baseline as a dashed line; mark caution/danger points with their glyph.
- Time axis in mission days ("Day 34"), not just dates.
- No 3D, no pie charts for vitals, no dual axes. Label units on the axis.
- Load the `dataviz` skill if available before building charts.

## 7. Visual direction (decide in a 20-min design kickoff, then freeze tokens)
Use the `frontend-design` two-pass process: write a token plan (4–6 hex colours, type, layout sketch, principles), critique it against the brief, then build.
Avoid the default every space team will ship: near-black background + neon accent + starfield + glassmorphism cards. Stand out instead. Suggested direction to evaluate first:
- **"Cabin daylight"**: light, calm, clinical-but-warm theme inspired by the white padded interiors of a station module and spacesuit fabric; one restrained accent; status colours do the talking.
- **"Sleep shift" night mode**: dim, low-blue, warm-red-shifted theme for use during crew sleep periods (ties to circadian disruption — sleep risk). This is a feature with a scientific reason, not just a dark theme.
Tokens live in one file (`src/styles/tokens.css`): `--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--status-ok|caution|danger|none`, `--radius-s|m|l`, `--space-1..8`, font families. Components use tokens only — no raw hex in components.

Typography: one characterful family for headings/numbers (vitals are numbers — pick a face with good tabular figures), one readable text face. Numbers use `font-variant-numeric: tabular-nums`. Body ≥ 16 px; vital values large (≥ 32 px).

## 8. Motion
- One orchestrated moment: e.g. on load, the body figure "scans" top-to-bottom and markers appear in order.
- Status change animates once (value counts, glyph morphs). No looping decoration.
- Respect `prefers-reduced-motion`.

## 9. Interaction & input
- Data entry: big steppers/sliders with sensible defaults (last value), unit shown, instant validation and immediate status preview before saving.
- Hit targets ≥ 44 px (gloves/fatigue). Full keyboard path. Visible focus ring.
- Empty states invite action ("Log your first morning check — takes 40 s").
- Errors say what went wrong and how to fix it.
- Copy: sentence case, active verbs, buttons say exactly what happens ("Save reading", "Notify flight surgeon").

## 10. Gamification (if built) — keep it dignified
Streaks for measurement routine and exercise, mission-patch-style badges (original art, no NASA insignia), crew-level goals rather than leaderboards between crewmates (teamwork risk).

## 11. Design review checklist (run before merging any UI PR)
- [ ] Passes the 3-second glance test
- [ ] Status uses colour + shape + word; contrast checked in both themes
- [ ] Only tokens used; no stray hex / px spacing outside the scale
- [ ] Works at 375 px wide and 1440 px wide; no horizontal scroll
- [ ] Keyboard-only path works; focus visible; body regions have aria-labels
- [ ] `prefers-reduced-motion` respected
- [ ] Every number has a unit; every threshold has a source link
- [ ] No NASA logo/insignia; any AI-generated image carries a visible "AI-generated" watermark
- [ ] Screenshot attached to the PR (before/after)
- [ ] For major screens: `/impeccable critique` and `/impeccable audit` run, P0/P1 findings fixed; motion checked with `review-animations`
