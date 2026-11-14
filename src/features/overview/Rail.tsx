import { CalendarClock, ChartLine, Earth, LayoutDashboard, SquarePlus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type View = 'overview' | 'log' | 'trends' | 'earth' | 'schedule'

export const VIEWS: { id: View; label: string; Icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'log', label: 'Log reading', Icon: SquarePlus },
  { id: 'trends', label: 'Trends', Icon: ChartLine },
  { id: 'earth', label: 'Earth link', Icon: Earth },
  { id: 'schedule', label: 'Schedule', Icon: CalendarClock },
]

type Props = { view: View; onChange: (view: View) => void }

export function Rail({ view, onChange }: Props) {
  return (
    <nav
      aria-label="Main"
      className="bg-card fixed inset-x-0 bottom-0 z-30 border-t md:static md:border-t-0 md:bg-transparent"
    >
      <ul className="flex justify-around md:flex-col md:justify-start md:gap-1 md:p-3">
        {VIEWS.map(({ id, label, Icon }) => {
          const active = view === id
          return (
            <li key={id} className="flex-1 md:flex-none">
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors duration-150 md:min-h-11 md:flex-row md:justify-start md:gap-2.5 md:px-3 md:text-sm',
                  active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="md:sr-only lg:not-sr-only">{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
