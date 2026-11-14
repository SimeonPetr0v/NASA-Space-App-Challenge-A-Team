import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/* App buttons: square-ish corners, 44 px hit target, text says exactly what happens. */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'border border-border-strong bg-card text-foreground hover:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger: 'bg-status-danger text-primary-foreground hover:bg-status-danger/90',
}

function actionClass(variant: Variant = 'secondary', className?: string) {
  return cn(base, variants[variant], className)
}

export function Action({ variant = 'secondary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={actionClass(variant, className)} {...props} />
}

export function ActionLink({ variant = 'secondary', className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return <a className={actionClass(variant, className)} {...props} />
}
