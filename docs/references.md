# References

Every external resource used in the project (required by the submission form, even if open source).

| Resource | Type | Link | Licence | Used for |
|---|---|---|---|---|
| NASA HRP — 5 Hazards of Human Spaceflight | NASA resource | https://www.nasa.gov/hrp/hazards/ | Public | Hazard mapping (RIDGE) |
| NASA HRP — Risks of Human Spaceflight | NASA resource | https://www.nasa.gov/hrp/risks/ | Public | Indicator ↔ risk mapping |
| American Heart Association — Understanding Blood Pressure Readings | Public health source | https://www.heart.org/bplevels | Public | Blood pressure categories |
| American Heart Association — Low Blood Pressure | Public health source | https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/low-blood-pressure-when-blood-pressure-is-too-low | Public | Low blood pressure context |
| American Heart Association — Target Heart Rates | Public health source | https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates | Public | Resting heart rate reference |
| American Diabetes Association — Diabetes Diagnosis | Public health source | https://diabetes.org/about-diabetes/diagnosis | Public | Fasting glucose interpretation |
| ADA Standards of Care in Diabetes — 2020, Table 6.4 | Journal article | https://pmc.ncbi.nlm.nih.gov/articles/PMC6969656/table/T6_4/ | Public | Hypoglycemia levels |
| MedlinePlus — Body Temperature Norms | Medical reference | https://medlineplus.gov/ency/article/001982.htm | Public | Adult temperature reference |
| NCBI Bookshelf — Clinical Methods: Temperature | Medical reference | https://www.ncbi.nlm.nih.gov/books/NBK331/ | Public | Temperature context |
| NASA HRP — Risk from Inadequate Sleep and Irregular Schedules | NASA resource | https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/ | Public | ISS sleep and circadian context |
| CDC — Prevalence of Healthy Sleep Duration among Adults (2014) | Public health report | https://www.cdc.gov/mmwr/volumes/65/wr/pdfs/mm6506a1.pdf | Public | Adult sleep duration |
| U.S. FDA — Pulse Oximeter Basics | Public health source | https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics | Public | SpO2 reference and device limitations |
| Mayo Clinic — Hypoxemia (Low Blood Oxygen) | Medical reference | https://www.mayoclinic.org/symptoms/hypoxemia/basics/definition/sym-20050930 | Public | Low oxygen context |
| NASA HRP — Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness | NASA resource | https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/ | Public | ISS exercise context |
| Chhabra et al. — Mouse Heart Rate in a Human: Diagnostic Mystery of an Extreme Tachyarrhythmia | Case report | https://pubmed.ncbi.nlm.nih.gov/22368381/ | CC BY 2.5 | Evidence for the manual heart-rate entry envelope; not a normal or target value |
| OMRON HEM-7196T1 — Measurement Specifications | Device manual | https://www.omron-healthcare.com/storage/im1_2_web_hem-7196t1-fleo-en-02-11-2024.pdf | Public | Example blood-pressure entry envelope; confirm actual onboard device |
| Braun ThermoScan — IRT6020/6030/6500/6510 Manual | Device manual | https://www.braunhealthcare.com/wp-content/uploads/sites/4/irt6020_6030_6500_6510_om_a007471r1_r4_20jun22_manual.pdf | Public | Example temperature display envelope; ear/oral site mismatch documented |
| Accu-Chek Active — Support and Measurement Range | Device support | https://www.accu-chek.com.ph/node/41/support | Public | Example blood-glucose entry envelope |
| NASA — Astronaut Exercise | NASA resource | https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/ | Public | Current report of average ISS exercise duration |
| ESA exercise countermeasures paper | Journal article | https://pmc.ncbi.nlm.nih.gov/articles/PMC4971634/ | Public | Scheduled exercise allocation; contextualizes the app's logging envelope |
| NASA — Heat Safety in Space Keeps Infants and Patients Safe on Earth | NASA resource | https://www.nasa.gov/missions/station/heat-safety-in-space-keeps-infants-and-patients-safe-on-earth/ | Public | Spaceflight thermoregulation context; not used to shift fever thresholds |
| World Health Organization — WHO-5 Well-Being Index (2024) | Public health instrument | https://www.who.int/publications/m/item/who-ucn-msd-mhe-2024.01 | CC BY-NC-SA 3.0 IGO | WHO-5 items, response options, recall period, scoring and follow-up guidance |
| NASA HRP — Ongoing Research | NASA resource | https://www.nasa.gov/hrp/ongoing-hrp-research/ | Public | Background |
| HuBMAP Human Reference Atlas — 3D Reference Organ Set for United, Male v1.10 (Visible Human Male, NLM; creators K. Browne, H. Schlehlein; DOI 10.48539/HBM833.WZWN.425) | NIH 3D model | https://purl.humanatlas.io/ref-organ/united-male/v1.10 | CC BY 4.0 | 3D body: skin, brain, eyes, heart, lungs, spleen, spine, pelvis, legs. Simplified and compressed by `scripts/build-body-model.mjs`; skin reshaped to a slimmer, athletic build with a neutral mannequin groin by `scripts/slim-skin.mjs` (modified from the original). |
| BodyParts3D, © The Database Center for Life Science — rib cage (FMA7480), coronary arteries and cardiac veins (from heart FMA7088), skull (FMA46565), mandible (FMA52748), clavicles, scapulae, humerus, radius, ulna, hand bones and stomach (FMA7148) | 3D model | https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html | CC BY 4.0 (current licence page; 2011 file headers state CC BY-SA 2.1 Japan) | Rib cage, coronary vessels, skull, shoulder girdle, arm and hand bones and stomach added to the 3D body, aligned to the HRA lungs, heart, brain, eyes, liver and skin arms and simplified by `scripts/build-body-model.mjs` (modified from the original). |
| CSA — Monitoring Radiation for Astronaut Health | Partner agency | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp | Public | Radiation indicator |
| anthropics/skills — frontend-design, webapp-testing | Dev tooling | https://github.com/anthropics/skills | Apache-2.0 | AI assistant guidance (not shipped in app) |
| Impeccable (Paul Bakaus) | Dev tooling | https://github.com/pbakaus/impeccable | Apache-2.0 | AI design critique/audit (not shipped in app) |
| Emil Kowalski skills | Dev tooling | https://github.com/emilkowalski/skills | MIT | AI UI polish and animation guidance (not shipped in app) |
| Taste Skill (Leonxlnx) | Dev tooling | https://github.com/Leonxlnx/taste-skill | MIT | AI guidance for the showcase page (not shipped in app; any photos/icons it pulls must be listed here separately) |
| Figma MCP server | Dev tooling | https://mcp.figma.com/mcp | Figma terms | Design-to-code handoff |

## Manual entry envelopes and well-being

Evidence and limitations for the input ranges, example devices, and WHO-5 check-in
are documented in [input-validation.md](input-validation.md). Entry envelopes are
not physiological limits or safe ranges; WHO-5 content is reproduced for
noncommercial educational use under its cited license.
