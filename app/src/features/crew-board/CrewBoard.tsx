import { ArrowRight, Radiation, TrendingDown } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { staggerChild, staggerParent } from '@/components/motion-config'
import { PageBanner } from '@/components/PageBanner'
import { StatusBadge, StatusGlyph } from '@/components/StatusBadge'
import { STATUS_META } from '@/components/status-meta'
import { CREW, CREW_ORDER, type CrewId } from '@/data/crew'
import { DEMO_HISTORY_BY_CREW } from '@/data/demo-readings'
import { INDICATORS } from '@/data/indicators'
import { MISSION_DAY_TODAY } from '@/data/missions'
import { CAREER_LIMIT_MSV, DOSE_RATE, PRIOR_CAREER_MSV } from '@/data/radiation'
import { formatValue } from '@/engine/assess'
import type { IndicatorId } from '@/engine/types'
import { trendWarnings } from '@/features/trends/trends'
import { cn } from '@/lib/utils'
import { Page } from '@/shell/Page'
import { navigate } from '@/state/route'
import { loadSaved, useStore } from '@/state/store'
import { useCrewHealth } from '@/state/useHealth'

/*
  Crew medical officer board (features.crewBoard): every crew member's status,
  key vitals, slow trends and radiation dose on one screen, worst first, so a
  signal from any crew member is seen on board.
*/

const KEY_VITALS: IndicatorId[] = ['hr', 'spo2', 'temp', 'sleep']

export function CrewBoard() {
  const { crewId, setCrew, mode } = useStore()
  const health = useCrewHealth()
  const trends = useMemo(
    () =>
      Object.fromEntries(
        CREW_ORDER.map((id) => [id, trendWarnings([...DEMO_HISTORY_BY_CREW[id], ...loadSaved(id).readings])]),
      ) as Record<CrewId, ReturnType<typeof trendWarnings>>,
    [],
  )
  const order = [...CREW_ORDER].sort((a, b) => {
    const rank = { danger: 0, caution: 1, stale: 2, 'no-data': 2, normal: 3 }
    return rank[health[a].summary.overall] - rank[health[b].summary.overall]
  })
  const open = (id: CrewId) => {
    setCrew(id)
    navigate('overview')
  }

  return (
    <>
      <PageBanner eyebrow={`Crew medical officer · ${CREW.cm1.callsign}`} title="Crew board">
        Everyone on board at a glance, worst first. Open a crew member to see their readings and guidance.
      </PageBanner>
      <Page>
        <motion.ul variants={staggerParent} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-3">
          {order.map((id) => {
            const { summary, readings } = health[id]
            const meta = STATUS_META[summary.overall]
            const dose = PRIOR_CAREER_MSV[id] + DOSE_RATE[mode].mSvPerDay * MISSION_DAY_TODAY
            const tw = trends[id]
            return (
              <motion.li key={id} variants={staggerChild}>
                <article
                  className={cn(
                    'bg-card flex h-full flex-col rounded-md border',
                    summary.overall === 'danger' ? 'border-status-danger' : summary.overall === 'caution' ? 'border-status-caution' : 'border-border',
                    crewId === id && 'ring-foreground ring-1',
                  )}
                >
                  <header className={cn('flex items-center gap-3 rounded-t-md px-4 py-3', meta.soft)}>
                    <span className="bg-card num flex size-10 items-center justify-center rounded-full text-sm font-semibold">{CREW[id].initials}</span>
                    <div className="min-w-0 flex-1">
                      <p className="num font-semibold">{CREW[id].callsign}</p>
                      <p className="text-muted-foreground truncate text-xs">{CREW[id].role}</p>
                    </div>
                    <StatusBadge status={summary.overall} size="lg" />
                  </header>
                  <dl className="grid grid-cols-2 gap-px border-b">
                    {KEY_VITALS.map((k) => {
                      const r = readings.find((x) => x.indicatorId === k)
                      const status = r ? INDICATORS[k].classify(r.value) : 'no-data'
                      return (
                        <div key={k} className="px-4 py-3">
                          <dt className="text-muted-foreground text-xs">{INDICATORS[k].label}</dt>
                          <dd className="mt-0.5 flex items-center gap-1.5">
                            <StatusGlyph status={status} />
                            <span className="num text-lg font-semibold">{r ? formatValue(k, r.value) : '-'}</span>
                            <span className="text-muted-foreground text-xs">{INDICATORS[k].unit}</span>
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                  <div className="grid flex-1 gap-2 px-4 py-3 text-sm">
                    <p className="text-muted-foreground">
                      <span className="num text-foreground font-semibold">{summary.counts.caution + summary.counts.danger}</span> of {readings.length} off-nominal
                    </p>
                    {tw.length > 0 && (
                      <p className="flex gap-2">
                        <TrendingDown className="text-status-caution mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <span>{tw[0].text}</span>
                      </p>
                    )}
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Radiation className="size-4 shrink-0" aria-hidden="true" />
                      <span>
                        <span className="num text-foreground">{Math.round(dose)}</span> / {CAREER_LIMIT_MSV} mSv career dose
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => open(id)}
                    className="border-border hover:bg-muted flex min-h-11 items-center justify-between rounded-b-md border-t px-4 text-sm font-medium transition-colors"
                  >
                    Open {CREW[id].callsign} <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                </article>
              </motion.li>
            )
          })}
        </motion.ul>
        <p className="text-muted-foreground mt-6 text-xs">Synthetic crew and readings. Supports self-assessment; it does not diagnose.</p>
      </Page>
    </>
  )
}
