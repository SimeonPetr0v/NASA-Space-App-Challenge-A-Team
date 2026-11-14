import { lazy, Suspense, useMemo, useState } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { INDICATORS } from '@/data/indicators'
import type { Assessment, BodyRegion, BloodPressure, Reading, ReadingValue, Status } from '@/engine/types'
import { cn } from '@/lib/utils'
import { REGIONS } from './regions'

const Body3D = lazy(() => import('./Body3D'))

const SEVERITY: Record<Status, number> = { normal: 0, 'no-data': 1, stale: 1, caution: 2, danger: 3 }

const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const formatValue = (value: ReadingValue) =>
  typeof value === 'number' ? String(value) : `${(value as BloodPressure).systolic}/${(value as BloodPressure).diastolic}`

type Props = {
  readings: Reading[]
  assessments: Assessment[]
  theme: 'day' | 'night'
}

export function BodyExplorer({ readings, assessments, theme }: Props) {
  const [selected, setSelected] = useState<BodyRegion | null>(null)
  const [webgl] = useState(hasWebGL)

  const statusByRegion = useMemo(() => {
    const result = Object.fromEntries(REGIONS.map((r) => [r.id, 'no-data'])) as Record<BodyRegion, Status>
    for (const a of assessments) {
      const region = INDICATORS[a.indicatorId].region
      if (result[region] === 'no-data' || SEVERITY[a.status] > SEVERITY[result[region]]) result[region] = a.status
    }
    return result
  }, [assessments])

  const region = REGIONS.find((r) => r.id === selected)
  const regionReadings = readings
    .map((reading, i) => ({ reading, assessment: assessments[i], def: INDICATORS[reading.indicatorId] }))
    .filter((x) => x.def.region === selected)

  return (
    <section aria-label="Body explorer" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="bg-card relative h-[28rem] overflow-hidden rounded-xl border sm:h-[34rem]">
        {webgl ? (
          <Suspense fallback={<p className="text-muted-foreground p-4 text-sm">Loading 3D body…</p>}>
            <Body3D theme={theme} statusByRegion={statusByRegion} selected={selected} onSelect={setSelected} />
          </Suspense>
        ) : (
          <p className="text-muted-foreground p-4 text-sm">3D view is not available on this device. Use the body systems list.</p>
        )}
        {selected && (
          <Button variant="outline" size="sm" className="absolute top-3 left-3" onClick={() => setSelected(null)}>
            Whole body view
          </Button>
        )}
        <p className="text-muted-foreground pointer-events-none absolute bottom-3 left-3 text-xs">Drag to rotate · scroll to zoom · select a marker</p>
        <p className="text-muted-foreground absolute top-3 right-3 max-w-[60%] text-right text-[10px] leading-snug">
          Body model:{' '}
          <a className="underline underline-offset-2" href="https://humanatlas.io/3d-reference-library" target="_blank" rel="noreferrer">
            HuBMAP Human Reference Atlas
          </a>
          ; ribs & heart vessels:{' '}
          <a className="underline underline-offset-2" href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/" target="_blank" rel="noreferrer">
            BodyParts3D © DBCLS
          </a>
          , CC BY 4.0
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <nav aria-label="Body systems" className="bg-card rounded-xl border p-2">
          <ul className="flex flex-col">
            {REGIONS.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={selected === r.id}
                  onClick={() => setSelected(selected === r.id ? null : r.id)}
                  className={cn(
                    'hover:bg-accent focus-visible:ring-ring flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-sm focus-visible:ring-2 focus-visible:outline-none',
                    selected === r.id && 'bg-accent',
                  )}
                >
                  <span>{r.label}</span>
                  <StatusBadge status={statusByRegion[r.id]} className="shrink-0 text-xs" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {region && (
          <article aria-live="polite" className="bg-card rounded-xl border p-4">
            <h2 className="font-semibold">{region.label}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{region.summary}</p>
            {regionReadings.length === 0 ? (
              <p className="mt-3 text-sm">No measurement tracked for this system yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {regionReadings.map(({ reading, assessment, def }) => (
                  <li key={def.id} className="border-t pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm">{def.label}</span>
                      <StatusBadge status={assessment.status} className="text-xs" />
                    </div>
                    <p className="text-xl font-semibold tabular-nums">
                      {formatValue(reading.value)} <span className="text-muted-foreground text-sm font-normal">{def.unit}</span>
                    </p>
                    <p className="text-muted-foreground text-xs">{def.whyInSpace}</p>
                    <a className="text-xs underline underline-offset-2" href={def.sourceUrl} target="_blank" rel="noreferrer">
                      Source
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        )}
      </div>
    </section>
  )
}
