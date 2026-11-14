import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { lazy, Suspense, useEffect } from 'react'
import { TransmitOverlay } from '@/components/TransmitOverlay'
import { AppShell } from '@/shell/AppShell'
import { useRoute } from '@/state/route'
import { StoreProvider, useStore } from '@/state/store'
import { EarthLink } from '@/views/EarthLink'
import { LogReading } from '@/views/LogReading'
import { Brief } from '@/views/Brief'
import { Methodology } from '@/views/Methodology'
import { NightView } from '@/views/NightView'
import { FEATURES } from '@/config/features'
import { CrewBoard } from '@/features/crew-board/CrewBoard'
import { DemoPlayer } from '@/features/demo/DemoPlayer'
import { SolarNav } from '@/features/solar-nav/SolarNav'
import { Overview } from '@/views/Overview'
import { Trends } from '@/views/Trends'

const TotPage = lazy(() => import('@/features/tot/TotPage').then((m) => ({ default: m.TotPage })))

function Screens() {
  const { route, param } = useRoute()
  const { theme } = useStore()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'night' ? '#1a120d' : '#ffffff')
  }, [theme])

  return (
    <>
      <AppShell route={route}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={route}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                  {route === 'overview' && <Overview />}
                  {route === 'log' && <LogReading />}
                  {route === 'trends' && <Trends param={param} />}
                  {route === 'link' && <EarthLink />}
                  {route === 'method' && <Methodology />}
                  {route === 'brief' && <Brief />}
                  {route === 'sleep' && <NightView />}
                  {route === 'crew' && (FEATURES.crewBoard ? <CrewBoard /> : <Overview />)}
                  {route === 'tot' && (FEATURES.tot ? (
                    <Suspense fallback={<p className="text-muted-foreground p-8 text-sm">Loading TOT…</p>}>
                      <TotPage />
                    </Suspense>
                  ) : (
                    <Overview />
                  ))}
                </motion.div>
              </AnimatePresence>
      </AppShell>
      <TransmitOverlay />
      {FEATURES.playDemo && <DemoPlayer />}
      {FEATURES.solarNav && <SolarNav route={route} />}
    </>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <Screens />
      </StoreProvider>
    </MotionConfig>
  )
}
