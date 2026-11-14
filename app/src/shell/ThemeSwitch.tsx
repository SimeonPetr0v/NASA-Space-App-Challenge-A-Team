import { BedDouble, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore, type Theme } from '@/state/store'
import { changeTheme } from './theme-transition'

const OPTIONS: { id: Theme; label: string; hint: string; icon: typeof Sun }[] = [
  { id: 'day', label: 'Light', hint: 'Light theme', icon: Sun },
  { id: 'dark', label: 'Dark', hint: 'Dark theme', icon: Moon },
  { id: 'night', label: 'Sleep', hint: 'Sleep-shift mode: warm, low-blue colours', icon: BedDouble },
]

/* Light / Dark / Sleep selector; the active option is filled */
export function ThemeSwitch() {
  const { theme, setTheme } = useStore()
  return (
    <div role="radiogroup" aria-label="Colour theme" className="border-border-strong bg-card flex h-11 shrink-0 items-stretch rounded-full border p-1 md:h-9">
      {OPTIONS.map(({ id, label, hint, icon: Icon }) => {
        const on = theme === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={hint}
            title={hint}
            onClick={() => changeTheme(setTheme, id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors',
              on ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
            <span className={cn(!on && 'hidden xl:inline')}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
