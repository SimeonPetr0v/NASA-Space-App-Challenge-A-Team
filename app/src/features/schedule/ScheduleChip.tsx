import { Bell, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { href } from '@/state/route'
import { useSimNow, useStore } from '@/state/store'
import { inWords, nextCheck, streakDays } from './schedule'

/* Next check from the mission schedule and the measuring streak (features.scheduleReminders) */
export function ScheduleChip({ className }: { className?: string }) {
  const { history } = useStore()
  const now = useSimNow(30_000)
  const due = nextCheck(now, history)
  const streak = streakDays(now, history)
  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-sm', className)}>
      <a
        href={href('log')}
        title={`${due.label}: ${due.what}`}
        className={cn(
          'flex min-h-9 items-center gap-2 rounded-sm border px-3 transition-colors',
          due.state === 'overdue'
            ? 'border-status-caution bg-status-caution-soft text-status-caution-ink font-semibold'
            : due.state === 'soon'
              ? 'border-primary text-foreground font-medium'
              : 'border-border-strong text-muted-foreground hover:text-foreground',
        )}
      >
        <Bell className={cn('size-4', due.state === 'soon' && 'text-primary')} strokeWidth={1.75} aria-hidden="true" />
        {due.state === 'overdue' ? (
          <span>
            {due.label} overdue · <span className="num">{inWords(due.inMin)}</span>
          </span>
        ) : (
          <span>
            {due.label} due in <span className="num">{inWords(due.inMin)}</span>
          </span>
        )}
      </a>
      {streak > 1 && (
        <span className="border-border-strong text-muted-foreground flex min-h-9 items-center gap-1.5 rounded-sm border px-3" title="Days in a row with at least one measurement">
          <Flame className="text-status-caution size-4" strokeWidth={1.75} aria-hidden="true" />
          <span className="num text-foreground font-semibold">{streak}</span> day streak
        </span>
      )}
    </div>
  )
}
