import type { IndicatorId } from '@/engine/types'

/*
  Slow-change rules for the trend warning (src/features/trends).
  direction = which way is worse; driftPct = how far the last-5-day average may
  move from the personal baseline before we warn, even if every single value
  is still in range. App heuristics for early self-care, not clinical limits.
  Science owner: confirm or adjust before the demo.
*/
export type TrendRule = { direction: 'up' | 'down'; driftPct: number }

export const TREND_RULES: Partial<Record<IndicatorId, TrendRule>> = {
  sleep: { direction: 'down', driftPct: 12 },
  hr: { direction: 'up', driftPct: 10 },
  spo2: { direction: 'down', driftPct: 2 },
  temp: { direction: 'up', driftPct: 1 },
  bp: { direction: 'up', driftPct: 8 },
  glu: { direction: 'up', driftPct: 10 },
  mood: { direction: 'down', driftPct: 15 },
  exercise: { direction: 'down', driftPct: 15 },
}

/** Consecutive days moving the wrong way that count as a streak ("4 nights in a row") */
export const TREND_STREAK_DAYS = 4
/** Days averaged for the drift check */
export const TREND_WINDOW_DAYS = 5
