import { ArrowRight, BedDouble, Send } from 'lucide-react'
import { motion } from 'motion/react'
import { Fragment } from 'react'
import { staggerChild, staggerParent } from '@/components/motion-config'
import { MissionTrack } from '@/components/MissionTrack'
import { FEATURES } from '@/config/features'
import { RadiationBudget } from '@/features/radiation/RadiationBudget'
import { TrendWatch } from '@/features/trends/TrendWatch'
import { RangeGauge } from '@/components/RangeGauge'
import { Page } from '@/shell/Page'
import { Panel, PanelHeader } from '@/components/Panel'
import { StatusBadge, StatusGlyph } from '@/components/StatusBadge'
import { STATUS_META } from '@/components/status-meta'
import { Sparkline } from '@/components/charts/Sparkline'
import { Action, ActionLink } from '@/components/ui/action'
import { missionDayOf } from '@/data/demo-readings'
import { INDICATORS } from '@/data/indicators'
import { MISSIONS } from '@/data/missions'
import { baselineOf, ESCALATION_TEXT, formatValue, primaryValue, SEVERITY, seriesOf } from '@/engine/assess'
import type { Escalation } from '@/engine/types'
import { BodyExplorer } from '@/features/body3d/BodyExplorer'
import { delayText, relativeAge, utcTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { href } from '@/state/route'
import { useSimNow, useStore } from '@/state/store'
import { useHealth } from '@/state/useHealth'

const STEPS: { level: Escalation; title: string; who: string }[] = [
  { level: 'self-care', title: 'Self-care', who: 'You, using the guidance' },
  { level: 'crew-medical-officer', title: 'Crew medical officer', who: 'On board' },
  { level: 'flight-surgeon', title: 'Flight surgeon', who: 'Mission Control, Earth' },
]
const RANK: Record<Escalation, number> = { none: 0, 'self-care': 1, 'crew-medical-officer': 2, 'flight-surgeon': 3 }

function StatusSummary() {
  const { readings, assessments, summary } = useHealth()
  const { mode, delaySec, sendReport } = useStore()
  const meta = STATUS_META[summary.overall]
  const top = summary.priority[0]
  const topDef = top ? INDICATORS[top.indicatorId] : undefined
  const offCount = summary.counts.caution + summary.counts.danger
  const headline =
    offCount === 0
      ? 'All indicators within the usual range'
      : `${offCount} of ${assessments.length} indicators outside the usual range`

  return (
    <Panel aria-labelledby="summary-title" className={cn('relative overflow-hidden', summary.overall === 'danger' && 'danger-once')}>
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', meta.rule)} />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="p-5 pl-6 sm:p-6 sm:pl-7">
          <p className="label text-muted-foreground" id="summary-title">
            Overall status
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className={cn('flex items-center gap-2.5 text-2xl font-semibold tracking-tight uppercase sm:text-[1.75rem]', meta.ink)}>
              <StatusGlyph status={summary.overall} className="size-5" />
              {meta.word}
            </p>
            <p className="text-foreground text-base sm:text-lg">{headline}</p>
          </div>
          <dl className="text-muted-foreground mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {(['normal', 'caution', 'danger'] as const).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <StatusGlyph status={s} />
                <dt>{STATUS_META[s].word}</dt>
                <dd className="num text-foreground font-semibold">{summary.counts[s]}</dd>
              </div>
            ))}
          </dl>

          {summary.combinations.map((c) => (
            <div key={c.id} className="border-status-caution bg-status-caution-soft mt-5 border-l-2 px-4 py-3">
              <p className="label text-status-caution-ink">Combined finding</p>
              <p className="mt-1 text-sm font-semibold">{c.title}</p>
              <p className="text-muted-foreground mt-0.5 text-sm">{c.detail}</p>
            </div>
          ))}

          {top && topDef?.guidance && top.guidance ? (
            <div className="border-border mt-5 border-t pt-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="label text-muted-foreground">Next action</p>
                <p className="text-sm font-semibold">{topDef.label}</p>
                <StatusBadge status={top.status} />
              </div>
              <ol className="mt-3 grid gap-2">
                {top.guidance.doNow.map((step, i) => (
                  <li key={step} className="flex gap-3 text-[0.9375rem] leading-snug">
                    <span className="num text-muted-foreground w-4 shrink-0 text-right text-sm">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6 sm:gap-y-2">
                <dt className="text-muted-foreground">Re-check in</dt>
                <dd className="num font-medium">{top.guidance.recheckIn}</dd>
                <dt className="text-muted-foreground">Escalate if</dt>
                <dd>{top.guidance.escalateIf}</dd>
              </dl>
              {summary.priority.length > 1 && (
                <p className="text-muted-foreground mt-4 text-sm">
                  Also off-nominal:{' '}
                  {summary.priority.slice(1).map((a, i) => (
                    <span key={a.indicatorId}>
                      {i > 0 && ', '}
                      <a href={href('trends', a.indicatorId)} className="text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-foreground">
                        {INDICATORS[a.indicatorId].label.toLowerCase()}
                      </a>
                    </span>
                  ))}
                  .
                </p>
              )}
            </div>
          ) : (
            <p className="border-border text-muted-foreground mt-5 border-t pt-5 text-sm">No action needed. Next scheduled check: tomorrow morning.</p>
          )}
        </div>

        <aside aria-label="Escalation" className="border-border bg-muted/50 flex flex-col border-t p-5 sm:p-6 lg:border-t-0 lg:border-l">
          <p className="label text-muted-foreground">Escalation</p>
          <p className="mt-2 text-sm font-semibold">{ESCALATION_TEXT[summary.escalation].title}</p>
          <p className="text-muted-foreground mt-0.5 text-sm">{ESCALATION_TEXT[summary.escalation].detail}</p>
          <ol className="mt-4 grid">
            {STEPS.map((s, i) => {
              const active = RANK[summary.escalation] >= RANK[s.level]
              const current = summary.escalation === s.level
              return (
                <li key={s.level} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < STEPS.length - 1 && <span aria-hidden="true" className="bg-border-strong absolute top-4 left-[5px] h-full w-px" />}
                  <span
                    aria-hidden="true"
                    className={cn('relative mt-1 size-[11px] shrink-0 border-2', active ? 'border-foreground bg-foreground' : 'border-border-strong bg-card')}
                  />
                  <div className="min-w-0">
                    <p className={cn('text-sm', current ? 'font-semibold' : active ? 'font-medium' : 'text-muted-foreground')}>
                      {s.title}
                      {current && <span className="sr-only"> (current level)</span>}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {s.who}
                      {s.level === 'flight-surgeon' && <> · {delayText(delaySec)} one way</>}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="text-muted-foreground mt-4 text-xs leading-relaxed">{MISSIONS[mode].context}</p>
          <div className="mt-auto grid gap-2 pt-5">
            <ActionLink variant="primary" href={href('log')}>
              Log new reading <ArrowRight aria-hidden="true" />
            </ActionLink>
            <Action
              onClick={() => sendReport(assessments, readings, 'Morning check report')}
            >
              <Send aria-hidden="true" /> Send report to Earth
            </Action>
          </div>
        </aside>
      </div>
    </Panel>
  )
}

function ReadingsTable() {
  const { history } = useStore()
  const { readings, assessments, who5 } = useHealth()
  const now = useSimNow(60_000)
  const latestAt = readings.reduce((a, r) => (Date.parse(r.takenAt) > a ? Date.parse(r.takenAt) : a), 0)
  const paired = readings.map((r, i) => ({ r, a: assessments.find((x) => x.indicatorId === r.indicatorId) ?? assessments[i] }))
  const isOff = (p: (typeof paired)[number]) => p.a.status === 'caution' || p.a.status === 'danger'
  const ordered = [
    ...paired.filter(isOff).sort((x, y) => SEVERITY[y.a.status] - SEVERITY[x.a.status]),
    ...paired.filter((p) => !isOff(p)),
  ]
  const attentionCount = paired.filter(isOff).length
  return (
    <Panel aria-labelledby="readings-title">
      <PanelHeader
        id="readings-title"
        title="Latest readings"
        meta={
          latestAt ? (
            <span className="num">
              Mission day {missionDayOf(new Date(latestAt).toISOString())} · {utcTime(latestAt)} UTC
            </span>
          ) : undefined
        }
        action={
          <a href={href('trends')} className="text-muted-foreground hover:text-foreground flex min-h-11 items-center gap-1 text-xs font-medium">
            All trends <ArrowRight className="size-3.5" aria-hidden="true" />
          </a>
        }
      />
      <motion.div role="table" aria-label="Latest readings" className="text-sm md:overflow-x-auto" variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
        <div
          role="row"
          className="text-muted-foreground border-border hidden min-w-[62rem] grid-cols-[minmax(11rem,1.4fr)_8rem_7.5rem_7.5rem_5.5rem_8rem_6rem] items-center gap-4 border-b px-5 py-2 md:grid"
        >
          <span role="columnheader" className="label">Indicator</span>
          <span role="columnheader" className="label text-right">Reading</span>
          <span role="columnheader" className="label">Status</span>
          <span role="columnheader" className="label">Last 7 days</span>
          <span role="columnheader" className="label text-right">vs baseline</span>
          <span role="columnheader" className="label">Where you are</span>
          <span role="columnheader" className="label text-right">Measured</span>
        </div>
        {ordered.map(({ r, a }, i) => {
          const firstFine = i === attentionCount
          const firstOff = i === 0 && attentionCount > 0
          const def = INDICATORS[r.indicatorId]
          const isWho5 = r.indicatorId === 'mood' && who5 !== undefined
          const shown = isWho5 ? String(who5.percent) : formatValue(r.indicatorId, r.value)
          const unit = isWho5 ? '/100 WHO-5' : def.unit
          const meta = STATUS_META[a.status]
          const off = a.status === 'caution' || a.status === 'danger'
          const delta = a.baselineDelta
          return (
            <Fragment key={r.indicatorId}>
            {(firstOff || firstFine) && (
              <div role="row" className="border-border bg-muted/40 border-b px-5 py-2 md:min-w-[62rem]">
                <span role="cell" className="label text-muted-foreground">
                  {firstOff ? `Needs attention · ${attentionCount}` : `Within your limits · ${ordered.length - attentionCount}`}
                </span>
              </div>
            )}
            <motion.a
              variants={staggerChild}
              role="row"
              href={href('trends', r.indicatorId)}
              aria-label={`${isWho5 ? 'Well-being (WHO-5)' : def.label}: ${shown} ${unit}, ${meta.word}. Open trend.`}
              className="group border-border hover:bg-muted/60 relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 border-b px-5 py-3 last:border-b-0 md:min-w-[62rem] md:grid-cols-[minmax(11rem,1.4fr)_8rem_7.5rem_7.5rem_5.5rem_8rem_6rem] md:py-2.5"
            >
              {off && <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-0.5', meta.rule)} />}
              <span role="cell" className="min-w-0">
                <span className="block font-medium">{isWho5 ? 'Well-being (WHO-5)' : def.label}</span>
                <span className="text-subtle-foreground block text-xs tracking-wide">
                  Hazard {def.hazards.join(' · ')}
                </span>
              </span>
              <span role="cell" className="num text-right">
                <span className="text-lg font-semibold">{shown}</span>
                <span className="text-muted-foreground ml-1 text-xs">{unit}</span>
              </span>
              <span role="cell" className="col-span-1 md:col-span-1">
                <StatusBadge status={a.status} />
              </span>
              <span role="cell" className="hidden md:block">
                <Sparkline id={r.indicatorId} series={seriesOf(history, r.indicatorId).slice(-7)} />
              </span>
              <span role="cell" className={cn('num hidden text-right text-xs md:block', delta !== undefined && Math.abs(delta) >= 10 ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
                {delta === undefined ? '-' : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta).toFixed(0)} %`}
              </span>
              <span role="cell" className="hidden md:block" title={isWho5 ? 'Follow-up below 13 raw (52/100)' : `Normal ${def.ranges.normal} ${def.unit}`}>
                {isWho5 ? (
                  <span className="num text-muted-foreground text-xs">≥ 52/100</span>
                ) : (
                  <RangeGauge def={def} value={primaryValue(r.value)} baseline={baselineOf(history, r.indicatorId)} />
                )}
              </span>
              <span role="cell" className="text-muted-foreground text-right text-xs">
                {relativeAge(isWho5 ? who5.takenAt : r.takenAt, now)}
              </span>
            </motion.a>
            </Fragment>
          )
        })}
      </motion.div>
    </Panel>
  )
}

/*
  The daily tool: opens straight onto mission context, status and the next
  action. The story / landing content lives on the Mission brief page.
*/
export function Overview() {
  const { readings, assessments } = useHealth()
  const { theme, mode, delaySec } = useStore()
  return (
    <Page className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-6 pb-16">
      <MissionTrack mode={mode} delaySec={delaySec} />
      {theme === 'night' && (
        <a
          href={href('sleep')}
          className="border-border-strong bg-card hover:bg-muted flex min-h-14 items-center gap-4 rounded-sm border px-4 transition-colors sm:px-5"
        >
          <BedDouble className="text-primary size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Sleep shift</span>
            <span className="text-muted-foreground block text-sm">Woke up? Log a night waking, take quick vitals or report feeling unwell.</span>
          </span>
          <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </a>
      )}
      <section id="status" className="scroll-mt-20">
        <StatusSummary />
      </section>
      {(FEATURES.trendWarnings || FEATURES.radiation) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {FEATURES.trendWarnings && <TrendWatch />}
          {FEATURES.radiation && <RadiationBudget />}
        </div>
      )}
      <Panel aria-labelledby="body-title">
        <PanelHeader id="body-title" title="Body systems" meta="Select a system to see what spaceflight does to it" />
        <BodyExplorer readings={readings} assessments={assessments} theme={theme} />
      </Panel>
      <ReadingsTable />
    </Page>
  )
}
