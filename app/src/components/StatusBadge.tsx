import type { Status } from '@/engine/types'
import { cn } from '@/lib/utils'
import { STATUS_META } from './status-meta'

export function StatusGlyph({ status, className }: { status: Status; className?: string }) {
  const { shape, glyph } = STATUS_META[status]
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={cn('size-2.5 shrink-0', glyph, className)}>
      {shape === 'circle' && <circle cx="6" cy="6" r="3.6" fill="currentColor" />}
      {shape === 'triangle' && <path d="M6 1.2 11.2 10.6H.8z" fill="currentColor" />}
      {shape === 'diamond' && <path d="M6 .6 11.4 6 6 11.4.6 6z" fill="currentColor" />}
      {shape === 'ring' && <circle cx="6" cy="6" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.6" />}
    </svg>
  )
}

/** Inline status: glyph + uppercase word in the status ink colour. No pill. */
export function StatusBadge({ status, className, size = 'sm' }: { status: Status; className?: string; size?: 'sm' | 'lg' }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold tracking-[0.06em] uppercase',
        size === 'sm' ? 'gap-1.5 text-[0.6875rem]' : 'gap-2 text-sm',
        meta.ink,
        className,
      )}
    >
      <StatusGlyph status={status} className={size === 'lg' ? 'size-3.5' : undefined} />
      <span>{meta.word}</span>
    </span>
  )
}
