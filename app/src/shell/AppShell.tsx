import { Sparkles, BedDouble, BookOpen, ChartLine, ClipboardPlus, LayoutDashboard, RadioTower, Rocket } from 'lucide-react'
import type { ReactNode } from 'react'
import { CrewSwitcher } from '@/components/CrewSwitcher'
import { FEATURES } from '@/config/features'
import { PlayDemoButton } from '@/features/demo/DemoPlayer'
import { MISSION_ORDER, MISSIONS } from '@/data/missions'
import type { MissionMode } from '@/engine/types'
import { pad, utcTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { href, type Route } from '@/state/route'
import { met } from '@/lib/mission-clock'
import { useSimNow, useStore } from '@/state/store'
import { MissionRail } from './MissionRail'
import { Backdrop } from './Backdrop'
import { ThemeSwitch } from './ThemeSwitch'

const NAV: { route: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { route: 'overview', label: 'Overview', icon: LayoutDashboard },
  { route: 'log', label: 'Log reading', icon: ClipboardPlus },
  { route: 'trends', label: 'Trends', icon: ChartLine },
  ...(FEATURES.tot ? [{ route: 'tot' as Route, label: 'Ask TOT', icon: Sparkles }] : []),
  { route: 'link', label: 'Earth link', icon: RadioTower },
  { route: 'method', label: 'Methodology', icon: BookOpen },
  { route: 'brief', label: 'Mission brief', icon: Rocket },
]

/* At night the Sleep shift page (night quick actions) joins the menu, right after Overview */
const NIGHT_NAV = [NAV[0], { route: 'sleep' as Route, label: 'Sleep shift', icon: BedDouble }, ...NAV.slice(1)]
const useNav = () => (useStore().theme === 'night' ? NIGHT_NAV : NAV)

const TITLES: Record<Route, string> = {
  overview: 'Overview',
  log: 'Log reading',
  trends: 'Trends',
  link: 'Earth link',
  method: 'Methodology',
  brief: 'Mission brief',
  sleep: 'Sleep shift',
  crew: 'Crew board',
  tot: 'TOT assistant',
}


export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
        <path d="M2 13h5l2-6 3.5 11 2.5-8 1.5 3H22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" />
      </svg>
      <span className="font-display text-base leading-none font-semibold tracking-[0.06em] whitespace-nowrap uppercase">Khonsu</span>
    </span>
  )
}

function MissionSwitcher() {
  const { mode, setMode } = useStore()
  return (
    <>
      <div role="radiogroup" aria-label="Mission mode" className="border-border-strong hidden h-9 items-stretch rounded-sm border lg:flex">
        {MISSION_ORDER.map((id, i) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              'px-3 text-xs font-medium whitespace-nowrap transition-colors',
              i > 0 && 'border-border-strong border-l',
              mode === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {MISSIONS[id].short}
          </button>
        ))}
      </div>
      <label className="lg:hidden">
        <span className="sr-only">Mission mode</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as MissionMode)}
          className="border-border-strong bg-card h-11 rounded-sm border px-2 text-sm md:h-9"
        >
          {MISSION_ORDER.map((id) => (
            <option key={id} value={id}>
              {MISSIONS[id].short}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}

function TopBar({ route }: { route: Route }) {
  const { clock } = useStore()
  const now = useSimNow(1000)
  const { d, h, m, s } = met(now)
  return (
    <header className="bg-card/95 border-border relative z-30 border-b backdrop-blur sm:sticky sm:top-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:h-14 sm:flex-nowrap sm:px-6 sm:py-0">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="flex min-w-0 items-center gap-3">
            <a href={href('overview')} className="shrink-0 rounded-sm" aria-label="Khonsu, go to Overview">
              <Wordmark />
            </a>
            <span className="text-subtle-foreground hidden lg:inline" aria-hidden="true">/</span>
            <span className="hidden truncate text-sm font-medium lg:inline">{TITLES[route]}</span>
          </p>
        </div>
        <dl className="text-muted-foreground hidden items-center gap-5 text-xs xl:flex">
          <div className="flex items-baseline gap-2">
            <dt className="label">MET</dt>
            <dd className="num text-foreground font-medium">
              {d}d {pad(h)}:{pad(m)}:{pad(s)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="label">UTC</dt>
            <dd className="num text-foreground font-medium">{utcTime(now)}</dd>
          </div>
          {clock.speed > 1 && (
            <div className="text-status-caution-ink font-semibold">
              <dt className="sr-only">Clock</dt>
              <dd>Time ×{clock.speed}, simulated</dd>
            </div>
          )}
        </dl>
        {FEATURES.playDemo && <PlayDemoButton className="h-11 md:h-9" />}
        <div className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto sm:gap-3 [&>label]:min-w-0 [&>label]:flex-1 sm:[&>label]:flex-none [&_select]:w-full sm:[&_select]:w-auto">
          <CrewSwitcher />
          <MissionSwitcher />
        </div>
        <ThemeSwitch />
      </div>
    </header>
  )
}

const SHORT: Record<string, string> = { 'Ask TOT': 'TOT', 'Log reading': 'Log', Methodology: 'Method', 'Mission brief': 'Brief', 'Sleep shift': 'Sleep' }
const TIGHT: Record<string, string> = { Overview: 'Home', 'Earth link': 'Link' }
const shortLabel = (label: string, tight: boolean) => (tight && TIGHT[label]) || SHORT[label] || label

function MobileNav({ route }: { route: Route }) {
  const nav = useNav()
  return (
    <nav aria-label="Main" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }} className="bg-card border-border fixed inset-x-0 bottom-0 z-30 grid border-t pb-[env(safe-area-inset-bottom)] lg:hidden">
      {nav.map(({ route: r, label, icon: Icon }) => (
        <a
          key={r}
          href={href(r)}
          aria-current={route === r ? 'page' : undefined}
          className={cn(
            'relative flex min-h-14 flex-col items-center justify-center gap-1 text-[0.6875rem]',
            route === r ? 'text-foreground font-semibold' : 'text-muted-foreground',
          )}
        >
          {route === r && <span aria-hidden="true" className="bg-foreground absolute inset-x-4 top-0 h-0.5" />}
          <Icon className="size-[1.125rem]" strokeWidth={1.75} aria-hidden="true" />
          <span className="max-w-full truncate px-1">{shortLabel(label, nav.length > 6)}</span>
        </a>
      ))}
    </nav>
  )
}

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh">
      <Backdrop />
      <a href="#main" className="bg-primary text-primary-foreground sr-only z-50 px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar route={route} />
        <main id="main" className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MissionRail />
      <MobileNav route={route} />
    </div>
  )
}
