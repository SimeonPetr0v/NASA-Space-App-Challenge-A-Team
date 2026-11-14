import { ArrowLeftRight, Moon, Sun } from 'lucide-react'
import { STATUS_META } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import type { Mission } from '@/data/mission'
import type { Status } from '@/engine/types'
import { cn } from '@/lib/utils'
import type { InstrumentRow } from './model'

type Props = {
  overall: Status
  attentionCount: number
  top?: InstrumentRow
  mission: Mission
  night: boolean
  onToggleNight: () => void
  onOpen: (row: InstrumentRow) => void
}

const SUMMARY: Record<Status, string> = {
  normal: 'All readings within your limits',
  caution: 'attention',
  danger: 'action',
  'no-data': 'No readings yet today',
  stale: 'Readings are out of date',
}

export function StatusStrip({ overall, attentionCount, top, mission, night, onToggleNight, onOpen }: Props) {
  const { Icon, word, text, bg } = STATUS_META[overall]
  const summary =
    attentionCount > 0
      ? `${attentionCount} ${attentionCount === 1 ? 'reading needs' : 'readings need'} ${SUMMARY[overall]}`
      : SUMMARY[overall]

  return (
    <header className="bg-card border-b">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
        <div className={cn('flex items-center gap-2', text)} role="status" aria-live="polite">
          <Icon size={22} strokeWidth={2.25} aria-hidden="true" />
          <span className="text-lg font-semibold">{word}</span>
          <span className="text-muted-foreground text-sm font-normal">· {summary}</span>
        </div>

        {top?.guidance && (
          <button
            type="button"
            onClick={() => onOpen(top)}
            className={cn('min-h-9 rounded-md px-3 py-1.5 text-left text-sm transition-colors duration-150 hover:brightness-95', bg, STATUS_META[top.assessment.status].text)}
          >
            <span className="font-semibold">Do now:</span> {top.guidance.doNow[0].toLowerCase()} · re-check in {top.guidance.recheckIn}
          </button>
        )}

        <div className="text-muted-foreground ml-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="tabular whitespace-nowrap">
            Day {mission.day} · {mission.modeLabel}
          </span>
          <span className="flex items-center gap-1.5 tabular whitespace-nowrap" title="One-way signal delay to Mission Control">
            <ArrowLeftRight size={15} aria-hidden="true" />
            Earth link {mission.oneWayDelayMinutes} min
          </span>
          <Button variant="outline" size="sm" onClick={onToggleNight} aria-pressed={night} className="min-h-9">
            {night ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
            {night ? 'Day mode' : 'Night mode'}
          </Button>
        </div>
      </div>
    </header>
  )
}
