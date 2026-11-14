import { KNOWLEDGE, type KnowledgeDoc } from '@/data/tot-knowledge'

/*
  Offline retrieval for TOT: plain keyword scoring over the knowledge
  library (no embeddings, no network). Words in the question count most;
  topics the analytics flagged today add a small boost.
*/

const STOP = new Set('a an and are as at be been by can do does for from has have how i in is it its me my of on or should show the this to was what when why will with you your over last week days day today'.split(' '))

const SYNONYMS: Record<string, string[]> = {
  heart: ['cardiovascular', 'pulse', 'heart'],
  pulse: ['heart', 'cardiovascular'],
  fatigue: ['sleep', 'fatigue', 'tired'],
  tired: ['sleep', 'fatigue'],
  sleep: ['sleep', 'circadian'],
  radiation: ['radiation', 'dose', 'millisieverts'],
  dose: ['radiation'],
  bone: ['bone', 'muscle', 'exercise'],
  muscle: ['muscle', 'bone', 'exercise'],
  exercise: ['exercise', 'muscle', 'bone'],
  mood: ['wellbeing', 'isolation', 'mental'],
  stress: ['wellbeing', 'isolation'],
  oxygen: ['oxygen', 'saturation', 'oximeter'],
  fever: ['temperature', 'infection'],
  temperature: ['temperature'],
  pressure: ['blood', 'pressure'],
  eyes: ['eye', 'sans', 'fluid'],
  vision: ['eye', 'sans', 'fluid'],
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))

export function retrieve(question: string, flaggedTopics: string[], k = 3): KnowledgeDoc[] {
  const q = words(question).flatMap((w) => [w, ...(SYNONYMS[w] ?? [])])
  const scored = KNOWLEDGE.map((doc) => {
    const body = words(`${doc.title} ${doc.title} ${doc.text} ${doc.topic}`)
    let score = 0
    for (const w of q) score += body.filter((b) => b.startsWith(w) || w.startsWith(b)).length
    if (flaggedTopics.includes(doc.topic)) score += 1.5
    return { doc, score }
  })
  return scored
    .filter((s) => s.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.doc)
}
