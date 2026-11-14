---
name: spaceapps-rules
description: Official 2026 NASA Space Apps rules, judging rubric, submission form fields and hard limits for the "Create Health Monitoring Software for Astronauts on Space Missions" challenge. Use whenever deciding scope, prioritising features, writing the project page, or checking whether something is allowed (team size, deadline, SI/AI use, NASA branding, video/slide limits, English requirement).
---

# NASA Space Apps 2026 — rules that constrain our project

Sources (read 2026-11-13): challenge page `spaceappschallenge.org/2026/challenges/health-monitoring-software/`,
`/resources/project-submission-guide/`, `/resources/judging-awards-guide/`, `/resources/participant-faqs/`.
If anything here conflicts with the live site, the live site wins — re-check it.

## The challenge, in one line
Build a **visual tool** that gathers health indicators and lets astronauts **assess** their own health on long missions and **act** on it (guidance on treatment / improvement).

### What NASA explicitly asks or suggests
- Input of any kind: keyboard, clicks, camera images. Any data counts if it is a health indicator (e.g. blood sugar mg/dL, ultrasound images).
- Example indicators: blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, mood.
- Use NASA Human Research Program (HRP) resources + other space agencies to decide which indicators matter.
- Questions the solution should answer:
  1. Which measurements can be performed in space?
  2. Why is an exam needed?
  3. How do spaceflight hazards affect these indicators?
  4. When does a result warrant attention from the crew or flight surgeons on the ground?
  5. What actions prevent a critical condition?
- **UI design plays an important role.** Animations and interactivity encouraged. NASA's own example: a human figure with clickable body parts showing function + health status.
- Optional: different environments (spacecraft, station, rover, Moon/Mars base); routine prompts to measure/act; gamification; dynamic charts over time; colour coding; simple explanations for non-experts.

### Official resources (cite these — Relevance score depends on real NASA data use)
- NASA HRP 5 Hazards: https://www.nasa.gov/hrp/hazards/
- NASA HRP Risks: https://www.nasa.gov/hrp/risks/
- Ongoing HRP research: https://www.nasa.gov/hrp/ongoing-hrp-research/
- CSA radiation monitoring: https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- CSA why science in space: https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
- Challenge video: https://www.youtube.com/watch?v=RERG3gEmdC8 (3 min, restates the brief)

## Hard limits (breaking any = not eligible for Global Judging)
- Max **6 members**, all registered for the **same Local Event** (not waitlisted), all on the team Members tab.
- Submission window: **Sat 14 Nov 2026 09:00 → Sun 15 Nov 2026 23:59**, local time of our Local Event. Click **"Submit for Judging"**; only the last saved submission is judged.
- Demo: **video ≤ 30 s** OR **slide deck ≤ 7 slides** (title + intro count). Hosted externally (YouTube / Drive / GitHub), public, no login.
- **English** on the project page and all linked material. Video may be spoken in Bulgarian only with **English subtitles**. Slides must be English.
- Final project link must be public with no login (GitHub Pages / Vercel / Netlify + public repo).
- Must use **at least one NASA data source or resource** to be eligible for a Global Award.
- All external code, text, images, fonts, icons, 3D models (even open source) listed in **References**. No copyrighted media without permission.
- No images/video/voice of anyone **under 18**.
- SI ("Super Intelligence" = AI) is allowed, but: must be disclosed; SI must not be used to come up with the idea itself; **SI-generated images/video need a visible watermark**; SI audio/code/data acknowledged in text/metadata; **no NASA logos, flags, mission identifiers** in generated content.

## Project page fields (judges read this — the more complete, the better)
1. Project Name
2. High-Level Project Summary — what, how it addresses the challenge, why it matters
3. Link to Project Demo (30 s video or ≤7 slides)
4. Link to Final Project
5. Detailed Project Description — what it does, how it works, benefits, goals, tools/languages
6. Use of SI — how AI tools were used (not shown to judges, but SI indicators in the project are)
7. NASA Data — specific NASA data/resources used
8. Space Agency Partner Data & Other References — everything else used
Images (JPG/PNG/GIF ≤10 MB) can be pasted into the page — use real screenshots.

## Judging rubric — each scored 1–5, at every level
| Criterion | What a 5 looks like | What it means for us |
|---|---|---|
| **Impact** | Significant problem, broad reach, could change things | Frame it beyond ISS: Mars crews, remote/Antarctic stations, rural telemedicine on Earth |
| **Creativity** | Novel approach, not attempted before | One signature idea nobody else has (see "differentiators" in `docs/research-bg.md`) |
| **Validity** | Scientifically sound, technically feasible, fully developed, **usable and user-friendly** | Thresholds with sources; app actually works end-to-end; UX polish counts here too |
| **Relevance** | Directly addresses the challenge; **NASA data integral, not superficial** | Every feature maps to an HRP hazard/risk; cite HRP pages in-app |
| **Presentation** | Clear, engaging storytelling; demo + full project | Guide explicitly says: give presentation **equal** attention, recruit design/storytelling skills |

Global awards (from Global Finalists): Best Use of Science, Best Use of Data, Best Use of Technology, Galactic Impact, Best Mission Concept, Most Inspirational, Best Storytelling, Global Connection, **Art & Technology** (technical + creative — our best fit with a strong design), Local Impact.

Timeline after hackathon: Global Nominees 3 Dec 2026 → Finalists & Honorable Mentions 17 Dec 2026 → Winners 26 Jan 2027.

## Non-negotiable product stance
The software **supports self-assessment and decides when to escalate** to crewmates / flight surgeons. It **does not diagnose or treat**. Say so in the UI and on the project page.
