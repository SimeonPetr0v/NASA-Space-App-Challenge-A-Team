# Indicator defaults (VERIFY each row before demo — science owner signs off)

All values are resting adult defaults for self-assessment, not diagnosis. Keep them in one data file in the code (e.g. `src/data/indicators.ts`) — never hard-code thresholds inside components.

| id | Indicator | Unit | Normal | Caution | Danger | Hazard | Measure on board | Default schedule | Source to cite |
|---|---|---|---|---|---|---|---|---|---|
| `hr` | Resting heart rate | bpm | 60–100 | 50–59 or 101–120 | < 40 or > 130 at rest | G, I, R | Pulse oximeter / watch | Morning + post-exercise | AHA; NASA HRP cardiovascular risk |
| `bp` | Blood pressure | mmHg | < 120 / < 80 | 120–139 or 80–89; or < 90/60 | ≥ 140 or ≥ 90; > 180 / > 120 = urgent | G | Cuff | Daily morning | AHA/ACC 2017 BP categories; HRP cardiovascular |
| `spo2` | Oxygen saturation | % | ≥ 95 | 91–94 | ≤ 90 | E | Pulse oximeter | Daily + on symptoms | Clinical pulse-oximetry norms; HRP hypoxia risk |
| `temp` | Body temperature | °C | 36.1–37.5* | 37.6–38.4 | ≥ 38.5 or < 35.5 | E (immune) | Thermometer | Daily | *Adjust with personal baseline — core temp ↑ ~1 °C in flight (Stahn 2017) |
| `glu` | Blood glucose (fasting) | mg/dL | 70–99 | 100–125 or 55–69 | ≥ 126 fasting / > 250 any; < 54 | E (nutrition) | Glucometer | Weekly or on symptoms | ADA Standards of Care |
| `sleep` | Sleep | h / 24 h | ≥ 7 | 6–6.9, or 2 nights < 7 | < 5, or 3+ nights < 6 | I | Self-report / watch | Every morning | NASA HRP sleep risk; Barger 2014 |
| `mood` | Mood | 1–5 | 4–5 | 3, or drop ≥ 2 vs baseline | 1–2, or 3 days ≤ 3 | I, D | 1-question check-in (+ optional short scale) | Daily | NASA HRP behavioral health risk |
| `mass` | Body mass change | % vs pre-flight | within ±2 % | −2 to −5 % | < −5 % | E, G | Body mass measurement device | Weekly | NASA HRP nutrition risk |
| `exercise` | Exercise | min / day | ≥ 120 | 60–119 | < 60 for 3+ days | G | Device log / manual | Daily | ISS countermeasure program (~2 h/day) |
| `rad` | Radiation dose | mSv (daily, cumulative) | under mission budget | > 80 % of mission budget, or solar event warning | > budget, or active solar particle event → shelter | R | Dosimeter | Continuous / daily | NASA-STD-3001 (600 mSv career); CSA radiation monitoring |
| `water` | Water intake | L / day | ≥ 2.0 | 1.5–1.9 | < 1.5 for 2+ days | E | Manual log | Daily | NASA nutrition guidance |

## Combination rules (escalate even if each single value is only caution)
- `temp` caution + `hr` caution → possible infection → notify crew medical officer.
- `spo2` caution + headache/dizziness symptom → check cabin CO₂/O₂ → escalate if persists after re-check.
- `mood` caution 3+ days + `sleep` caution → offer psych support + queue ground private conference.
- `bp` low + dizziness in partial gravity (Moon/Mars EVA, post-landing) → orthostatic intolerance → sit/lie down, fluids, re-measure.

## Environment modes (optional feature)
| Mode | Gravity | Exercise target | Comms delay to ground | Notes |
|---|---|---|---|---|
| ISS / LEO station | 0 g | ~120 min/day | seconds | Ground support close |
| Artemis / lunar orbit / surface | 0 g / 0.16 g | ~90–120 min/day (team decision, cite) | ~1.3 s | EVA days add fatigue |
| Mars transit | 0 g | ~120 min/day | ~4–22 min | Higher radiation, autonomy critical |
| Mars surface | 0.38 g | team decision, cite | ~4–22 min | Dust, partial gravity orthostatic risk |
