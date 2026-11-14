/*
  TOT's offline knowledge library (retrieval-augmented generation).
  Short educational passages written by the team in our own words, each
  tied to a source the team already checked for the indicator data files.
  These are EDUCATIONAL notes, not approved medical protocols: the app's
  guidance and thresholds stay in indicators.ts and trend-rules.ts, and the
  science owner must confirm every passage before the demo.
*/

export type KnowledgeDoc = {
  id: string
  title: string
  topic: 'cardiovascular' | 'microgravity' | 'sleep' | 'radiation' | 'bone-muscle' | 'mental-health' | 'oxygen' | 'temperature'
  text: string
  sourceLabel: string
  sourceUrl: string
  kind: 'educational'
}

export const KNOWLEDGE: KnowledgeDoc[] = [
  {
    id: 'cv-resting-hr',
    title: 'Resting heart rate',
    topic: 'cardiovascular',
    text: 'For adults, a resting heart rate between 60 and 100 beats per minute is the usual range. A resting rate that climbs over several days can follow poor sleep, dehydration, fever, stress or deconditioning. A rise compared with the person’s own baseline is often more telling than a single value, so it is worth re-measuring at rest at the same time of day.',
    sourceLabel: 'American Heart Association: target and resting heart rates',
    sourceUrl: 'https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates',
    kind: 'educational',
  },
  {
    id: 'cv-microgravity',
    title: 'The heart and blood vessels in weightlessness',
    topic: 'cardiovascular',
    text: 'Without gravity pulling blood toward the legs, the heart and blood vessels adapt to a lighter workload. Over long missions this cardiovascular deconditioning can lower exercise capacity and cause dizziness or fainting on standing after landing. NASA counts cardiovascular changes among the risks of the gravity hazard and uses exercise as the main countermeasure.',
    sourceLabel: 'NASA Human Research Program: five hazards of human spaceflight',
    sourceUrl: 'https://www.nasa.gov/hrp/hazards/',
    kind: 'educational',
  },
  {
    id: 'cv-blood-pressure',
    title: 'Blood pressure categories',
    topic: 'cardiovascular',
    text: 'Blood pressure under 120/80 mmHg is classed as normal. 120–129 systolic with diastolic under 80 is elevated, and 130/80 or higher is high blood pressure. Readings should be taken seated, arm supported at heart level, after a few minutes of rest; one high reading is confirmed by repeating it.',
    sourceLabel: 'American Heart Association: understanding blood pressure readings',
    sourceUrl: 'https://www.heart.org/bplevels',
    kind: 'educational',
  },
  {
    id: 'mg-fluid-shift',
    title: 'Fluid shift toward the head',
    topic: 'microgravity',
    text: 'In weightlessness, body fluids move from the legs toward the chest and head. Crews notice a puffy face and stuffy nose. Over weeks to months, some astronauts develop eye changes known as spaceflight-associated neuro-ocular syndrome (SANS), so vision is checked during long missions.',
    sourceLabel: 'NASA Human Research Program: five hazards of human spaceflight',
    sourceUrl: 'https://www.nasa.gov/hrp/hazards/',
    kind: 'educational',
  },
  {
    id: 'bm-bone-loss',
    title: 'Bone and muscle loss',
    topic: 'bone-muscle',
    text: 'Without the load of gravity, weight-bearing bones such as the hips and spine lose about 1 to 1.5 percent of their mineral density per month unless crews exercise, and muscles weaken. Daily resistance and aerobic exercise, about two hours a day on the International Space Station, is the main countermeasure. Fewer exercise minutes over several days is worth discussing with the crew medical officer.',
    sourceLabel: 'NASA: astronaut exercise on the International Space Station',
    sourceUrl: 'https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/',
    kind: 'educational',
  },
  {
    id: 'sleep-spaceflight',
    title: 'Sleep in spaceflight',
    topic: 'sleep',
    text: 'Astronauts often sleep less in space than on Earth; studies of shuttle and station crews found about six hours a night on average. Noise, light, schedule shifts and the lack of a normal day–night cycle all disturb circadian rhythms. Too little sleep over several nights builds up fatigue, slows reactions and raises the risk of errors, so NASA treats inadequate sleep and irregular schedules as a mission risk.',
    sourceLabel: 'NASA HRP: risk from inadequate sleep and irregular schedules (Barger et al., Lancet Neurology 2014)',
    sourceUrl: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/',
    kind: 'educational',
  },
  {
    id: 'sleep-fatigue',
    title: 'Signs of accumulated fatigue',
    topic: 'sleep',
    text: 'Accumulated fatigue usually shows as a pattern rather than one number: shorter sleep for several nights, a rising resting heart rate, lower mood or wellbeing scores and less exercise. Spotting the pattern early lets the crew adjust schedules, light exposure and workload before performance suffers.',
    sourceLabel: 'NASA HRP: risk from inadequate sleep and irregular schedules',
    sourceUrl: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/',
    kind: 'educational',
  },
  {
    id: 'rad-limit',
    title: 'NASA career radiation limit',
    topic: 'radiation',
    text: 'NASA limits each astronaut’s career effective radiation dose to 600 millisieverts, the same for all ages and sexes. Dose builds up over every mission, so the budget left depends on earlier flights as well as the current one.',
    sourceLabel: 'NASA OCHMO technical brief: radiation protection (NASA-STD-3001)',
    sourceUrl: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf',
    kind: 'educational',
  },
  {
    id: 'rad-mars',
    title: 'Radiation on the way to Mars and on its surface',
    topic: 'radiation',
    text: 'The Radiation Assessment Detector on the Curiosity rover measured about 1.84 millisieverts per day during the cruise to Mars, and about 0.64 millisieverts per day on the Martian surface. Outside Earth’s magnetic field, galactic cosmic rays and solar particle events add dose; during a solar particle event the crew moves to the most shielded part of the spacecraft.',
    sourceLabel: 'Zeitlin et al., Science 2013 (cruise); Hassler et al., Science 2014 (surface)',
    sourceUrl: 'https://doi.org/10.1126/science.1235989',
    kind: 'educational',
  },
  {
    id: 'mh-isolation',
    title: 'Isolation, confinement and wellbeing',
    topic: 'mental-health',
    text: 'Long missions mean isolation, confinement, distance from family and long communication delays. NASA lists these as one of the five hazards of spaceflight. Short, regular wellbeing check-ins such as the WHO-5 questionnaire help notice low mood early; a low score is a reason to talk with the crew medical officer, not a diagnosis.',
    sourceLabel: 'NASA HRP five hazards; WHO-5 Well-Being Index (WHO 2024)',
    sourceUrl: 'https://www.nasa.gov/hrp/hazards/',
    kind: 'educational',
  },
  {
    id: 'ox-spo2',
    title: 'Blood oxygen saturation',
    topic: 'oxygen',
    text: 'A pulse oximeter estimates how much oxygen the blood carries. Most healthy people read 95 percent or higher. Cold fingers, movement, nail polish and poor fit can give false low readings, so a low value is re-measured on a warm, still finger before acting on it.',
    sourceLabel: 'U.S. FDA: pulse oximeter basics',
    sourceUrl: 'https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics',
    kind: 'educational',
  },
  {
    id: 'temp-body',
    title: 'Body temperature',
    topic: 'temperature',
    text: 'Normal body temperature varies between people and over the day, around 36.5 to 37.2 °C measured in the mouth. A temperature that rises together with the resting heart rate can be an early sign of infection. Studies of long-duration crews found core body temperature runs slightly higher in space, which makes the person’s own baseline important.',
    sourceLabel: 'MedlinePlus: body temperature norms; Stahn et al., Scientific Reports 2017',
    sourceUrl: 'https://medlineplus.gov/ency/article/001982.htm',
    kind: 'educational',
  },
]
