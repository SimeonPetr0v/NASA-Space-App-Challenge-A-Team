import { Users, BedDouble, BookOpen, ChartLine, ClipboardPlus, LayoutDashboard, Moon, RadioTower, Rocket, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { CrewSwitcher } from '@/components/CrewSwitcher'
import { FEATURES } from '@/config/features'
import { PlayDemoButton } from '@/features/demo/DemoPlayer'
import { CREW } from '@/data/crew'
import { DEMO_TODAY } from '@/data/demo-readings'
import { MISSION_DAY_TODAY, MISSION_ORDER, MISSIONS } from '@/data/missions'
import type { MissionMode } from '@/engine/types'
import { delayText, pad, utcTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { href, type Route } from '@/state/route'
import { useSimNow, useStore } from '@/state/store'

const NAV: { route: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { route: 'overview', label: 'Overview', icon: LayoutDashboard },
  { route: 'log', label: 'Log reading', icon: ClipboardPlus },
  { route: 'trends', label: 'Trends', icon: ChartLine },
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
}

/* Mission elapsed time: day 1 started at 00:00 UTC, MISSION_DAY_TODAY - 1 days before the demo morning check */
const LAUNCH = (() => {
  const d = new Date(DEMO_TODAY)
  d.setUTCHours(0, 0, 0, 0)
  return d.getTime() - (MISSION_DAY_TODAY - 1) * 86_400_000
})()

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
        <path d="M2 13h5l2-6 3.5 11 2.5-8 1.5 3H22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" />
      </svg>
      <span className="text-[0.9375rem] leading-none font-semibold tracking-tight whitespace-nowrap">Astro Health Monitor</span>
    </span>
  )
}

function SideNav({ route }: { route: Route }) {
  const { mode, delaySec, crewId } = useStore()
  const base = useNav()
  /* Crew board sits after Overview on desktop; on phones it is reached from the crew switcher */
  const nav = FEATURES.crewBoard ? [base[0], { route: 'crew' as Route, label: 'Crew board', icon: Users }, ...base.slice(1)] : base
  const m = MISSIONS[mode]
  return (
    <aside className="bg-chrome text-chrome-foreground sticky top-0 hidden h-svh w-60 shrink-0 flex-col lg:flex">
      <div className="border-chrome-line flex h-14 items-center border-b px-5">
        <Wordmark />
      </div>
      <nav aria-label="Main" className="flex flex-col gap-px p-3">
        {nav.map(({ route: r, label, icon: Icon }) => (
          <a
            key={r}
            href={href(r)}
            aria-current={route === r ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm transition-colors',
              route === r ? 'bg-chrome-2 text-chrome-foreground font-medium' : 'text-chrome-muted hover:bg-chrome-2/60 hover:text-chrome-foreground',
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
            {label}
            {route === r && <span aria-hidden="true" className="bg-chrome-foreground ml-auto h-4 w-px" />}
          </a>
        ))}
      </nav>
      <div className="border-chrome-line mt-auto border-t p-5 text-xs">
        <p className="label text-chrome-muted">Mission profile</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-chrome-muted">Phase</dt>
          <dd className="text-right">{m.name}</dd>
          <dt className="text-chrome-muted">Gravity</dt>
          <dd className="num text-right">{m.gravity}</dd>
          <dt className="text-chrome-muted">Signal delay</dt>
          <dd className="num text-right">{delayText(delaySec)} one way</dd>
          <dt className="text-chrome-muted">Crew member</dt>
          <dd className="text-right">{CREW[crewId].callsign} (synthetic)</dd>
          <dt className="text-chrome-muted">Role</dt>
          <dd className="text-right">{CREW[crewId].role}</dd>
        </dl>
        <p className="text-chrome-muted mt-5 leading-relaxed">Demo data. Supports self-assessment only; does not diagnose.</p>
      </div>
    </aside>
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
  const { theme, setTheme, clock } = useStore()
  const night = theme === 'night'
  const now = useSimNow(1000)
  const met = Math.max(0, now - LAUNCH)
  const d = Math.floor(met / 86_400_000)
  const h = (met % 86_400_000) / 3_600_000
  const m = (met % 3_600_000) / 60_000
  const s = (met % 60_000) / 1000
  return (
    <header className="bg-card/95 border-border sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <div className="min-w-0 flex-1 overflow-hidden">
          <span className="lg:hidden">
            <Wordmark className="[&>span:last-child]:hidden min-[400px]:[&>span:last-child]:inline" />
          </span>
          <p className="hidden text-sm lg:block">
            <span className="text-muted-foreground">Crew health</span>
            <span className="text-subtle-foreground px-2" aria-hidden="true">/</span>
            <span className="font-semibold">{TITLES[route]}</span>
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
        {FEATURES.playDemo && <PlayDemoButton className="hidden sm:flex" />}
        <CrewSwitcher />
        <MissionSwitcher />
        <button
          type="button"
          onClick={() => setTheme(night ? 'day' : 'night')}
          className="border-border-strong text-muted-foreground hover:text-foreground hover:bg-muted flex size-11 items-center justify-center rounded-sm border md:size-9"
          aria-label={night ? 'Night mode on. Switch to day mode' : 'Switch to sleep-shift night mode'}
          aria-pressed={night}
          title={night ? 'Day mode' : 'Sleep-shift night mode'}
        >
          {night ? <Sun className="size-4" strokeWidth={1.75} aria-hidden="true" /> : <Moon className="size-4" strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}

const SHORT: Record<string, string> = { 'Log reading': 'Log', Methodology: 'Method', 'Mission brief': 'Brief', 'Sleep shift': 'Sleep' }
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
    <div className="flex min-h-svh">
      <a href="#main" className="bg-primary text-primary-foreground sr-only z-50 px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <SideNav route={route} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar route={route} />
        <main id="main" className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNav route={route} />
    </div>
  )
}
