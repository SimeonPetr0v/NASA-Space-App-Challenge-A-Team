# Sleep-shift night mode — plan

Status: **committed feature** (decided 2026-11-14). Owner: Design & UI + one Logic dev. Estimate: 2–3 h if all colours are tokens from the start.

## Why it exists (say this in the demo and on the project page)
- Crews sleep in shifts and see ~16 sunrises a day on the ISS, so their circadian rhythm drifts. NASA HRP lists **"Risk of Inadequate Sleep and Irregular Schedules"** as its own risk (Isolation hazard in RIDGE). ISS crews average ~6 h sleep against 8.5 h scheduled (Barger et al., *Lancet Neurology* 2014).
- Blue-rich light suppresses melatonin and delays sleep. NASA already treats light as a countermeasure on the ISS: the station's solid-state lighting has different settings for general work, alertness and pre-sleep (red-shifted). *Science owner: confirm and cite the NASA source before it goes on a slide.*
- So a bright, blue-heavy health app opened at 03:00 works against the astronaut. Night mode is a countermeasure, not a dark theme.

## Behaviour
| Trigger | What happens |
|---|---|
| Crew sleep window from mission settings (default 21:30–06:00 mission time) | 60 min before: "Pre-sleep" banner offers the switch. At sleep start: switches automatically. At wake: switches back and asks for sleep hours + quality. |
| Manual toggle (moon icon in header, keyboard reachable) | Switches immediately; the manual choice wins until the next window. |
| Any **danger** status while in night mode | Stays in night mode, but the alert is shown at full priority with escalation (never hidden to keep things calm). |

## What the screen shows in night mode
Only the essentials, large and calm:
1. Overall status (glyph + word + one line).
2. One next action if anything is off.
3. Three quick actions: **Log night waking** (time + why: noise, temperature, worry, bathroom), **Quick vitals** (HR / SpO₂ only), **I feel unwell** (goes straight to escalation).
Hidden: charts, gamification, the full body figure (shown as a static silhouette with markers only), non-urgent reminders.

## Visual rules
- Tokens under `[data-theme="night"]` in `src/styles/tokens.css`; components never hard-code colours, so night mode is mostly a token swap.
- No blue or cyan anywhere: warm near-black background, amber/red-shifted text, low overall luminance.
- Status hues converge in warm light, so in night mode **shape + word carry the status** (colour + shape + word rule already requires this). Check that caution vs danger are still distinguishable.
- Text contrast still ≥ 4.5:1 (amber on near-black passes; verify with a checker).
- No ambient motion; transitions ≤ 150 ms; respect reduced motion. Only a danger alert may pulse, once.
- Optional: CSS `filter` is not allowed as the implementation (it breaks contrast checks); use real tokens.

## Data it feeds
- Sleep start/end and night wakings → `sleep` indicator (hours, wakings count, quality 1–5).
- Morning prompt after night mode ends is the main way sleep data gets logged → improves the sleep trend chart.

## Build steps
1. Define day + night token sets on day one (design kickoff).
2. Theme state (`day | night | auto`) in the store; `auto` checks the sleep window every minute.
3. Night layout component (simplified home).
4. Wake-up prompt → writes a sleep reading.
5. Demo moment: mission clock jumps to 22:00 → pre-sleep banner → night mode → "I feel unwell" → escalation with Mars delay.

## Acceptance checklist
- [ ] Toggle reachable by keyboard and screen reader ("Night mode, on")
- [ ] No blue in night palette (inspect every token)
- [ ] Contrast ≥ 4.5:1 for text in night mode
- [ ] Danger alerts still escalate in night mode
- [ ] Wake-up prompt saves a sleep reading
- [ ] Works at 375 px and 1440 px
