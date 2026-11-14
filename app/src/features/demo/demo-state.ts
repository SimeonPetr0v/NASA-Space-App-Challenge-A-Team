import { useSyncExternalStore } from 'react'

/* Whether Play demo is running; shared by the button and the player */
let running = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const startDemo = () => {
  running = true
  emit()
}
export const stopDemo = () => {
  running = false
  emit()
}
export const useRunning = () => useSyncExternalStore(subscribe, () => running)
