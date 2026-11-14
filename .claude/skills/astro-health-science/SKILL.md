---
name: astro-health-science
description: Science backbone for the astronaut health monitor — RIDGE hazards, which indicators can be measured in space, default normal/caution/danger thresholds, baseline-drift logic, and the guidance/escalation text for each status. Use when implementing the assessment engine, writing explanations or tooltips, choosing indicators, writing the "Scientific basis" slide, or answering "is this value worrying?".
---

# Astronaut health science — what the engine and the copy must get right

## Ground rules
- Every threshold shown in the app must carry a **source** (shown in an info tooltip and listed in References). Use the table in `reference/indicators.md` as the starting point; the science owner verifies each row before it reaches slides.
- Thresholds are **app defaults for self-assessment, not medical criteria**. Wording: "outside your usual range", "consider", "contact flight surgeon" — never "you have X".
- Use **three states** everywhere: `normal` / `caution` / `danger` (plus `no-data` and `stale` — a reading older than its schedule).
- Spaceflight changes are **slow**. A value can be "normal" by population ranges and still be a warning because it drifted from *this astronaut's* baseline. The engine must evaluate both:
  1. **Absolute range** check (table in `reference/indicators.md`).
  2. **Personal baseline** check: compare to the astronaut's pre-flight / first-week baseline (rolling median). Default: deviation > 10 % → caution, > 20 % → danger, unless the indicator row says otherwise. Show the trend arrow.
  3. **Overall status = worst of all indicators**, but show which one caused it.

## RIDGE — NASA HRP's five hazards (https://www.nasa.gov/hrp/hazards/)
| Hazard | Body effects | Indicators that reveal it |
|---|---|---|
| **R**adiation | Cancer risk, CNS effects, acute radiation sickness during solar particle events, cardiovascular | Dosimeter dose (mSv/day, cumulative vs career limit), fatigue, nausea |
| **I**solation & confinement | Stress, depression, conflict, poor sleep | Mood, sleep, stress self-report, crew-interaction check-in |
| **D**istance from Earth | Delayed help: Mars one-way comms ~4–22 min, no evacuation | Escalation logic must be **autonomous**; queue messages to ground |
| **G**ravity fields | Bone loss (~1–1.5 %/month in weight-bearing bones), muscle loss, fluid shift to head, cardiovascular deconditioning, SANS (eye/brain), orthostatic intolerance on landing | Blood pressure, heart rate, body mass, exercise minutes, vision check |
| **E**nvironment (hostile, closed) | Elevated CO₂ (headaches), microbes, noise, limited food/water, immune changes | Temperature, SpO₂, hydration, calories, symptoms checklist |

HRP risks that map to the challenge (https://www.nasa.gov/hrp/risks/): altered immune response; cardiovascular adaptations; reduced cardiorespiratory & musculoskeletal fitness; spaceflight-induced bone changes; SANS; inadequate food & nutrition; hypoxia; behavioral changes & psychiatric disorders; inadequate sleep & irregular schedules; inadequate teamwork.

## Answering NASA's five questions (put these in the app's "Why?" panels and on a slide)
1. **Which measurements are possible in space?** Cuff BP, pulse oximeter (HR + SpO₂), thermometer, glucometer, body-mass measurement device (no scales in microgravity — ISS uses an inertial/spring mass device), self-reported sleep/mood, dosimeter, exercise logs from ISS-style devices, ultrasound (used on ISS with remote guidance).
2. **Why an exam?** Changes are gradual and invisible early; ground support is delayed; early action (exercise, hydration, sleep, shielding) prevents critical states.
3. **How do hazards affect indicators?** Use the RIDGE table above; each indicator detail view should name its hazard(s).
4. **When to escalate?** `caution` → self-care action + re-measure on a schedule; `danger`, or caution that persists across N re-measurements, or a combination (e.g. high HR + fever) → notify crew medical officer and queue a message to flight surgeons.
5. **Prevention?** Exercise (~2 h/day on ISS), hydration, nutrition, sleep hygiene and light schedule, storm shelter during solar events, CO₂ awareness, social/psych support.

## Guidance text pattern (every non-normal status needs one)
`What we saw` → `Why it matters in space` → `Do now` (1–3 concrete actions) → `Re-check in` (time) → `Escalate if` (rule).
Keep each part ≤ 1 sentence. Astronauts are busy; glanceable first, detail on tap.

## Space-specific facts worth showing (each needs a citation on the slide)
- Core body temperature rises ~1 °C during long-duration flight (Stahn et al., *Scientific Reports* 2017) — so a fixed Earth fever threshold is not ideal; baseline matters.
- ISS crews average ~6 h sleep vs 8.5 h scheduled (Barger et al., *Lancet Neurology* 2014).
- Bone mineral density in hip/spine drops ~1–1.5 % per month without countermeasures (NASA HRP bone risk).
- NASA career radiation limit: 600 mSv effective dose (NASA-STD-3001 Vol. 1). Mars transit ≈ 1.8 mSv/day measured by MSL RAD (Zeitlin et al., *Science* 2013).
- Mars comms delay ~4–22 min one way depending on orbital geometry.

See `reference/indicators.md` for the threshold table.
