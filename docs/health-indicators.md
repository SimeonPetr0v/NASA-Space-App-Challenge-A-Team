# Health indicators

This document explains the health indicators shown in the prototype, why they
may matter during spaceflight, and how a crew member could record them. The
reference ranges below are general adult values established on Earth. They are
not validated spaceflight limits, medical advice, or a substitute for a
flight-surgeon-approved protocol. Individual baselines, symptoms, device
accuracy, mission conditions, and clinician instructions take precedence.

The app's **normal**, **caution**, and **danger** labels are prototype
classifications, not diagnoses or clinically validated triage rules. In
particular, a high or low label should not be read as a diagnosis; urgent
responses must follow the mission's medical procedures.

## Indicators

| Indicator | Unit | Why it matters in space | How to record on board | General context and current prototype behavior |
|---|---|---|---|---|
| Blood pressure | mmHg (for example, 120/80) | In microgravity, fluids shift toward the head and the cardiovascular system adapts. [1] | Use an approved cuff. For a comparable reading, sit quietly, keep the cuffed arm supported at heart level, and follow the device and medical team's instructions. | AHA categories: normal is below 120 **and** below 80; elevated is systolic 120–129 with diastolic below 80; Stage 1 hypertension is systolic 130–139 **or** diastolic 80–89; Stage 2 is systolic at least 140 **or** diastolic at least 90. AHA describes below 90/60 as low blood pressure. [2][3] The prototype marks readings at or above 140 systolic or 90 diastolic as **danger**, and readings at or above 120 systolic or 80 diastolic, or below 90/60, as **caution**. These UI labels are not AHA emergency categories; one reading at 140/90 is not by itself a diagnosis or proof of an emergency. |
| Resting heart rate (pulse) | beats/min (bpm) | Spaceflight-related cardiovascular adaptation, stress, and fatigue can affect heart rate. [1] | Use a watch or pulse oximeter while seated and resting for five minutes; note symptoms and follow the device instructions. | A commonly cited adult resting range is 60–100 bpm. [4] The prototype treats 60–100 as **normal**, 40–59 or 101–130 as **caution**, and below 40 or above 130 as **danger**. These outer cutoffs are prototype thresholds, not a diagnosis. |
| Blood glucose (fasting) | mg/dL | Meals, nutrition, illness, medication, and stress can affect glucose; a finger-stick result is only one part of health context. | Use an approved glucometer as trained. Record whether the reading was fasting, the time, and relevant context such as a recent meal. | For a clinical fasting plasma glucose test, the ADA lists below 100 mg/dL as normal, 100–125 as prediabetes, and at least 126 as a diabetes diagnostic threshold that generally requires confirmation by a clinician. [5] ADA hypoglycemia levels are below 70 mg/dL (Level 1) and below 54 mg/dL (Level 2); Level 3 means a severe event requiring assistance, not a particular number. [6] The prototype marks 70–99 as **normal**, 54–69 or 100–250 as **caution**, and below 54 or above 250 as **danger**. Its bands are not diagnostic criteria; in particular, the ADA hypoglycemia table does not establish the prototype's above-250 cutoff. |
| Body temperature | °C | Spaceflight can affect immune responses, and monitoring temperature may help a crew member notice a change alongside other symptoms. [1] | Use an approved thermometer and the method specified for that device and mission. Record the measurement site because readings can differ by method. | MedlinePlus notes that normal temperature varies and gives a broad adult range of 36.1–37.2 °C; a temperature over 38 °C most often means fever due to illness or infection. [7] The prototype treats 36.1–37.5 °C as **normal**, 35.5–36.0 °C or 37.6–38.4 °C as **caution**, and below 35.5 °C or at least 38.5 °C as **danger**. These app cutoffs are not derived from MedlinePlus and should be reviewed against medical guidance before operational use. |
| Sleep | hours per 24-hour day | Irregular light-dark cycles and schedules can disrupt sleep and circadian timing. NASA reports that the ISS sees 16 sunrises and sunsets per day. [8] | Log sleep and wake times, estimated time asleep, and awakenings; a wearable may supplement, but does not replace, the crew member's record or mission procedure. | The CDC report uses at least 7 hours per night as the recommended duration for adults aged 18–60. [9] The prototype labels at least 7 hours **normal**, 5 to under 7 **caution**, and under 5 **danger**. These are app trend/escalation bands, not an individualized sleep prescription. |
| Mood check-in | self-rating, 1–5 | Isolation, confinement, and distance from Earth can affect behavioral health. [1] | A private self-rating or brief validated questionnaire selected by the medical team; allow a note or request for support. | This is a subjective check-in, not a clinical screening or diagnosis. The prototype maps 4–5 to **normal**, 3 to **caution**, and 1–2 to **danger** as a prompt to check in, not as a claim about a person's mental-health status. |
| Oxygen saturation (SpO₂) | % | Low oxygen can be relevant to cabin or suit operations and hypoxia risk. [1] | Use an approved pulse oximeter on a warm, still finger and wait for a stable reading. Record symptoms as well as the number. | The FDA says readings are 95–100% for most healthy people, while noting that individual conditions, altitude, and measurement factors matter. [10] The prototype treats at least 95% as **normal**, 91–94% as **caution**, and 90% or lower as **danger**. A pulse oximeter estimates oxygen saturation; it cannot diagnose hypoxia, and symptoms and mission medical advice matter. [10][11] |
| Exercise | minutes per day | Microgravity can reduce muscle, bone, and cardiorespiratory fitness. NASA says ISS astronauts exercise 1.5 hours per day, six to seven days per week, under their mission program. [12] | Log completed exercise time from the approved regimen or equipment; distinguish exercise from general movement and follow the crew's prescribed plan. | Exercise targets depend on the person, equipment, and mission. The prototype labels at least 120 minutes **normal**, 60 to under 120 **caution**, and under 60 **danger**. These bands do not match NASA's cited 90-minute ISS daily exercise duration and are not an approved exercise prescription. |

