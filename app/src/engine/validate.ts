import type { IndicatorId, Reading } from './types'
import { BP_LIMITS, INPUT_LIMITS, OUT_OF_RANGE_ACTION } from '../data/input-limits'

const ids: string[] = ['hr', 'bp', 'spo2', 'temp', 'glu', 'sleep', 'mood', 'exercise']
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** Entry constraints are not clinical thresholds; extreme valid values remain assessable. */
export function readingError(input: unknown, enforceEntryLimits = true): string | null {
  if (!input || typeof input !== 'object') return 'Enter a measurement.'
  const reading = input as Record<string, unknown>
  if (typeof reading.indicatorId !== 'string' || !ids.includes(reading.indicatorId)) {
    return 'Select a known indicator.'
  }
  if (typeof reading.takenAt !== 'string' || !Number.isFinite(Date.parse(reading.takenAt))) {
    return 'Enter a valid measurement time.'
  }
  if (!['manual', 'device', 'camera'].includes(reading.source as string)) {
    return 'Select a valid measurement source.'
  }

  if (reading.indicatorId === 'bp') {
    const value = reading.value as Record<string, unknown> | null
    if (!value || !finite(value.systolic) || !finite(value.diastolic)) {
      return 'Enter both blood pressure values.'
    }
    const { systolic, diastolic } = value
    if (systolic <= 0 || diastolic <= 0 || systolic <= diastolic) {
      return 'Systolic pressure must be greater than diastolic pressure; both must be positive.'
    }
    if (enforceEntryLimits) {
      for (const field of ['systolic', 'diastolic'] as const) {
        const limit = BP_LIMITS[field]
        const number = value[field] as number
        if (!Number.isInteger(number) || number < limit.min || number > limit.max) {
          const label = field === 'systolic' ? 'Systolic' : 'Diastolic'
          return `${label} entry range is ${limit.min}–${limit.max} mmHg in whole numbers. ${OUT_OF_RANGE_ACTION}`
        }
      }
    }
    return null
  }

  if (!finite(reading.value)) return 'Enter a finite number.'
  const value = reading.value
  if (reading.indicatorId === 'mood' && (!Number.isInteger(value) || value < 1 || value > 5)) {
    return 'Mood must be a whole number from 1 to 5.'
  }
  if (reading.indicatorId === 'sleep' && (value < 0 || value > 24)) {
    return 'Sleep must be between 0 and 24 hours.'
  }
  if (!enforceEntryLimits && reading.indicatorId === 'exercise' && (value < 0 || value > 1440)) {
    return 'Exercise must be between 0 and 1440 minutes.'
  }
  if (reading.indicatorId === 'spo2' && (value < 0 || value > 100)) {
    return 'Oxygen saturation must be between 0 and 100%.'
  }
  if (['hr', 'temp', 'glu'].includes(reading.indicatorId) && value <= 0) {
    return 'Enter a value greater than zero.'
  }

  if (enforceEntryLimits) {
    const limit = INPUT_LIMITS[reading.indicatorId as Exclude<IndicatorId, 'bp'>]
    if (value < limit.min || value > limit.max || (limit.step === 1 && !Number.isInteger(value))) {
      return `Enter ${limit.min}–${limit.max}${limit.step === 1 ? ' in whole numbers' : ''}. ${OUT_OF_RANGE_ACTION}`
    }
  }
  return null
}

export function isReading(input: unknown): input is Reading {
  return readingError(input, false) === null
}
