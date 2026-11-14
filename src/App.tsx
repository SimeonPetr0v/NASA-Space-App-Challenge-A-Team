import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect } from 'react'
import { TransmitOverlay } from '@/components/TransmitOverlay'
import { AppShell } from '@/shell/AppShell'
import { useRoute } from '@/state/route'
import { StoreProvider, useStore } from '@/state/store'
import { EarthLink } from '@/views/EarthLink'
import { LogReading } from '@/views/LogReading'
import { Methodology } from '@/views/Methodology'
import { NightView } from '@/views/NightView'
import { Overview } from '@/views/Overview'
import { Trends } from '@/views/Trends'

function Screens() {
  const { route, param } = useRoute()
  const { theme } = useStore()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'night' ? '#1a120d' : '#ffffff')
  }, [theme])

  return (
    <>
      <AnimatePresence mode="wait">
        {theme === 'night' ? (
          <motion.div key="night" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <NightView />
          </motion.div>
        ) : (
          <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
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
                </motion.div>
              </AnimatePresence>
            </AppShell>
          </motion.div>
        )}
      </AnimatePresence>
      <TransmitOverlay />
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