## Useful companion check-in

Vitals alone do not describe how someone feels. A short symptom check-in (for
example, shortness of breath, dizziness, pain, nausea, or feeling unwell) and an
option to contact the medical team are useful companions to the numeric
indicators. Any symptom escalation and response should follow mission-approved
medical guidance rather than a generic app rule.

## References

1. NASA Human Research Program, [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/).
2. American Heart Association, [Understanding Blood Pressure Readings](https://www.heart.org/bplevels).
3. American Heart Association, [Low Blood Pressure](https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/low-blood-pressure-when-blood-pressure-is-too-low).
4. American Heart Association, [Resting heart rate](https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates) (commonly cited adult resting range: 60–100 bpm).
5. American Diabetes Association, [Diabetes Diagnosis](https://diabetes.org/about-diabetes/diagnosis).
6. American Diabetes Association, [Standards of Medical Care in Diabetes—2020, Table 6.4: Classification of hypoglycemia](https://pmc.ncbi.nlm.nih.gov/articles/PMC6969656/table/T6_4/).
7. MedlinePlus, U.S. National Library of Medicine, [Body temperature norms](https://medlineplus.gov/ency/article/001982.htm); see also NCBI Bookshelf, [Clinical Methods: Temperature](https://www.ncbi.nlm.nih.gov/books/NBK331/).
8. NASA Human Research Program, [Risk from Inadequate Sleep and Irregular Schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/).
9. CDC, [Prevalence of Healthy Sleep Duration among Adults — United States, 2014](https://www.cdc.gov/mmwr/volumes/65/wr/pdfs/mm6506a1.pdf).
10. U.S. Food and Drug Administration, [Pulse Oximeter Basics](https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics).
11. Mayo Clinic, [Hypoxemia (low blood oxygen)](https://www.mayoclinic.org/symptoms/hypoxemia/basics/definition/sym-20050930).
12. NASA Human Research Program, [Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/).

## Summary: key points and thresholds

Spaceflight can shift body fluids and change cardiovascular function; the ISS
also experiences about 16 sunrises and sunsets per day, which can disrupt sleep
timing. Isolation, oxygen risks, and fitness loss are other reasons to monitor
well-being. Readings should be considered with symptoms and a crew member's
baseline. Earth reference ranges and the prototype's status bands are not
spaceflight medical limits; mission medical guidance takes precedence.

| Indicator | General adult or mission reference | Current prototype bands |
|---|---|---|
| Blood pressure (mmHg) | AHA: normal <120 and <80; elevated systolic 120–129 with diastolic <80; Stage 1 130–139 systolic or 80–89 diastolic; Stage 2 ≥140 systolic or ≥90 diastolic. Low is generally <90/60. [2][3] | **Normal:** systolic 90–119 and diastolic 60–79. **Caution:** systolic ≥120 or diastolic ≥80, or systolic <90 or diastolic <60. **Danger:** systolic ≥140 or diastolic ≥90. Danger takes precedence over caution. |
| Resting heart rate (bpm) | Common adult reference: 60–100. [4] | **Normal:** 60–100. **Caution:** 40–59 or 101–130. **Danger:** <40 or >130. |
| Fasting blood glucose (mg/dL) | ADA fasting plasma glucose: <100 normal, 100–125 prediabetes, ≥126 diabetes diagnostic threshold that generally requires confirmation. Hypoglycemia: <70 Level 1, <54 Level 2. [5][6] | **Normal:** 70–99. **Caution:** 54–69 or 100–250. **Danger:** <54 or >250. The >250 band is a prototype rule, not a threshold established by the cited hypoglycemia table. |
| Body temperature (°C) | General adult range varies; MedlinePlus gives 36.1–37.2. Temperature >38 °C most often means fever. [7] | **Normal:** 36.1–37.5. **Caution:** 35.5–<36.1 or >37.5–<38.5. **Danger:** <35.5 or ≥38.5. |
| Sleep (hours per 24 hours) | CDC recommendation: ≥7 hours for adults aged 18–60. ISS sees about 16 sunrises and sunsets each day. [8][9] | **Normal:** ≥7. **Caution:** 5–<7. **Danger:** <5. |
| Mood (self-rating, 1–5) | No universal clinical threshold for this informal self-rating; it is not a diagnosis. [1] | **Normal:** 4–5. **Caution:** 3. **Danger:** 1–2. |
| Oxygen saturation, SpO₂ (%) | FDA: 95–100% for most healthy people; readings vary and are estimates. [10] | **Normal:** ≥95%. **Caution:** 91–94%. **Danger:** ≤90%. |
| Exercise (minutes per day) | NASA reports ISS crews exercise about 90 minutes per day, six to seven days a week, under their mission program. [12] | **Normal:** ≥120 minutes. **Caution:** 60–<120. **Danger:** <60. These bands are not an approved exercise prescription. |

These prototype bands are summaries of the current demo logic, not validated
clinical cutoffs. A concerning symptom or medical-team instruction should not
be ignored because a measurement falls in a **normal** band.
