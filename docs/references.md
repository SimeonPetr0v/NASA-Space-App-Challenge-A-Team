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
| NASA OCHMO technical brief — Radiation Protection (NASA-STD-3001 Vol. 1 §4.8.2) | NASA resource | https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf | Public | 600 mSv career limit in the radiation budget and TOT's library |
| Zeitlin et al., Science 2013 — MSL RAD cruise dose | Paper | https://doi.org/10.1126/science.1235989 | Cited, not copied | Mars transit dose rate 1.84 mSv/day |
| Hassler et al., Science 2014 — Curiosity RAD surface dose | Paper | https://doi.org/10.1126/science.1244797 | Cited, not copied | Mars surface dose rate 0.64 mSv/day |
| NASA HRP — Ongoing Research | NASA resource | https://www.nasa.gov/hrp/ongoing-hrp-research/ | Public | Background |
| HuBMAP Human Reference Atlas — 3D Reference Organ Set for United, Male v1.10 (Visible Human Male, NLM; creators K. Browne, H. Schlehlein; DOI 10.48539/HBM833.WZWN.425) | NIH 3D model | https://purl.humanatlas.io/ref-organ/united-male/v1.10 | CC BY 4.0 | 3D body: skin, brain, eyes, heart, lungs, spleen, spine, pelvis, legs. Simplified and compressed by `scripts/build-body-model.mjs`; skin reshaped to a slimmer, athletic build with a neutral mannequin groin by `scripts/slim-skin.mjs` (modified from the original). |
| BodyParts3D, © The Database Center for Life Science — rib cage (FMA7480), coronary arteries and cardiac veins (from heart FMA7088), skull (FMA46565), mandible (FMA52748), clavicles, scapulae, humerus, radius, ulna, hand bones, foot bones (tarsals, metatarsals, toe phalanges), arm skin (from the body skin FMA7163, element FJ2810) and stomach (FMA7148) | 3D model | https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html | CC BY 4.0 (current licence page; 2011 file headers state CC BY-SA 2.1 Japan) | Rib cage, coronary vessels, skull, shoulder girdle, arm, hand and foot bones and stomach added to the 3D body, aligned to the HRA lungs, heart, brain, eyes and liver; the arms (skin and bones together) re-posed into the HRA arm pose and stitched onto the HRA skin at the shoulders and simplified by `scripts/build-body-model.mjs` (modified from the original). |
| WebLLM (MLC AI) 0.2.87 | Library | https://github.com/mlc-ai/web-llm | Apache-2.0 | TOT: runs the language model in the browser with WebGPU, in a Web Worker |
| Llama 3.2 1B Instruct (Meta), MLC q4f16_1 build | AI model, downloaded on first use | https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC | Llama 3.2 Community License | TOT default model; weights are fetched by the user's browser, not stored in this repo |
| Qwen2.5 0.5B / 1.5B Instruct (Alibaba), MLC q4f16_1 builds | AI model, downloaded on first use | https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC | Apache-2.0 | Optional smaller / larger TOT models |
| Oxanium (Severin Meyer), @fontsource-variable/oxanium | Font | https://github.com/sevmeyer/oxanium | SIL OFL 1.1 | Headings, brand and key labels |
| Transformers.js (Hugging Face) 4.3.2, with ONNX Runtime Web | Library | https://github.com/huggingface/transformers.js | Apache-2.0 (ONNX Runtime: MIT) | TOT backup engine on the processor for devices without WebGPU |
| SmolLM2-360M-Instruct (Hugging Face), ONNX q4 | AI model, downloaded on first use | https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct | Apache-2.0 | TOT backup model; weights fetched by the user's browser, not stored in this repo |
| Space Grotesk (Florian Karsten), @fontsource-variable/space-grotesk | Font | https://github.com/floriankarsten/space-grotesk | SIL OFL 1.1 | Interface text and numbers |
| JetBrains Mono, @fontsource/jetbrains-mono | Font | https://github.com/JetBrains/JetBrainsMono | SIL OFL 1.1 | Small technical labels |
| Wikipedia — Khonsu; Thoth | Encyclopedia | https://en.wikipedia.org/wiki/Khonsu , https://en.wikipedia.org/wiki/Thoth | CC BY-SA 4.0 (facts paraphrased, not copied) | “About the names” on the Mission brief page |
| CSA — Monitoring Radiation for Astronaut Health | Partner agency | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp | Public | Radiation indicator |
| anthropics/skills — frontend-design, webapp-testing | Dev tooling | https://github.com/anthropics/skills | Apache-2.0 | AI assistant guidance (not shipped in app) |
| Impeccable (Paul Bakaus) | Dev tooling | https://github.com/pbakaus/impeccable | Apache-2.0 | AI design critique/audit (not shipped in app) |
| Emil Kowalski skills | Dev tooling | https://github.com/emilkowalski/skills | MIT | AI UI polish and animation guidance (not shipped in app) |
| Taste Skill (Leonxlnx) | Dev tooling | https://github.com/Leonxlnx/taste-skill | MIT | AI guidance for the showcase page (not shipped in app; any photos/icons it pulls must be listed here separately) |
| Figma MCP server | Dev tooling | https://mcp.figma.com/mcp | Figma terms | Design-to-code handoff |

