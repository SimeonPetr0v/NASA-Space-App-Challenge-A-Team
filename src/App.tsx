import { useEffect, useMemo, useState } from 'react'
import { ReadingForm } from '@/components/ReadingForm'
import { StatusBadge } from '@/components/StatusBadge'
import { WellbeingForm } from '@/components/WellbeingForm'
import { INDICATORS } from '@/data/indicators'
import { DEMO_READINGS } from '@/data/demo-readings'
import { DEMO_BASELINE, DEMO_MISSION } from '@/data/mission'
import { worstStatus } from '@/engine/assess'
import type { BodyRegion, IndicatorId, Reading, Status } from '@/engine/types'
import { assessWellbeing, scoreWellbeing, type WellbeingCheck } from '@/engine/wellbeing'
import { BodyStage } from '@/features/body3d/BodyStage'
import type { Callout } from '@/features/body3d/Callouts'
import { REGIONS } from '@/features/body3d/regions'
import { Instruments } from '@/features/overview/Instruments'
import { buildRows, formatValue, statusByRegion, summarize, type InstrumentRow } from '@/features/overview/model'
import { Rail, VIEWS, type View } from '@/features/overview/Rail'
import { StatusStrip } from '@/features/overview/StatusStrip'
import { latestReadings, loadReadings, saveReading } from '@/store/readings'
import { loadWellbeing, saveWellbeing } from '@/store/wellbeing'

const NEXT_UP: Partial<Record<View, string>> = {
  trends: 'See every reading over the mission on one time axis, with your normal band and usual value marked.',
  earth: 'Follow reports to the flight surgeon and replies back, with the real signal delay for the mission.',
  schedule: "Today's checks, reminders and your measurement streak.",
}

function ComingNext({ view, onBack }: { view: View; onBack: () => void }) {
  const label = VIEWS.find((v) => v.id === view)?.label ?? ''
  return (
    <div className="flex h-full flex-col items-start justify-center gap-3 p-8">
      <h2 className="text-xl font-semibold">{label}</h2>
      <p className="text-muted-foreground max-w-prose">{NEXT_UP[view]}</p>
      <p className="text-muted-foreground text-sm">This screen is being built next.</p>
      <button type="button" onClick={onBack} className="text-primary text-sm font-medium underline-offset-2 hover:underline">
        Back to overview
      </button>
    </div>
  )
}

const SHORT_NAME: Record<BodyRegion, string> = {
  brain: 'Brain',
  eyes: 'Eyes',
  heart: 'Heart',
  lungs: 'Lungs',
  immune: 'Immune system',
  musculoskeletal: 'Bones and muscles',
  'whole-body': 'Metabolism',
}

const SEVERITY: Record<Status, number> = { normal: 0, 'no-data': 1, stale: 1, caution: 2, danger: 3 }
const NO_BASELINE: Partial<Record<IndicatorId, number>> = {}

function loadSafely<T>(load: () => T[], message: string) {
  try {
    return { items: load(), error: '' }
  } catch {
    return { items: [] as T[], error: message }
  }
}

