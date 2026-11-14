import { wellbeingError } from '../engine/wellbeing'
import type { WellbeingCheck } from '../engine/wellbeing'

export const WELLBEING_KEY = 'astro-health-who5-v1'
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>

export function loadWellbeing(storage: StoragePort): WellbeingCheck[] {
  const text = storage.getItem(WELLBEING_KEY)
  if (text === null) return []
  const data: unknown = JSON.parse(text)
  if (!Array.isArray(data) || !data.every(isWellbeingCheck)) {
    throw new Error('Saved well-being check-ins could not be loaded.')
  }
  return data
}

function isWellbeingCheck(input: unknown): input is WellbeingCheck {
  if (!input || typeof input !== 'object') return false
  const check = input as Record<string, unknown>
  return (
    check.instrument === 'WHO-5' &&
    !wellbeingError(check.answers) &&
    typeof check.takenAt === 'string' &&
    Number.isFinite(Date.parse(check.takenAt))
  )
}

export function saveWellbeing(
  storage: StoragePort,
  checks: WellbeingCheck[],
  check: WellbeingCheck,
): WellbeingCheck[] {
  if (!isWellbeingCheck(check)) throw new Error('Invalid WHO-5 check-in.')
  const next = [...checks, check]
  storage.setItem(WELLBEING_KEY, JSON.stringify(next))
  return next
}