## Libraries in the app (from `app/package.json`)

| Library | Version | Link | Licence | Used for |
|---|---|---|---|---|
| React, React DOM | 19.3.1 | https://react.dev | MIT | User interface |
| Vite, @vitejs/plugin-react | 8.3.8 | https://vite.dev | MIT | Build tool and dev server |
| TypeScript | 7.0.2 | https://www.typescriptlang.org | Apache-2.0 | Type checking |
| vite-plugin-pwa (Workbox) | 2.0.0 | https://github.com/vite-pwa/vite-plugin-pwa | MIT | Installable, offline app |
| Tailwind CSS, @tailwindcss/vite | 4.3.5 | https://tailwindcss.com | MIT | Styling with our design tokens |
| tw-animate-css | 1.4.0 | https://github.com/Wombosvideo/tw-animate-css | MIT | Small CSS enter/exit animations |
| shadcn/ui (CLI and components) | 4.23.0 | https://ui.shadcn.com | MIT | Base UI components, restyled with our tokens |
| Radix UI | 1.8.1 | https://www.radix-ui.com | MIT | Accessible primitives behind the components |
| class-variance-authority | 0.7.1 | https://github.com/joe-bell/cva | Apache-2.0 | Component style variants |
| cn | 0.5.2 | https://www.npmjs.com/package/cn | MIT | Class name helper |
| Lucide icons, lucide-react | 1.73.0 | https://lucide.dev | ISC | All interface icons |
| Motion (motion/react) | 14.14.0 | https://motion.dev | MIT | UI transitions and animations |
| three.js | 0.187.0 | https://threejs.org | MIT | 3D body rendering |
| @react-three/fiber | 9.8.2 | https://github.com/pmndrs/react-three-fiber | MIT | three.js in React |
| @react-three/drei | 10.7.9 | https://github.com/pmndrs/drei | MIT | Camera controls and 3D helpers |
| glTF Transform, meshoptimizer | 4.5.1 / 1.3.0 | https://gltf-transform.dev , https://github.com/zeux/meshoptimizer | MIT | Build scripts that simplify and compress the 3D body model (not shipped) |
| Geist (Vercel), @fontsource-variable/geist | 5.3.0 | https://vercel.com/font | SIL OFL 1.1 | Installed font package (fallback) |
| IBM Plex Sans Condensed, @fontsource/ibm-plex-sans-condensed | 5.3.0 | https://github.com/IBM/plex | SIL OFL 1.1 | Installed font package (fallback) |
| oxlint | 1.93.0 | https://oxc.rs | MIT | Linting (dev only) |

## Demo video (made outside the app, not in this repo)

| Resource | Link | Licence | Used for |
|---|---|---|---|
| Playwright (playwright-core) with Google Chrome | https://playwright.dev | Apache-2.0 | Recording the live app on laptop, tablet and phone sizes |
| FFmpeg (ffmpeg-static build) | https://ffmpeg.org | GPL / LGPL | Encoding the video, mixing the voice-over |
| Oxanium, Space Grotesk, JetBrains Mono | see the font rows above | SIL OFL 1.1 | Titles, subtitles and side text in the video |
| Voice-over | — | Recorded by a team member | Narration (human voice, no AI voice) |
| Camera pulse input | — | Synthetic test video made with FFmpeg | Fake fingertip signal for Chrome's test camera; labelled in the video |

## Manual entry envelopes and well-being

Evidence and limitations for the input ranges, example devices, and WHO-5 check-in
are documented in [input-validation.md](input-validation.md). Entry envelopes are
not physiological limits or safe ranges; WHO-5 content is reproduced for
noncommercial educational use under its cited license.
