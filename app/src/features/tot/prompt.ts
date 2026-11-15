import type { IndicatorId } from '@/engine/types'
import type { KnowledgeDoc } from '@/data/tot-knowledge'
import type { Facts } from './facts'

/* What TOT is told with every question: rules, today's data sheet and the matching library passages */
export function systemPrompt(facts: Facts, docs: KnowledgeDoc[]) {
  const library = docs.length ? docs.map((d, i) => `[${i + 1}] ${d.title}: ${d.text}`).join('\n') : '(no matching passage)'
  return `You are TOT, the on-board health assistant in the Khonsu app for astronauts. You run offline on this device.

RULES
- Use only the DATA and LIBRARY below. Never invent a measurement, date or number. If something is not in DATA, say it is not recorded.
- Statuses, thresholds and trends come from Khonsu analytics. Repeat them; do not recalculate or change them.
- You do not diagnose. Say "can be a sign of" or "is worth checking", never "you have".
- Recommendations: only re-measure, follow the app guidance in DATA, rest, or talk to the crew medical officer.
- Structure the answer with these short headings when they apply: Measured, Trend, Possible explanations, What to do.
- Mark library facts with their number, like [1]. Keep the answer under 170 words, in plain English.

DATA (from Khonsu analytics, this crew member, today)
${facts.text}

LIBRARY (educational notes, not medical protocols)
${library}`
}

/*
  Processor backup model (small, slower, more likely to invent): the app
  writes the "Measured" and "What to do" parts itself from Khonsu's
  analytics; the model only adds two short sentences of possible
  explanation, with no numbers, from those findings and one library note.
*/

const QUESTION_TOPICS: [RegExp, IndicatorId[]][] = [
  [/heart|pulse|bpm|cardio/i, ['hr']],
  [/pressure/i, ['bp']],
  [/oxygen|spo2|breath/i, ['spo2']],
  [/temp|fever/i, ['temp']],
  [/sleep|night/i, ['sleep']],
  [/fatigue|tired|exhaust/i, ['sleep', 'hr', 'exercise', 'mood']],
  [/exercise|muscle|bone|activity|training/i, ['exercise']],
  [/mood|stress|feel|wellbeing|well-being/i, ['mood']],
]

/** Indicators the question is about; empty means a general question (summary, medical officer, biggest changes) */
export function topicsOf(question: string): IndicatorId[] {
  return [...new Set(QUESTION_TOPICS.filter(([re]) => re.test(question)).flatMap(([, ids]) => ids))]
}

/** The rule-based summary lines that answer the question (all of them for a general question) */
export function measuredFor(question: string, facts: Facts, labels: Record<IndicatorId, string>): string[] {
  const lines = facts.basic.split('\n').filter((l) => l.trim())
  const ids = topicsOf(question)
  const wantsRadiation = /radiation|dose/i.test(question)
  if (!ids.length && !wantsRadiation) return lines
  const picked = lines.filter((l) => (wantsRadiation && l.startsWith('Radiation')) || ids.some((id) => l.includes(labels[id])))
  return picked.length ? picked : [lines[0], ...ids.map((id) => `${labels[id]}: in the usual range.`)]
}

export function cpuPrompt(measured: string[], doc?: KnowledgeDoc) {
  return `You are TOT, a health assistant for astronauts. In two short sentences, without any numbers, say what can explain the findings below. Say "can be", never "is". Do not diagnose.

FINDINGS
${measured.join('\n')}${doc ? `

NOTE: ${doc.text}` : ''}`
}

export const SUGGESTED = [
  'Give me my daily health summary.',
  'Why has my heart rate increased this week?',
  'How has my sleep changed over the last 7 days?',
  'Am I showing signs of accumulated fatigue?',
  'Show me my radiation exposure.',
  'What should I discuss with the medical officer?',
]

/** Small models can loop ("- Exercise: 95 min" again and again): keep only the first copy of each line */
export function dropRepeatedLines(text: string) {
  const seen = new Set<string>()
  return text
    .split('\n')
    .filter((line) => {
      const key = line.toLowerCase().replace(/[\s*•.-]+/g, ' ').trim()
      if (key.length < 4) return true
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join('\n')
}

/**
  Grounded mode: the model may only explain. Keep up to two of its sentences
  that carry no numbers and are not list items; the numbers are already in
  "Measured", written by Khonsu.
*/
export function explanationOnly(text: string, fallback = '') {
  const sentences = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^([-•*]|\d+[.)])/.test(l) && !/:$/.test(l))
    .join(' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12 && !/\d/.test(s) && !/:\s*$/.test(s))
  return sentences.slice(0, 2).join(' ') || fallback
}
