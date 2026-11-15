# Project page texts (copy into the Space Apps submission form)

Keep these consistent with the README. (These texts were used for the submission form.)

## Project name
Khonsu

## High-level summary
On a Mars mission the nearest doctor can be 20 light-minutes away, so astronauts must notice health changes and act on their own. Khonsu is a visual self-check for astronauts: they log a few readings (heart rate, blood pressure, oxygen, temperature, glucose, sleep, mood, exercise, plus radiation dose), and the app compares each with safe ranges and with the astronaut's own baseline. It shows the result at a glance in colour, shape and word, gives the one thing to do now, and says when to tell the crew medical officer or the flight surgeons on Earth — with the real light delay. An on-device AI, TOT, explains the data offline. Khonsu supports self-assessment; it does not diagnose.

## Final project link
https://simeonpetr0v.github.io/NASA-Space-App-Challenge-A-Team/
(Code: https://github.com/SimeonPetr0v/NASA-Space-App-Challenge-A-Team)

## Detailed project description
**What it does.** Khonsu turns a few daily measurements into a clear status and a concrete next step. The Overview opens on a *Quick check*: overall status, the single next action, and only the off-nominal readings. *Show details* adds trend watch, the radiation budget (career dose against NASA's 600 mSv limit), an interactive 3D body and the full readings table. The crew medical officer gets a *Crew board* with every crew member, worst first. Reports go to Mission Control through an *Earth link* that uses the real one-way light delay (14 min on a Mars transit), and a demo clock (×600) shows the flight surgeon's reply. *Ask TOT* answers questions about the astronaut's own data, offline, with sources.

**How it works.** (1) Input: manual entry with safe entry envelopes, a camera pulse measurement (fingertip on the camera, live trace; an estimate, not a medical device), and a WHO-5 well-being check-in. (2) Assessment: every reading is checked against an absolute range with a cited source *and* against the astronaut's personal baseline; slow drifts are flagged before a limit is crossed, and combinations (e.g. raised temperature with raised heart rate) raise the level. (3) Status: nominal / caution / act now. (4) Guidance: do now · re-check in · escalate if. (5) Escalation: self-care → crew medical officer → flight surgeon. The rules and thresholds live in one data file, each with its source URL.

**Design decisions.** Status is always colour + shape + word, so it works for colour-blind users, in glare and in low light. One action at a time, because astronauts are busy. Three themes: Light, Dark and a warm, low-blue *Sleep-shift* theme for night checks. A sun-and-planets page menu for one-handed use. The 3D body (bones and organs from open anatomy models) connects each reading to the body system and the spaceflight hazard behind it. Everything runs on the device with no backend and works offline as an installable web app — important when the link to Earth is slow or down.

**TOT, the on-device assistant.** TOT runs open language models in the browser (WebGPU; a smaller processor model on phones). To avoid invented numbers, Khonsu writes the measured values and "what to do" itself; the model only explains, and every answer lists its sources from the app's library.

**Benefits.** Earlier detection of slow changes, faster correct action without waiting for Earth, less load on the flight surgeons, and a clear record for the crew medical officer. The same approach fits Antarctic stations, ships, and remote clinics on Earth.

**Tech stack.** React 19, TypeScript, Vite, Tailwind CSS v4 + shadcn/ui, Motion, three.js (React Three Fiber), WebLLM and Transformers.js, PWA. Hosted on GitHub Pages.

**Next steps.** Wearable and medical-device input (Bluetooth), validated algorithms reviewed by flight surgeons, more indicators (e.g. intraocular pressure for SANS), and a secure, delay-tolerant sync to Mission Control.

## Use of Artificial Intelligence (AI)
The idea, scope, science choices and design direction are the team's. We used Claude Code (Anthropic) as a coding assistant for the web app, the 3D model build scripts, tests and documentation drafts, and to edit the demo video (recording scripts, composition and subtitles); the team reviewed every change, and AI-assisted commits say so. The in-app assistant TOT runs open models (Llama 3.2 1B, Qwen 2.5, SmolLM2) on the user's device; Khonsu supplies all numbers and TOT only explains and cites sources. No AI-generated images and no AI voice are used: the video voice-over is a team member's own voice.

## NASA data
- **NASA HRP — 5 Hazards of Human Spaceflight (RIDGE):** every body system and indicator is mapped to a hazard; shown in the 3D body details and the Mission brief.
- **NASA HRP — Risks of Human Spaceflight:** indicator-to-risk mapping and the "why it matters" texts.
- **NASA HRP — Risk from Inadequate Sleep and Irregular Schedules:** sleep context, fatigue trend and the Sleep-shift mode.
- **NASA HRP — Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness** and **NASA — Astronaut Exercise:** exercise target and the "exercise dropped" trend.
- **NASA OCHMO technical brief — radiation protection (NASA-STD-3001):** the 600 mSv career limit in the radiation budget and TOT's library.
- **NASA — Heat Safety in Space:** thermoregulation context for body temperature.
- Partner agency: **CSA — Monitoring Radiation for Astronaut Health** (radiation indicator).

## Space Agency Partner & Other Data
- CSA — Monitoring Radiation for Astronaut Health.
- Mars cruise radiation dose rate (1.84 mSv/day) measured by MSL RAD (Zeitlin et al., Science 2013); Mars surface (Hassler et al., Science 2014).
- HuBMAP Human Reference Atlas 3D organs (CC BY 4.0) and BodyParts3D (CC BY 4.0) for the 3D body.
- American Heart Association and American Diabetes Association for blood pressure, heart rate and glucose ranges.

## References
Full list with links and licences: https://github.com/SimeonPetr0v/NASA-Space-App-Challenge-A-Team/blob/main/docs/references.md
Main items: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Motion, Lucide icons, three.js, React Three Fiber, drei, WebLLM, Transformers.js, Llama 3.2 1B, Qwen 2.5, SmolLM2, HuBMAP HRA 3D organs, BodyParts3D, fonts Oxanium / Space Grotesk / JetBrains Mono (SIL OFL), NASA HRP pages above, AHA, ADA, CSA, Playwright and FFmpeg (video).
