import { ArrowRight, ChevronRight, Send } from 'lucide-react'
import { StatusGlyph } from '@/components/StatusBadge'
import { STATUS_META } from '@/components/status-meta'
import { Action, ActionLink } from '@/components/ui/action'
import { INDICATORS } from '@/data/indicators'
import { ESCALATION_TEXT, formatValue } from '@/engine/assess'
import { cn } from '@/lib/utils'
import { href } from '@/state/route'
import { useStore } from '@/state/store'
import { useHealth } from '@/state/useHealth'

/*
  Quick check: the minimal daily view for a check done several times a day.
  Status, the one thing to do now, who to involve, the readings that are off
  (one line each) and the two actions. Everything else is behind
  "Show details" on Overview.
*/
export function QuickCheck() {
  const { readings, assessments, summary } = useHealth()
  const { sendReport } = useStore()
  const meta = STATUS_META[summary.overall]
  const top = summary.priority[0]
  const valueOf = (id: string) => readings.find((r) => r.indicatorId === id)

  return (
    <section aria-labelledby="quick-title" className="panel relative overflow-hidden">
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', meta.rule)} />
      <div className="grid gap-5 p-5 pl-6 sm:p-6 sm:pl-7">
        <div>
          <h2 id="quick-title" className={cn('flex items-center gap-2.5 text-3xl font-semibold tracking-tight uppercase', meta.ink)}>
            <StatusGlyph status={summary.overall} className="size-6" />
            {meta.word}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{ESCALATION_TEXT[summary.escalation].title}</p>
        </div>

        {top?.guidance ? (
          <div className="bg-muted/60 rounded-md p-4">
            <p className="text-base font-semibold">{top.guidance.doNow[0]}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              For {INDICATORS[top.indicatorId].label.toLowerCase()} · re-check in <span className="num text-foreground font-medium">{top.guidance.recheckIn}</span>
            </p>
          </div>
        ) : (
          <p className="text-base">All readings are in their usual range. Nothing to do until the next check.</p>
        )}

        {summary.priority.length > 0 && (
          <ul aria-label="Readings outside the usual range" className="divide-border grid divide-y">
            {summary.priority.map((a) => {
              const r = valueOf(a.indicatorId)
              const def = INDICATORS[a.indicatorId]
              return (
                <li key={a.indicatorId}>
                  <a href={href('trends', a.indicatorId)} className="hover:bg-muted/60 -mx-2 flex min-h-11 items-center gap-3 rounded-sm px-2 transition-colors">
                    <StatusGlyph status={a.status} />
                    <span className="min-w-0 flex-1 truncate text-sm">{def.label}</span>
                    <span className="num text-sm font-semibold">
                      {r ? formatValue(a.indicatorId, r.value) : '-'} <span className="text-muted-foreground font-normal">{def.unit}</span>
                    </span>
                    <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
                  </a>
                </li>
              )
            })}
          </ul>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <ActionLink variant="primary" href={href('log')}>
            Log new reading <ArrowRight aria-hidden="true" />
          </ActionLink>
          <Action onClick={() => sendReport(assessments, readings, 'Morning check report')}>
            <Send aria-hidden="true" /> Send report to Earth
          </Action>
        </div>
      </div>
    </section>
  )
}
