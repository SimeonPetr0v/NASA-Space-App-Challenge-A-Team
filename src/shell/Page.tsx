import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Centred content column used by every view */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1200px] px-4 pt-6 pb-12 sm:px-6 lg:px-8', className)}>{children}</div>
}
