import { useEffect, useState } from 'react'
import { ReadingForm } from '@/components/ReadingForm'
import { StatusBadge } from '@/components/StatusBadge'
import { WellbeingForm } from '@/components/WellbeingForm'
import { Button } from '@/components/ui/button'
import { INDICATORS } from '@/data/indicators'
import { DEMO_READINGS } from '@/data/demo-readings'
import { assess, worstStatus } from '@/engine/assess'
import { assessWellbeing, scoreWellbeing } from '@/engine/wellbeing'
import type { WellbeingCheck } from '@/engine/wellbeing'
import { BodyExplorer } from '@/features/body3d/BodyExplorer'
import { latestReadings, loadReadings, saveReading } from '@/store/readings'
import { loadWellbeing, saveWellbeing } from '@/store/wellbeing'
import type { BloodPressure, Reading, ReadingValue } from '@/engine/types'

const formatValue = (value: ReadingValue) =>
  typeof value === 'number' ? String(value) : `${(value as BloodPressure).systolic}/${(value as BloodPressure).diastolic}`

function App() {
  const [night, setNight] = useState(false)
  const [initial] = useState(() => {
    try {
      return { readings: loadReadings(window.localStorage), error: '' }
    } catch {
      return {
        readings: [] as Reading[],
        error: 'Saved measurements could not be loaded. Check browser storage and reload; existing data has not been overwritten.',
      }
    }
  })
  const [readings, setReadings] = useState<Reading[]>(initial.readings)
  const [storageError, setStorageError] = useState(initial.error)
  const [wellbeingInitial] = useState(() => {
    try {
      return { checks: loadWellbeing(window.localStorage), error: '' }
    } catch {
      return {
        checks: [] as WellbeingCheck[],
        error: 'Saved well-being check-ins could not be loaded. Existing answers have not been overwritten; check browser storage and reload.',
      }
    }
  })
  const [checks, setChecks] = useState(wellbeingInitial.checks)
  const [wellbeingStorageError, setWellbeingStorageError] = useState(wellbeingInitial.error)

  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day'
  }, [night])

  const ready = !initial.error
  const onSave = (reading: Reading) => {
    if (!ready) return false
    try {
      const next = saveReading(window.localStorage, readings, reading)
      setReadings(next)
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
      setWellbeingStorageError('')
      return true
    } catch {
      setWellbeingStorageError('Well-being check-in could not be saved. Check browser storage and try again.')
      return false
    }
  }

  const latest = latestReadings(readings)
  const currentCheck = checks.at(-1)
  const hasSavedData = readings.length > 0 || checks.length > 0
  const dashboardReadings = readings.length
    ? latest.filter((reading) => reading.indicatorId !== 'mood')
    : checks.length
      ? []
      : DEMO_READINGS
  const assessments = dashboardReadings.map(assess)
  const overallAssessments = currentCheck
    ? [...assessments, assessWellbeing(currentCheck)]
    : assessments
  const overall = worstStatus(overallAssessments)

  return (
    <main className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Astro Health Monitor</h1>
          <p className="text-muted-foreground text-sm">
            {hasSavedData
              ? 'Measurements saved on this device'
              : 'Mission day 47 · Mars transit · illustrative demo data'}
          </p>
        </div>
        <Button variant="outline" aria-pressed={night} onClick={() => setNight((value) => !value)}>
          {night ? 'Day mode' : 'Night mode'}
        </Button>
      </header>

      {storageError && <p role="alert">{storageError}</p>}
      {ready && <ReadingForm onSave={onSave} />}
      {wellbeingStorageError && <p role="alert">{wellbeingStorageError}</p>}
      {!wellbeingInitial.error && <WellbeingForm onSave={onSaveWellbeing} />}
      {!hasSavedData && <p>Log a measurement or complete a well-being check-in to save your own status.</p>}

      <section aria-label="Overall status" className="bg-card rounded-xl border p-5">
        <p className="text-muted-foreground text-sm">Overall</p>
        <StatusBadge status={overall} className="text-2xl" />
      </section>

      <BodyExplorer readings={dashboardReadings} assessments={assessments} theme={night ? 'night' : 'day'} />

      <section aria-label="Latest measurements" className="grid gap-3">
        <h2 className="text-lg font-semibold">
          {hasSavedData ? 'Latest saved measurements' : 'Illustrative demo measurements'}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {dashboardReadings.map((reading, index) => {
            const definition = INDICATORS[reading.indicatorId]
            return (
              <li
                key={reading.indicatorId}
                className="bg-card flex items-center justify-between rounded-xl border p-4"
              >
                <div>
                  <p className="text-muted-foreground text-sm">{definition.label}</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatValue(reading.value)}{' '}
                    <span className="text-muted-foreground text-sm font-normal">{definition.unit}</span>
                  </p>
                </div>
                <StatusBadge status={assessments[index].status} />
              </li>
            )
          })}
        </ul>
      </section>

      {currentCheck && (
        <section className="bg-card grid gap-2 rounded-xl border p-5" aria-label="Latest well-being result">
          <h2 className="text-lg font-semibold">Latest well-being result</h2>
          <p>WHO-5: {scoreWellbeing(currentCheck.answers).percent}/100 · Last two weeks</p>
          <StatusBadge status={assessWellbeing(currentCheck).status} />
          <p>
            {assessWellbeing(currentCheck).guidance?.doNow.join(' ') ??
              'You can request support at any score.'}
          </p>
          <time dateTime={currentCheck.takenAt}>{new Date(currentCheck.takenAt).toLocaleString()}</time>
        </section>
      )}

      <section className="grid gap-3" aria-label="Measurement history">
        <h2 className="text-lg font-semibold">Measurement history</h2>
        {readings.length ? (
          <ul className="grid gap-2">
            {[...readings].reverse().map((reading, index) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
                key={`${reading.takenAt}-${index}`}
              >
                <span>
                  {reading.indicatorId === 'mood'
                    ? 'Legacy mood (1–5)'
                    : INDICATORS[reading.indicatorId].label}
                  : {formatValue(reading.value)} {INDICATORS[reading.indicatorId].unit}
                </span>
                <time dateTime={reading.takenAt}>{new Date(reading.takenAt).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground text-sm">No saved measurements yet.</p>}
      </section>

      <section className="grid gap-3" aria-label="Well-being history">
        <h2 className="text-lg font-semibold">Well-being history</h2>
        {checks.length ? (
          <ul className="grid gap-2">
            {[...checks].reverse().map((check, index) => (
              <li key={`${check.takenAt}-${index}`}>
                WHO-5: {scoreWellbeing(check.answers).percent}/100 ·{' '}
                <time dateTime={check.takenAt}>{new Date(check.takenAt).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground text-sm">No saved well-being check-ins yet.</p>}
      </section>

      <p className="text-muted-foreground text-xs">
        Supports self-assessment only; it does not diagnose. Data stays in this browser&apos;s storage;
        no server sync is implemented. Thresholds are defaults pending science review.
      </p>
    </main>
  )
}

export default App
