import { CircleCheck, CircleDashed, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { Status } from '@/engine/types'
import { cn } from '@/lib/utils'

export const STATUS_META: Record<Status, { Icon: LucideIcon; word: string; text: string; bg: string }> = {
  normal: { Icon: CircleCheck, word: 'Nominal', text: 'text-status-ok', bg: 'bg-status-ok-bg' },
  caution: { Icon: TriangleAlert, word: 'Caution', text: 'text-status-caution', bg: 'bg-status-caution-bg' },
  danger: { Icon: OctagonAlert, word: 'Act now', text: 'text-status-danger', bg: 'bg-status-danger-bg' },
  'no-data': { Icon: CircleDashed, word: 'Measure', text: 'text-status-none', bg: 'bg-muted' },
  stale: { Icon: CircleDashed, word: 'Re-measure', text: 'text-status-none', bg: 'bg-muted' },
}

type Props = { status: Status; className?: string; size?: 'sm' | 'md' | 'lg' }

const ICON_SIZE = { sm: 14, md: 16, lg: 22 }

export function StatusBadge({ status, className, size = 'md' }: Props) {
  const { Icon, word, text } = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-medium whitespace-nowrap', text, className)}>
      <Icon size={ICON_SIZE[size]} strokeWidth={2.25} aria-hidden="true" />
      <span>{word}</span>
    </span>
  )
}
