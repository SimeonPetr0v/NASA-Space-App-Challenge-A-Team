import type { Reading } from '../engine/types'
import { isReading, readingError } from '../engine/validate'

export const READINGS_KEY = 'astro-health-readings-v1'
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>

export function loadReadings(storage: StoragePort): Reading[] {
  const raw = storage.getItem(READINGS_KEY)
  if (raw === null) return []
  const data: unknown = JSON.parse(raw)
  if (!Array.isArray(data) || !data.every(isReading)) {
    throw new Error('Saved measurements are invalid. Existing data has not been overwritten.')
  }
  return data
}

export function saveReading(storage: StoragePort, readings: Reading[], reading: Reading): Reading[] {
  const error = readingError(reading)
  if (error) throw new Error(error)
  const next = [...readings, reading]
  storage.setItem(READINGS_KEY, JSON.stringify(next))
  return next
}

export function latestReadings(readings: Reading[]): Reading[] {
  const latest = new Map<Reading['indicatorId'], Reading>()
  for (const reading of readings) {
    const previous = latest.get(reading.indicatorId)
    if (!previous || Date.parse(reading.takenAt) >= Date.parse(previous.takenAt)) {
      latest.set(reading.indicatorId, reading)
    }
  }
  return [...latest.values()]
}
