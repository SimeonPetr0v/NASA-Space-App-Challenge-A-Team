import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Panel({ children, className, ...rest }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('panel', className)} {...rest}>
      {children}
    </section>
  )
}

export function PanelHeader({ title, id, meta, action }: { title: string; id?: string; meta?: ReactNode; action?: ReactNode }) {
  return (
    <header className="border-border flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2.5 sm:px-5">
      <h2 id={id} className="text-sm font-semibold tracking-tight">
        {title}
      </h2>
      {meta && <div className="text-muted-foreground text-xs">{meta}</div>}
      {action && <div className="ml-auto">{action}</div>}
    </header>
  )
}
