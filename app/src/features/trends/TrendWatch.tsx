import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { EASE_OUT } from '@/components/motion-config'
import { Panel, PanelHeader } from '@/components/Panel'
import { TREND_RULES } from '@/data/trend-rules'
import { href } from '@/state/route'
import { useStore } from '@/state/store'
import { trendWarnings, type TrendWarning } from './trends'

function Mini({ w }: { w: TrendWarning }) {
  const W = 72
  const H = 24
  const lo = Math.min(...w.values)
  const hi = Math.max(...w.values)
  const span = hi - lo || 1
  const pts = w.values.map((v, i) => `${(i / (w.values.length - 1)) * (W - 4) + 2},${H - 2 - ((v - lo) / span) * (H - 4)}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="shrink-0 overflow-visible">
      <motion.polyline
        points={pts}
        fill="none"
        stroke="var(--status-caution)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
      />
    </svg>
  )
}

/* Slow changes caught before any single value crosses a threshold (features.trendWarnings) */
export function TrendWatch() {
  const { history } = useStore()
  const warnings = useMemo(() => trendWarnings(history), [history])
  return (
    <Panel aria-labelledby="trend-title">
      <PanelHeader
        id="trend-title"
        title="Trend watch"
        meta={warnings.length ? `${warnings.length} slow ${warnings.length === 1 ? 'change' : 'changes'}` : 'No slow changes'}
      />
      {warnings.length === 0 ? (
        <p className="text-muted-foreground p-4 text-sm sm:p-5">Nothing is drifting from your usual over the last days.</p>
      ) : (
        <ul className="divide-border divide-y">
          {warnings.slice(0, 4).map((w) => {
            const Icon = TREND_RULES[w.indicatorId]?.direction === 'down' ? TrendingDown : TrendingUp
            return (
              <li key={w.indicatorId}>
                <a href={href('trends', w.indicatorId)} className="hover:bg-muted/60 flex min-h-14 items-center gap-4 px-4 py-3 transition-colors sm:px-5">
                  <Icon className="text-status-caution size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-sm">{w.text}</span>
                  <Mini w={w} />
                  <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                </a>
              </li>
            )
          })}
        </ul>
      )}
      <p className="border-border text-muted-foreground border-t px-4 py-2.5 text-xs sm:px-5">
        A value can still be in range while the direction is not. Look at the cause early and re-check tomorrow.
      </p>
    </Panel>
  )
}
