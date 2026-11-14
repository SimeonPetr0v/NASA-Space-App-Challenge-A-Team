# Manual measurement entry: evidence and policy

This is a noncommercial educational prototype, not flight-qualified medical
software. Input envelopes catch data-entry errors; they do not define human
survival limits, normal values, or safe ranges. The example instruments below
are not claimed to be installed on a spacecraft or qualified for cabin
pressure/microgravity. The science/medical owner must select actual instruments
and approve mission-specific settings before operational use.

| Input | Accepted numeric entry | Basis and limits of evidence |
|---|---|---|
| Resting heart rate | Whole 1–650 bpm | A 2012 case report describes an approximately 600 bpm ventricular conduction rate during a rare tachyarrhythmia. 650 is a data-entry buffer above that report, not a physiological maximum or normal exercise target. A value this high needs immediate medical review. |
| Blood pressure | Whole systolic 60–260, diastolic 40–215 mmHg; systolic > diastolic | Example OMRON HEM-7196T1 measurement specifications. Cuff inflation pressure is not the same as the measurement range. Confirm the actual onboard device. |
| SpO₂ | Whole 0–100% | Mathematical percentage bounds. Pulse oximeters have limited accuracy, particularly at low saturation; an accepted value is not necessarily accurate. |
| Temperature | 34–42.2 °C | Example Braun clinical thermometer numeric display envelope. This is not a survival range. The example is an ear thermometer, while the indicator instructions describe oral measurement; confirm the actual device and measurement site before use. |
| Blood glucose | Whole 10–600 mg/dL | Example Accu-Chek Active numeric range. A device HI/LO result is not an exact number and must not be replaced with a guessed boundary. |
| Sleep | 0–24 hours | Total actual sleep, including naps, in the last 24 hours; not time in bed. |
| Exercise | Whole 0–300 active minutes today | NASA reports ISS crew members average about two hours of exercise per day. ESA describes a 150-minute scheduled allocation that includes associated tasks. 300 is an app logging ceiling, not a biological maximum or prescription. Log active minutes only. Each entry is a daily total, not an additional session. |

Values outside a device envelope can represent a genuine emergency. The UI
blocks unsupported numeric entries and tells the user to check units and device
and seek crew medical support if the reading is genuine or the device reports
HI/LO. Never lower a value just to satisfy validation. Recording categorical
HI/LO results needs a future shared-contract extension; this version does not
silently invent a number. Existing saved readings remain in history even if
they exceed today's entry envelope.

## Assessment policy

Exercise below 120 or above 150 minutes produces **caution**, not automatic
medical danger or a recommendation to keep exercising. These are provisional
ISS reference values, not norms for lunar/Mars operations or every crew member.
A prescribed plan, illness, EVA, acclimatization, and equipment availability can
change requirements.

NASA reports altered thermoregulation in prolonged flight, including that core
temperature can rise by about 1 °C. This does not justify automatically
shifting oral/ear fever cutoffs by one degree. Existing clinical thresholds
remain provisional pending science review; a site-matched personal baseline and
mission medical protocol are still needed.

## Well-being check-in

The former single 1–5 mood input is retained only in legacy measurement
history. New well-being entries use the WHO-5's five statements, six frequency
choices (0–5), and original last-two-weeks recall period. All five answers are
required, none are preselected, and responses are stored separately from
legacy mood entries.

The score is the sum of the five answers multiplied by four (0–100). A raw
score below 13 (under 50/100) suggests further assessment; the demo shows
caution and offers crew medical/behavioral-health support. WHO-5 is not a
diagnosis, prediction of safety, or fitness-for-duty test. A high score does
not rule out distress. The instrument has not been validated here for
astronauts; a trained professional should interpret it in mission context.
Immediate support remains available regardless of score, and the app sends no
automatic messages.

WHO-5 item/response text © World Health Organization 2024, reproduced under
[CC BY-NC-SA 3.0 IGO](https://creativecommons.org/licenses/by-nc-sa/3.0/igo/) for
this noncommercial educational prototype. The license applies to the WHO-5
material; no WHO endorsement is implied. Source and attribution are shown in
the form. Raw answers stay in this browser's `localStorage`, not an encrypted
medical record; other users of the same browser profile can see them. There is
no server-side storage or sync.

## Sources

- [2012 extreme tachyarrhythmia case report](https://pubmed.ncbi.nlm.nih.gov/22368381/)
- [OMRON measurement specifications](https://www.omron-healthcare.com/storage/im1_2_web_hem-7196t1-fleo-en-02-11-2024.pdf)
- [FDA pulse oximeter limitations](https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics)
- [Braun temperature display specifications](https://www.braunhealthcare.com/wp-content/uploads/sites/4/irt6020_6030_6500_6510_om_a007471r1_r4_20jun22_manual.pdf)
- [Accu-Chek Active measurement range](https://www.accu-chek.com.ph/node/41/support)
- [NASA astronaut exercise](https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/)
- [ESA exercise countermeasures paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC4971634/)
- [NASA thermoregulation in space](https://www.nasa.gov/missions/station/heat-safety-in-space-keeps-infants-and-patients-safe-on-earth/)
- [WHO-5 instrument, license, recall period, and scoring](https://www.who.int/publications/m/item/who-ucn-msd-mhe-2024.01)
