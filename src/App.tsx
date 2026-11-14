import { useEffect, useState } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { INDICATORS } from '@/data/indicators'
import { DEMO_READINGS } from '@/data/demo-readings'
import { assess, worstStatus } from '@/engine/assess'
import { BodyExplorer } from '@/features/body3d/BodyExplorer'
import type { BloodPressure, ReadingValue } from '@/engine/types'

/*
  Skeleton screen proving the pipeline: readings → engine → status (glyph + word).
  Replace freely — the real home screen is the Design & UI team's work.
*/

const formatValue = (value: ReadingValue) =>
  typeof value === 'number' ? String(value) : `${(value as BloodPressure).systolic}/${(value as BloodPressure).diastolic}`

function App() {
  const [night, setNight] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day'
  }, [night])

  const assessments = DEMO_READINGS.map(assess)
  const overall = worstStatus(assessments)

  return (
    <main className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Astro Health Monitor</h1>
          <p className="text-muted-foreground text-sm">Mission day 47 · Mars transit · demo data</p>
        </div>
        <Button variant="outline" aria-pressed={night} onClick={() => setNight((n) => !n)}>
          {night ? 'Day mode' : 'Night mode'}
        </Button>
      </header>

      <section aria-label="Overall status" className="bg-card rounded-xl border p-5">
        <p className="text-muted-foreground text-sm">Overall</p>
        <StatusBadge status={overall} className="text-2xl" />
      </section>

      <BodyExplorer readings={DEMO_READINGS} assessments={assessments} theme={night ? 'night' : 'day'} />

      <ul className="grid gap-3 sm:grid-cols-2">
        {DEMO_READINGS.map((reading, i) => {
          const def = INDICATORS[reading.indicatorId]
          return (
            <li key={reading.indicatorId} className="bg-card flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-muted-foreground text-sm">{def.label}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatValue(reading.value)} <span className="text-muted-foreground text-sm font-normal">{def.unit}</span>
                </p>
              </div>
              <StatusBadge status={assessments[i].status} />
            </li>
          )
        })}
      </ul>

      <p className="text-muted-foreground text-xs">
        Supports self-assessment only; it does not diagnose. Thresholds are defaults pending science review.
      </p>
    </main>
  )
}

export default App
