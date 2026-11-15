import { lazy, Suspense, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { INDICATORS } from '@/data/indicators'
import type { Assessment, BodyRegion, BloodPressure, Reading, ReadingValue, Status } from '@/engine/types'
import { cn } from '@/lib/utils'
import { FEATURES } from '@/config/features'
import { BodyTimelinePanel, BodyTimelineToggle } from '@/features/body-timeline/BodyTimeline'
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
  const [timelineDay, setTimelineDay] = useState<number | null>(null)

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
    .map((reading, i) => ({ reading, assessment: assessments.find((a) => a.indicatorId === reading.indicatorId) ?? assessments[i], def: INDICATORS[reading.indicatorId] }))
    .filter((x) => x.def.region === selected)

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="bg-muted/40 relative h-[26rem] overflow-hidden sm:h-[34rem]">
        <div
          aria-hidden="true"
          className="absolute inset-0 [background-image:linear-gradient(var(--chart-grid)_1px,transparent_1px),linear-gradient(90deg,var(--chart-grid)_1px,transparent_1px)] [background-size:32px_32px] opacity-70"
        />
        <div className="absolute inset-0">
          {webgl ? (
            <Suspense fallback={<p className="text-muted-foreground p-4 text-sm">Loading 3D body…</p>}>
              <Body3D theme={theme} statusByRegion={statusByRegion} selected={selected} onSelect={setSelected} timelineDay={timelineDay} />
            </Suspense>
          ) : (
            <p className="text-muted-foreground p-4 text-sm">3D view is not available on this device. Use the body systems list.</p>
          )}
        </div>
        {/* One row for the top buttons: side by side when there is room, wrapped on narrow phones, never on top of each other */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-start gap-2 [&>*]:pointer-events-auto">
          {selected && (
            <button
              type="button"
              className="bg-card border-border-strong hover:bg-muted flex min-h-11 items-center gap-2 rounded-sm border px-3 text-sm font-medium"
              onClick={() => setSelected(null)}
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Whole body
            </button>
          )}
          {FEATURES.bodyTimeline && webgl && (
            <div className="ml-auto">
              <BodyTimelineToggle day={timelineDay} onChange={setTimelineDay} />
            </div>
          )}
        </div>
        {FEATURES.bodyTimeline && webgl && <BodyTimelinePanel day={timelineDay} onChange={setTimelineDay} />}
        <p className="label text-subtle-foreground pointer-events-none absolute bottom-3 left-4 hidden sm:block">Drag to rotate · scroll to zoom</p>
        <p className="text-subtle-foreground absolute right-3 bottom-3 max-w-[60%] text-right text-[10px] leading-snug">
          Model:{' '}
          <a className="underline underline-offset-2" href="https://humanatlas.io/3d-reference-library" target="_blank" rel="noreferrer">
            HuBMAP HRA
          </a>
          ;{' '}
          <a className="underline underline-offset-2" href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/" target="_blank" rel="noreferrer">
            BodyParts3D © DBCLS
          </a>
          , CC BY 4.0
        </p>
      </div>

      <div className="border-border flex flex-col border-t lg:border-t-0 lg:border-l">
        <nav aria-label="Body systems">
          <ul>
            {REGIONS.map((r) => (
              <li key={r.id} className="border-border border-b">
                <button
                  type="button"
                  aria-pressed={selected === r.id}
                  onClick={() => setSelected(selected === r.id ? null : r.id)}
                  className={cn(
                    'hover:bg-muted relative flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm transition-colors',
                    selected === r.id && 'bg-accent font-medium',
                  )}
                >
                  {selected === r.id && <span aria-hidden="true" className="bg-primary absolute inset-y-0 left-0 w-0.5" />}
                  <span>{r.label}</span>
                  <StatusBadge status={statusByRegion[r.id]} className="shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {region ? (
          <article aria-live="polite" className="view-in p-4">
            <p className="label text-muted-foreground">Why it matters in space</p>
            <h3 className="mt-1 text-base font-semibold tracking-tight">{region.label}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{region.summary}</p>
            {regionReadings.length === 0 ? (
              <p className="text-muted-foreground border-border mt-3 border-t pt-3 text-sm">No measurement tracked for this system yet.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {regionReadings.map(({ reading, assessment, def }) => (
                  <li key={def.id} className="border-border border-t pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{def.label}</span>
                      <StatusBadge status={assessment.status} />
                    </div>
                    <p className="num mt-1 text-2xl font-semibold">
                      {formatValue(reading.value)} <span className="text-muted-foreground text-sm font-normal">{def.unit}</span>
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{def.whyInSpace}</p>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                      <span className="text-subtle-foreground">Hazard {def.hazards.join(' · ')}</span>
                      <a className="font-medium underline underline-offset-2" href={def.sourceUrl} target="_blank" rel="noreferrer">
                        Source
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ) : (
          <p className="text-muted-foreground p-4 text-sm leading-relaxed">
            Select a body system to see its indicators, the spaceflight hazard behind them and how to measure.
          </p>
        )}
      </div>
    </div>
  )
}