function App() {
  const [night, setNight] = useState(false)
  const [view, setView] = useState<View>('overview')
  const [region, setRegion] = useState<BodyRegion | null>(null)
  const [indicator, setIndicator] = useState<IndicatorId | null>(null)

  const [initialReadings] = useState(() =>
    loadSafely<Reading>(
      () => loadReadings(window.localStorage),
      'Saved measurements could not be loaded. Check browser storage and reload; existing data has not been overwritten.',
    ),
  )
  const [initialChecks] = useState(() =>
    loadSafely<WellbeingCheck>(
      () => loadWellbeing(window.localStorage),
      'Saved well-being check-ins could not be loaded. Existing answers have not been overwritten; check browser storage and reload.',
    ),
  )
  const [readings, setReadings] = useState<Reading[]>(initialReadings.items)
  const [checks, setChecks] = useState<WellbeingCheck[]>(initialChecks.items)
  const [storageError, setStorageError] = useState(initialReadings.error)
  const [wellbeingError, setWellbeingError] = useState(initialChecks.error)

  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day'
  }, [night])

  const onSaveReading = (reading: Reading) => {
    if (initialReadings.error) return false
    try {
      setReadings(saveReading(window.localStorage, readings, reading))
      setStorageError('')
      return true
    } catch {
      setStorageError('Measurement could not be saved. Browser storage may be full or unavailable. Check storage and try again.')
      return false
    }
  }
  const onSaveWellbeing = (check: WellbeingCheck) => {
    try {
      setChecks(saveWellbeing(window.localStorage, checks, check))
      setWellbeingError('')
      return true
    } catch {
      setWellbeingError('Well-being check-in could not be saved. Check browser storage and try again.')
      return false
    }
  }

  const hasSavedData = readings.length > 0 || checks.length > 0
  const shownReadings = useMemo(
    () => (readings.length ? latestReadings(readings).filter((r) => r.indicatorId !== 'mood') : checks.length ? [] : DEMO_READINGS),
    [readings, checks],
  )
  const currentCheck = checks.at(-1)
  const wellbeing = currentCheck ? assessWellbeing(currentCheck) : undefined

  const baseline = hasSavedData ? NO_BASELINE : DEMO_BASELINE
  const rows = useMemo(() => buildRows(shownReadings, baseline), [shownReadings, baseline])
  const { attentionCount, top } = useMemo(() => summarize(rows), [rows])
  const overall = worstStatus([...rows.map((r) => r.assessment), ...(wellbeing ? [wellbeing] : [])])
  const regionStatus = useMemo(() => {
    const base = statusByRegion(rows, REGIONS.map((r) => r.id))
    if (wellbeing && (base.brain === 'no-data' || wellbeing.status === 'caution')) base.brain = wellbeing.status
    return base
  }, [rows, wellbeing])

  const callouts = useMemo(() => {
    const result: Partial<Record<BodyRegion, Callout>> = {}
    for (const r of REGIONS) {
      const lead = rows
        .filter((row) => row.def.region === r.id)
        .sort((a, b) => SEVERITY[b.assessment.status] - SEVERITY[a.assessment.status])[0]
      result[r.id] = {
        title: SHORT_NAME[r.id],
        value: lead ? `${formatValue(lead.reading.value)} ${lead.def.unit}` : r.id === 'eyes' ? 'Not tracked yet' : undefined,
        status: regionStatus[r.id],
      }
    }
    return result
  }, [rows, regionStatus])

  const selectRow = (row: InstrumentRow | null) => {
    setView('overview')
    setIndicator(row?.id ?? null)
    setRegion(row?.def.region ?? null)
  }
  const selectRegion = (r: BodyRegion | null) => {
    setRegion(r)
    setIndicator(null)
  }

  return (
    <div className="flex min-h-svh flex-col">
      <StatusStrip
        overall={overall}
        attentionCount={attentionCount + (wellbeing?.status === 'caution' ? 1 : 0)}
        top={top}
        mission={DEMO_MISSION}
        night={night}
        onToggleNight={() => setNight((n) => !n)}
        onOpen={selectRow}
      />

      <div className="grid flex-1 pb-16 md:grid-cols-[4.5rem_minmax(0,1fr)] md:pb-0 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <Rail view={view} onChange={setView} />

        <main className="grid min-h-0 lg:h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,1fr)_24rem]">
          {view === 'overview' && (
            <>
              <BodyStage theme={night ? 'night' : 'day'} statusByRegion={regionStatus} callouts={callouts} selected={region} onSelect={selectRegion} />
              <aside aria-label="Readings" className="bg-card overflow-y-auto border-t p-5 lg:border-t-0 lg:border-l">
                <p className="text-muted-foreground mb-4 text-xs">
                  {hasSavedData ? 'Your latest readings, saved on this device' : 'Illustrative demo readings — log your own to replace them'}
                </p>
                <Instruments
                  rows={rows}
                  mission={DEMO_MISSION}
                  isDemo={!hasSavedData}
                  selectedRegion={region}
                  selectedId={indicator}
                  onSelect={selectRow}
                  onLog={() => setView('log')}
                />
                {wellbeing && currentCheck && !region && (
                  <section aria-label="Well-being" className="mt-5 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold">Well-being (WHO-5)</h2>
                      <StatusBadge status={wellbeing.status} size="sm" className="text-xs" />
                    </div>
                    <p className="mt-1 text-sm">
                      <span className="text-xl font-semibold tabular">{scoreWellbeing(currentCheck.answers).percent}</span>
                      <span className="text-muted-foreground">/100 · last two weeks</span>
                    </p>
                    {wellbeing.guidance && <p className="text-muted-foreground mt-1 text-sm">{wellbeing.guidance.doNow[0]}</p>}
                  </section>
                )}
              </aside>
            </>
          )}

          {view === 'log' && (
            <div className="overflow-y-auto p-5 sm:p-8 lg:col-span-2">
              <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
                <section aria-label="Log a measurement" className="bg-card rounded-lg border p-5">
                  <h2 className="mb-4 text-lg font-semibold">Log a measurement</h2>
                  {storageError && <p role="alert" className="text-status-danger mb-3 text-sm">{storageError}</p>}
                  {!initialReadings.error && <ReadingForm onSave={onSaveReading} />}
                </section>
                <section aria-label="Well-being check-in" className="bg-card rounded-lg border p-5">
                  <h2 className="mb-4 text-lg font-semibold">Well-being check-in</h2>
                  {wellbeingError && <p role="alert" className="text-status-danger mb-3 text-sm">{wellbeingError}</p>}
                  {!initialChecks.error && <WellbeingForm onSave={onSaveWellbeing} />}
                </section>
                <section aria-label="Measurement history" className="bg-card rounded-lg border p-5 lg:col-span-2">
                  <h2 className="mb-3 text-lg font-semibold">History</h2>
                  {readings.length || checks.length ? (
                    <ul className="divide-y">
                      {[...readings].reverse().map((r, i) => (
                        <li key={`r-${r.takenAt}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                          <span>
                            {r.indicatorId === 'mood' ? 'Legacy mood (1–5)' : INDICATORS[r.indicatorId].label}:{' '}
                            <span className="font-semibold tabular">{formatValue(r.value)}</span> {INDICATORS[r.indicatorId].unit}
                          </span>
                          <time className="text-muted-foreground tabular" dateTime={r.takenAt}>{new Date(r.takenAt).toLocaleString()}</time>
                        </li>
                      ))}
                      {[...checks].reverse().map((c, i) => (
                        <li key={`w-${c.takenAt}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                          <span>
                            Well-being (WHO-5): <span className="font-semibold tabular">{scoreWellbeing(c.answers).percent}</span>/100
                          </span>
                          <time className="text-muted-foreground tabular" dateTime={c.takenAt}>{new Date(c.takenAt).toLocaleString()}</time>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">Nothing saved yet. Your measurements stay in this browser; there is no server sync.</p>
                  )}
                </section>
              </div>
            </div>
          )}

          {view !== 'overview' && view !== 'log' && (
            <div className="lg:col-span-2">
              <ComingNext view={view} onBack={() => setView('overview')} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
