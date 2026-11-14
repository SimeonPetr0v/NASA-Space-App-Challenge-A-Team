import type { IndicatorId } from '@/engine/types'

/*
  Science sign-off: which indicator the team's science lead has checked
  (range, guidance text and source). Science lead: set status to 'verified',
  add your name and the date, and note anything you changed.
*/
export type SignOff = { status: 'pending' | 'verified'; by?: string; date?: string; note?: string }

export const SIGN_OFF: Record<IndicatorId, SignOff> = {
  hr: { status: 'pending' },
  bp: { status: 'pending' },
  spo2: { status: 'pending' },
  temp: { status: 'pending' },
  glu: { status: 'pending' },
  sleep: { status: 'pending' },
  mood: { status: 'pending' },
  exercise: { status: 'pending' },
}
