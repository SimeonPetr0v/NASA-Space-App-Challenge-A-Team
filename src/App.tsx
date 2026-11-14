import { useEffect, useMemo, useState } from 'react'
import { DEMO_READINGS } from '@/data/demo-readings'
import { DEMO_BASELINE, DEMO_MISSION } from '@/data/mission'
import type { BodyRegion, IndicatorId } from '@/engine/types'
import { BodyStage } from '@/features/body3d/BodyStage'
import { REGIONS } from '@/features/body3d/regions'
import { Instruments } from '@/features/overview/Instruments'
import { buildRows, statusByRegion, summarize, type InstrumentRow } from '@/features/overview/model'
import { Rail, VIEWS, type View } from '@/features/overview/Rail'
import { StatusStrip } from '@/features/overview/StatusStrip'

const NEXT_UP: Partial<Record<View, string>> = {
  log: 'Log a reading with large steppers, your last value pre-filled and a live status preview before saving.',
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

function App() {
  const [night, setNight] = useState(false)
  const [view, setView] = useState<View>('overview')
  const [region, setRegion] = useState<BodyRegion | null>(null)
  const [indicator, setIndicator] = useState<IndicatorId | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day'
  }, [night])

  const rows = useMemo(() => buildRows(DEMO_READINGS, DEMO_BASELINE), [])
  const { overall, attentionCount, top } = useMemo(() => summarize(rows), [rows])
  const regionStatus = useMemo(() => statusByRegion(rows, REGIONS.map((r) => r.id)), [rows])

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
        attentionCount={attentionCount}
        top={top}
        mission={DEMO_MISSION}
        night={night}
        onToggleNight={() => setNight((n) => !n)}
        onOpen={selectRow}
      />

      <div className="grid flex-1 pb-16 md:grid-cols-[4.5rem_minmax(0,1fr)] md:pb-0 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <Rail view={view} onChange={setView} />

        <main className="grid min-h-0 lg:h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,1fr)_24rem]">
          {view === 'overview' ? (
            <>
              <BodyStage theme={night ? 'night' : 'day'} statusByRegion={regionStatus} selected={region} onSelect={selectRegion} />
              <aside aria-label="Readings" className="bg-card overflow-y-auto border-t p-5 lg:border-t-0 lg:border-l">
                <Instruments
                  rows={rows}
                  mission={DEMO_MISSION}
                  selectedRegion={region}
                  selectedId={indicator}
                  onSelect={selectRow}
                  onLog={() => setView('log')}
                />
              </aside>
            </>
          ) : (
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
