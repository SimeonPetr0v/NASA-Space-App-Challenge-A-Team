import type { IndicatorId, ReadingValue, Status } from '@/engine/types'

/*
  Display-only data for the instruments panel: range-gauge zones and the
  guidance block. Thresholds here mirror the classify() rules in indicators.ts
  (the science owner's file) — change both together. Guidance is prototype
  self-care wording, not medical advice; urgent cases follow mission medical
  procedures (see docs/health-indicators.md).
*/

export type GaugeZone = { from: number; to: number; status: Exclude<Status, 'no-data' | 'stale'> }

export type Gauge = {
  zones: GaugeZone[]
  value: (v: ReadingValue) => number
  label?: string
}

export type Guidance = { doNow: string[]; recheckIn: string; escalateIf: string }

const num = (v: ReadingValue) => (typeof v === 'number' ? v : v.systolic)

export const GAUGES: Record<IndicatorId, Gauge> = {
  hr: {
    value: num,
    zones: [
      { from: 30, to: 40, status: 'danger' },
      { from: 40, to: 60, status: 'caution' },
      { from: 60, to: 100, status: 'normal' },
      { from: 100, to: 130, status: 'caution' },
      { from: 130, to: 160, status: 'danger' },
    ],
  },
  bp: {
    value: num,
    label: 'Systolic',
    zones: [
      { from: 70, to: 90, status: 'caution' },
      { from: 90, to: 120, status: 'normal' },
      { from: 120, to: 140, status: 'caution' },
      { from: 140, to: 200, status: 'danger' },
    ],
  },
  spo2: {
    value: num,
    zones: [
      { from: 80, to: 90.5, status: 'danger' },
      { from: 90.5, to: 95, status: 'caution' },
      { from: 95, to: 100, status: 'normal' },
    ],
  },
  temp: {
    value: num,
    zones: [
      { from: 34.5, to: 35.5, status: 'danger' },
      { from: 35.5, to: 36.1, status: 'caution' },
      { from: 36.1, to: 37.5, status: 'normal' },
      { from: 37.5, to: 38.5, status: 'caution' },
      { from: 38.5, to: 40, status: 'danger' },
    ],
  },
  glu: {
    value: num,
    zones: [
      { from: 40, to: 54, status: 'danger' },
      { from: 54, to: 70, status: 'caution' },
      { from: 70, to: 100, status: 'normal' },
      { from: 100, to: 250, status: 'caution' },
      { from: 250, to: 280, status: 'danger' },
    ],
  },
  sleep: {
    value: num,
    zones: [
      { from: 3, to: 5, status: 'danger' },
      { from: 5, to: 7, status: 'caution' },
      { from: 7, to: 10, status: 'normal' },
    ],
  },
  mood: {
    value: num,
    zones: [
      { from: 1, to: 2.5, status: 'danger' },
      { from: 2.5, to: 3.5, status: 'caution' },
      { from: 3.5, to: 5, status: 'normal' },
    ],
  },
  exercise: {
    value: num,
    zones: [
      { from: 0, to: 60, status: 'danger' },
      { from: 60, to: 120, status: 'caution' },
      { from: 120, to: 180, status: 'normal' },
    ],
  },
}

const URGENT = 'Contact the crew medical officer now and follow mission medical procedures'

export const GUIDANCE: Record<IndicatorId, { caution: Guidance; danger: Guidance }> = {
  hr: {
    caution: { doNow: ['Sit and rest for 10 minutes', 'Drink a glass of water'], recheckIn: '30 min', escalateIf: 'Still above 100 bpm at rest, or chest pain or dizziness' },
    danger: { doNow: ['Stop activity and sit or lie down', 'Tell a crewmate'], recheckIn: '10 min', escalateIf: URGENT },
  },
  bp: {
    caution: { doNow: ['Rest seated for 5 minutes, then re-measure', 'Go easy on salt and caffeine today'], recheckIn: 'Tomorrow morning', escalateIf: 'Two readings at 140/90 or higher, or headache or vision changes' },
    danger: { doNow: ['Sit down and stay still', 'Re-measure after 5 minutes'], recheckIn: '5 min', escalateIf: URGENT },
  },
  spo2: {
    caution: { doNow: ['Breathe slowly for 2 minutes and re-measure', 'Check the cabin CO₂ reading'], recheckIn: '15 min', escalateIf: 'Stays below 95 %, or you feel short of breath' },
    danger: { doNow: ['Alert the crew', 'Check cabin air and oxygen supply'], recheckIn: 'Continuously', escalateIf: URGENT },
  },
  temp: {
    caution: { doNow: ['Drink fluids and rest', 'Note any symptoms'], recheckIn: '4 h', escalateIf: 'Rises to 38.5 °C or stays raised for 24 h' },
    danger: { doNow: ['Rest and limit contact with the crew', 'Note symptoms and when they started'], recheckIn: '1 h', escalateIf: URGENT },
  },
  glu: {
    caution: { doNow: ['Note your last meal and how you feel', 'Re-measure before the next meal'], recheckIn: 'Next meal', escalateIf: 'Below 70 or above 180 mg/dL again' },
    danger: { doNow: ['Tell a crewmate', 'Follow the glucose procedure in the medical kit'], recheckIn: '15 min', escalateIf: URGENT },
  },
  sleep: {
    caution: { doNow: ['Protect your next sleep window', 'Use night mode and dim lights an hour before sleep'], recheckIn: 'Tomorrow morning', escalateIf: 'Under 6 h for 3 nights in a row' },
    danger: { doNow: ['Avoid critical tasks and spacewalks today', 'Ask the commander to adjust the schedule'], recheckIn: 'Tomorrow morning', escalateIf: 'Continues — discuss with the flight surgeon' },
  },
  mood: {
    caution: { doNow: ['Take a short break and talk with a crewmate', 'Plan a private call home'], recheckIn: 'Tomorrow', escalateIf: 'Low for 3 days in a row' },
    danger: { doNow: ['Tell the crew medical officer how you feel', 'Request a private conference with the ground'], recheckIn: 'Today', escalateIf: URGENT },
  },
  exercise: {
    caution: { doNow: ['Add a 30-minute session on the treadmill or cycle', 'Include resistive exercise'], recheckIn: 'Tonight', escalateIf: 'Under 60 min for 3 days in a row' },
    danger: { doNow: ['Schedule your full exercise block today', 'Ask for schedule changes to protect exercise time'], recheckIn: 'Tonight', escalateIf: 'Continues — inform the flight surgeon' },
  },
}
