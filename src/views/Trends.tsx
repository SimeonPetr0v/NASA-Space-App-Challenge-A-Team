import { PageBanner } from '@/components/PageBanner'
import { RevealGrid } from '@/components/motion'
import { Page } from '@/shell/Page'
import { useState } from 'react'
import { Panel, PanelHeader } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { TrendChart } from '@/components/charts/TrendChart'
import { DEMO_TODAY, missionDayOf } from '@/data/demo-readings'
import { HAZARDS, INDICATOR_ORDER, INDICATORS } from '@/data/indicators'
import { baselineOf, classify, formatValue, primaryValue, seriesOf } from '@/engine/assess'
import type { IndicatorId } from '@/engine/types'
import { cn } from '@/lib/utils'
import { href } from '@/state/route'
import { useStore } from '@/state/store'
import { useHealth } from '@/state/useHealth'

const DAY = 86_400_000

export function Trends({ param }: { param?: string }) {
  const id: IndicatorId = INDICATOR_ORDER.includes(param as IndicatorId) ? (param as IndicatorId) : 'hr'
  const [range, setRange] = useState<7 | 30>(30)
  const { history } = useStore()
  const { assessments } = useHealth()
  const def = INDICATORS[id]
  const all = seriesOf(history, id)
  const end = Math.max(Date.parse(DEMO_TODAY), ...all.map((r) => Date.parse(r.takenAt)))
  const series = all.filter((r) => Date.parse(r.takenAt) > end - range * DAY)
  const baseline = baselineOf(history, id)
  const vals = series.map((r) => primaryValue(r.value))
  const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined
  const offDays = series.filter((r) => classify(id, r.value) !== 'normal').length
  const latest = all[all.length - 1]
  const statusOf = (x: IndicatorId) => assessments.find((a) => a.indicatorId === x)?.status ?? 'no-data'
  const fmt = (v?: number) => (v === undefined ? '-' : v.toFixed(def.input.decimals))

  return (
    <>
    <PageBanner eyebrow="Last 7 and 30 days" title="Trends">
      Spaceflight changes are slow. Watch the line against the normal band and your own baseline.
    </PageBanner>
    <Page>
    <div className="view-in grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Panel aria-labelledby="ind-title">
        <PanelHeader id="ind-title" title="Indicators" />
        <ul>
          {INDICATOR_ORDER.map((x) => (
            <li key={x} className="border-border border-b last:border-b-0">
              <a
                href={href('trends', x)}
                aria-current={x === id ? 'true' : undefined}
                className={cn('hover:bg-muted relative flex min-h-11 items-center justify-between gap-3 px-4 text-sm', x === id && 'bg-accent font-medium')}
              >
                {x === id && <span aria-hidden="true" className="bg-primary absolute inset-y-0 left-0 w-0.5" />}
                <span className="truncate">{INDICATORS[x].label}</span>
                <StatusBadge status={statusOf(x)} className="shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </Panel>

      <RevealGrid className="grid min-w-0 gap-6">
        <Panel aria-labelledby="trend-title">
          <PanelHeader
            id="trend-title"
            title={id === 'bp' ? `${def.label} (systolic)` : def.label}
            meta={`${def.unit} · mission days`}
            action={
              <div role="radiogroup" aria-label="Time range" className="border-border-strong flex h-9 rounded-sm border">
                {([7, 30] as const).map((r, i) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={range === r}
                    onClick={() => setRange(r)}
                    className={cn('num px-3 text-xs font-medium', i > 0 && 'border-border-strong border-l', range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                  >
                    {r} days
                  </button>
                ))}
              </div>
            }
          />
          <dl className="border-border grid grid-cols-2 border-b sm:grid-cols-4">
            {[
              ['Latest', latest ? formatValue(id, latest.value) : '-'],
              [`${range}-day mean`, fmt(mean)],
              ['Baseline', fmt(baseline)],
              ['Off-nominal readings', `${offDays} of ${series.length}`],
            ].map(([k, v], i) => (
              <div key={k} className={cn('border-border px-4 py-3 sm:px-5', i % 2 === 1 && 'border-l', i >= 2 && 'border-t sm:border-t-0', i === 2 && 'sm:border-l')}>
                <dt className="text-muted-foreground text-xs">{k}</dt>
                <dd className="num mt-0.5 text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="px-2 pt-4 pb-2 sm:px-4">
            <TrendChart id={id} series={series} baseline={baseline} />
          </div>
          <div className="text-muted-foreground border-border flex flex-wrap gap-x-5 gap-y-1 border-t px-4 py-3 text-xs sm:px-5">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="bg-[var(--chart-band)] border-[var(--chart-band-edge)] h-3 w-5 border" /> Normal range {def.ranges.normal}
            </span>
            <span className="flex items-center gap-2">
              <svg width="20" height="4" aria-hidden="true">
                <line x1="0" x2="20" y1="2" y2="2" stroke="var(--chart-baseline)" strokeDasharray="4 4" />
              </svg>
              Personal baseline (median of first 7 readings)
            </span>
            <span className="flex items-center gap-2">
              <StatusBadge status="caution" /> <StatusBadge status="danger" /> off-nominal reading
            </span>
          </div>
        </Panel>

        <div className="grid gap-6 md:grid-cols-2">
          <Panel aria-labelledby="why-title">
            <PanelHeader id="why-title" title="Why it matters in space" />
            <div className="grid gap-3 p-4 text-sm sm:p-5">
              <p>{def.whyInSpace}</p>
              <dl className="grid gap-2">
                {def.hazards.map((h) => (
                  <div key={h} className="grid grid-cols-[1.5rem_1fr] gap-2">
                    <dt className="num text-muted-foreground font-semibold">{h}</dt>
                    <dd>
                      <span className="font-medium">{HAZARDS[h].name}.</span> <span className="text-muted-foreground">{HAZARDS[h].effect}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Panel>
          <Panel aria-labelledby="how-title">
            <PanelHeader id="how-title" title="How to measure" />
            <dl className="grid gap-3 p-4 text-sm sm:p-5">
              <div>
                <dt className="text-muted-foreground text-xs">Method</dt>
                <dd>{def.howToMeasure}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Schedule</dt>
                <dd>{def.schedule}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Thresholds</dt>
                <dd className="num">
                  Normal {def.ranges.normal} · Caution {def.ranges.caution} · Act now {def.ranges.danger} {def.unit}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Source</dt>
                <dd>
                  <a href={def.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {def.sourceLabel}
                  </a>
                </dd>
              </div>
            </dl>
          </Panel>
        </div>

        <Panel>
          <details>
            <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-semibold sm:px-5">Data table ({series.length} readings)</summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-border border-y">
                  <tr>
                    <th className="label px-4 py-2 text-left sm:px-5">Mission day</th>
                    <th className="label px-4 py-2 text-right">Value</th>
                    <th className="label px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...series].reverse().map((r) => (
                    <tr key={r.takenAt} className="border-border border-b last:border-b-0">
                      <td className="num px-4 py-2 sm:px-5">{missionDayOf(r.takenAt)}</td>
                      <td className="num px-4 py-2 text-right">
                        {formatValue(id, r.value)} <span className="text-muted-foreground text-xs">{def.unit}</span>
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={classify(id, r.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Panel>
      </RevealGrid>
    </div>
    </Page>
    </>
  )
}
