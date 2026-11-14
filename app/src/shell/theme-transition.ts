import { flushSync } from 'react-dom'
import type { Theme } from '@/state/store'

/*
  Theme change with a left-to-right wipe (View Transitions API, CSS in
  index.css). Browsers without it, and people who prefer reduced motion,
  get an instant change.
*/
export function changeTheme(setTheme: (t: Theme) => void, next: Theme) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduce) {
    setTheme(next)
    return
  }
  doc.startViewTransition(() => {
    flushSync(() => setTheme(next))
    document.documentElement.dataset.theme = next
  })
}
