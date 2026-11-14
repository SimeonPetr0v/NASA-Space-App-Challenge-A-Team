# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript, shipped as a Progressive Web App (installable, works offline). Data stays on the device (localStorage); no backend for the hackathon build. Deployed to a public URL (GitHub Pages or Vercel) because judges must open it without login or install. Confirmed by the team on 2026-11-14.

## Users

Primary: an astronaut on a long-duration mission (space station, lunar base, Mars transit or Mars surface), checking their own health between mission tasks on a tablet or laptop. Busy, possibly tired or in a sleep shift, not a medical expert. Their job: answer "am I OK, and if not, what do I do now?" in seconds, then understand why and know when to involve the crew medical officer or flight surgeons on Earth.

Secondary (evaluation context): NASA Space Apps judges with no prior context, reviewing the live app, a 30-second demo and the project page.

## Product Purpose

A visual self-assessment tool for astronaut health. The astronaut logs health indicators (heart rate, blood pressure, SpO₂, temperature, blood glucose, sleep, mood, and optional mass, exercise, hydration, radiation dose). The app rates each as normal, caution or danger, shows the state at a glance, gives concrete guidance (rest, hydrate, exercise, re-measure) and decides when to escalate to the crew medical officer or flight surgeons. It supports self-assessment; it does not diagnose or treat.

Success: a judge or astronaut understands overall status, the off-nominal indicator and the next action within three seconds, and every threshold and recommendation is traceable to a NASA or space-agency source.

## Positioning

Two committed differentiators:

1. **Mission mode.** The same astronaut is assessed differently on the ISS, in lunar operations, in Mars transit and on Mars: gravity changes exercise targets and orthostatic risk, the radiation budget changes, and the communication delay to Earth (seconds near Earth, ~4–22 min one way at Mars) changes escalation. Far from Earth the app has to tell the astronaut what to do while the message to the flight surgeon is still travelling.
2. **Interactive body figure.** NASA's own suggested interaction, made central: body regions (brain/mood and sleep, eyes, heart, lungs, bones and muscles, immune/temperature, whole-body radiation) are selectable and carry their status, and each opens the indicator's value, trend, the spaceflight hazard behind it, how to measure it and what to do.

3. **Sleep-shift night mode** (committed 2026-11-14). A circadian countermeasure, not a dark theme: during the crew sleep window the app drops blue light and shows only status, one action and quick night actions; danger alerts still escalate. Plan: `docs/night-mode.md`.

Considered but not committed: personal-baseline drift alerts. May be added if time allows; do not present it as core.

## Operating Context

- Use happens inside the mission routine: scheduled morning checks, post-exercise checks, and prompted re-measurements after a caution result.
- Measurements possible on board: cuff blood pressure, pulse oximeter (heart rate, SpO₂), thermometer, glucometer, body-mass measurement device (no scales in microgravity), self-reported sleep and mood, dosimeter, exercise device logs.
- NASA HRP frames the risks as five hazards (RIDGE): Radiation, Isolation & confinement, Distance from Earth, Gravity fields, hostile closed Environment. Every indicator maps to at least one.
- Evaluation: NASA Space Apps judging on Impact, Creativity, Validity (including usability), Relevance (NASA data integral) and Presentation. Hackathon 14–15 Nov 2026; demo limited to 30 s video or 7 slides; everything judges see in English.

## Capabilities and Constraints

- Required core: data input (keyboard/clicks, optionally camera or file); assessment against ranges → normal / caution / danger; at-a-glance visual status; guidance and escalation for every non-normal state.
- Planned beyond core: mission mode, interactive body figure, charts over time, measurement reminders. Also committed: sleep-shift night mode. Optional if time allows: gamification (streaks, original mission-patch style badges, no crew leaderboards), personal baseline.
- Thresholds and guidance live in one data file with a source URL per row (see `.claude/skills/astro-health-science`). They are self-assessment defaults, not medical criteria; the science owner verifies them.
- Language: "outside the usual range", "consider", "contact flight surgeon"; never "you have X". A visible disclaimer states the app does not diagnose.
- No NASA logos, insignia or mission identifiers. AI-generated images carry a visible watermark. No imagery or voices of people under 18.
- Undecided: product name.

## Evidence on Hand

- NASA HRP hazards and risks pages, CSA radiation monitoring article (listed in `docs/references.md`).
- Indicator threshold table with sources: `.claude/skills/astro-health-science/reference/indicators.md` (pending science sign-off).
- No real astronaut data, testimonials or clinical validation exist. Demo data is synthetic and must be labelled as such; never imply endorsement by NASA or any agency.

## Product Principles

1. Glance first, explain on demand: status and next action before detail.
2. Every number is accountable: unit, time measured, threshold source.
3. Act, don't alarm: each warning comes with what to do now, when to re-check and when to escalate.
4. Distance changes the answer: guidance accounts for how far help is.
5. Support judgment, never replace it: self-assessment and escalation, no diagnosis.

## Accessibility & Inclusion

- Status is never colour alone: colour + shape + word.
- Text contrast ≥ 4.5:1, status glyphs ≥ 3:1, in every theme.
- Full keyboard path; body regions are focusable buttons with descriptive labels.
- Hit targets ≥ 44 px (fatigue, possible gloves); respects reduced motion.
