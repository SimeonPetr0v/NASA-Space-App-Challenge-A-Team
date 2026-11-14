import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEMO_HISTORY } from '@/data/demo-readings'
import { MISSIONS } from '@/data/missions'
import { worstStatus } from '@/engine/assess'
import type { Assessment, LinkMessage, MissionMode, Reading } from '@/engine/types'
import type { WellbeingCheck } from '@/engine/wellbeing'
import { loadReadings, saveReading } from '@/store/readings'
import { loadWellbeing, saveWellbeing } from '@/store/wellbeing'

/*
  App state kept on the device (localStorage) - no backend (PRODUCT.md).
  Measurements and WHO-5 check-ins are validated and persisted by src/store/*
  (readings.ts, wellbeing.ts); this file keeps UI settings and the Earth link.
  history = synthetic demo history + the crew member's saved readings.
  The simulated clock lets the demo speed up light-time delay (x60 / x600);
  the UI must label sped-up time as simulated.
*/

type Clock = { real: number; sim: number; speed: number }

type Persisted = {
  mode: MissionMode
  marsDelayMin: number
  theme: 'day' | 'night'
  messages: LinkMessage[]
  wakings: string[]
}

const KEY = 'ahm:settings-v1'

const DEFAULTS: Persisted = {
  mode: 'mars-transit',
  marsDelayMin: 14,
  theme: 'day',
  messages: [],
  wakings: [],
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return { ...DEFAULTS, ...parsed }
  } catch {
    return DEFAULTS
  }
}

export type Transmission = { id: string; title: string; detail: string; delaySec: number; worst: Assessment['status'] }

type Saved = { readings: Reading[]; checks: WellbeingCheck[]; error: string }

function loadSaved(): Saved {
  const out: Saved = { readings: [], checks: [], error: '' }
  try {
    out.readings = loadReadings(window.localStorage)
  } catch {
    out.error = 'Saved measurements could not be loaded. Existing data has not been overwritten; check browser storage and reload.'
  }
  try {
    out.checks = loadWellbeing(window.localStorage)
  } catch {
    out.error ||= 'Saved well-being check-ins could not be loaded. Existing answers have not been overwritten.'
  }
  return out
}

type Store = Persisted & {
  /** Demo history plus saved readings, oldest first */
  history: Reading[]
  savedReadings: Reading[]
  wellbeing: WellbeingCheck[]
  storageError: string
  addWellbeing: (check: WellbeingCheck) => boolean
  transmission: Transmission | null
  clearTransmission: () => void
  clock: Clock
  simNow: () => number
  delaySec: number
  addReadings: (readings: Reading[]) => boolean
  setMode: (mode: MissionMode) => void
  setMarsDelayMin: (min: number) => void
  setTheme: (theme: 'day' | 'night') => void
  setSpeed: (speed: number) => void
  sendReport: (assessments: Assessment[], readings: Reading[], note: string) => LinkMessage
  sendReply: (report: LinkMessage, template: string) => void
  logWaking: (reason: string) => void
  resetDemo: () => void
}

const Ctx = createContext<Store | null>(null)

const uid = () => Math.random().toString(36).slice(2, 10)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)
  const [saved, setSaved] = useState<Saved>(loadSaved)
  const history = useMemo(() => [...DEMO_HISTORY, ...saved.readings], [saved.readings])
  const [transmission, setTransmission] = useState<Transmission | null>(null)
  const [clock, setClock] = useState<Clock>(() => ({ real: Date.now(), sim: Date.now(), speed: 1 }))

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage full or unavailable: keep working in memory */
    }
  }, [state])

  const simNow = useCallback(() => clock.sim + (Date.now() - clock.real) * clock.speed, [clock])

  const mission = MISSIONS[state.mode]
  const delaySec = mission.delayRangeMin ? state.marsDelayMin * 60 : mission.delaySec

  const store = useMemo<Store>(
    () => ({
      ...state,
      history,
      savedReadings: saved.readings,
      wellbeing: saved.checks,
      storageError: saved.error,
      addWellbeing: (check) => {
        try {
          const checks = saveWellbeing(window.localStorage, saved.checks, check)
          setSaved((s) => ({ ...s, checks, error: '' }))
          return true
        } catch {
          setSaved((s) => ({ ...s, error: 'Well-being check-in could not be saved. Check browser storage and try again.' }))
          return false
        }
      },
      transmission,
      clearTransmission: () => setTransmission(null),
      clock,
      simNow,
      delaySec,
      addReadings: (readings) => {
        try {
          let next = saved.readings
          for (const r of readings) next = saveReading(window.localStorage, next, r)
          setSaved((s) => ({ ...s, readings: next, error: '' }))
          return true
        } catch (e) {
          setSaved((s) => ({ ...s, error: e instanceof Error ? e.message : 'Measurement could not be saved. Browser storage may be full or unavailable.' }))
          return false
        }
      },
      setMode: (mode) => setState((s) => ({ ...s, mode })),
      setMarsDelayMin: (marsDelayMin) => setState((s) => ({ ...s, marsDelayMin })),
      setTheme: (theme) => setState((s) => ({ ...s, theme })),
      setSpeed: (speed) => {
        const now = simNow()
        setClock({ real: Date.now(), sim: now, speed })
      },
      sendReport: (assessments, readings, note) => {
        const created = simNow()
        const msg: LinkMessage = {
          id: uid(),
          direction: 'to-earth',
          kind: 'report',
          createdAt: new Date(created).toISOString(),
          arrivesAt: new Date(created + delaySec * 1000).toISOString(),
          payload: { assessments, readings, note },
        }
        setState((s) => ({ ...s, messages: [...s.messages, msg] }))
        const worst = worstStatus(assessments)
        setTransmission({ id: msg.id, title: note, detail: `${readings.length} readings, ${assessments.filter((a) => a.status === 'caution' || a.status === 'danger').length} off-nominal · from crew member CM-2`, delaySec, worst })
        return msg
      },
      sendReply: (report, template) => {
        const created = simNow()
        const msg: LinkMessage = {
          id: uid(),
          direction: 'to-crew',
          kind: 'reply',
          createdAt: new Date(created).toISOString(),
          arrivesAt: new Date(created + delaySec * 1000).toISOString(),
          payload: { replyTemplate: template, inReplyTo: report.id },
        }
        setState((s) => ({ ...s, messages: [...s.messages, msg] }))
      },
      logWaking: (reason) => setState((s) => ({ ...s, wakings: [...s.wakings, `${new Date(simNow()).toISOString()}|${reason}`] })),
      resetDemo: () => {
        setState(DEFAULTS)
        setClock({ real: Date.now(), sim: Date.now(), speed: 1 })
      },
    }),
    [state, history, saved, clock, simNow, delaySec, transmission],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}

/** Re-renders on an interval and returns the simulated "now" */
// eslint-disable-next-line react/only-export-components
export function useSimNow(intervalMs = 1000): number {
  const { simNow } = useStore()
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return simNow()
}
