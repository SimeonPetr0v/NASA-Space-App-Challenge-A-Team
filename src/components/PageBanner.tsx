import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE_OUT } from '@/components/motion-config'

/** Compact deep-space header used at the top of inner views */
export function PageBanner({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="bg-space relative isolate overflow-hidden">
      <svg aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full">
        {Array.from({ length: 40 }, (_, i) => (
          <circle
            key={i}
            cx={`${(i * 37.7) % 100}%`}
            cy={`${(i * 53.3) % 100}%`}
            r={i % 6 === 0 ? 1.3 : 0.7}
            fill="currentColor"
            className={i % 3 === 0 ? 'twinkle' : 'opacity-40'}
            style={{ ['--td' as string]: `${(i % 5) * 0.7}s` }}
          />
        ))}
      </svg>
      <svg aria-hidden="true" viewBox="0 0 1200 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-12 w-full opacity-50">
        <path d="M0 40 H520 L540 40 L552 16 L566 54 L580 6 L594 48 L606 40 H1200" fill="none" stroke="var(--signal)" strokeWidth="1.5" pathLength={1} className="ecg" />
      </svg>
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-end justify-between gap-4 px-4 pt-10 pb-12 sm:px-6 lg:px-8">
        <div>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }} className="label text-space-muted">
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.08 }}
            className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {title}
          </motion.h1>
        </div>
        {children && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-space-muted max-w-md text-sm">
            {children}
          </motion.div>
        )}
      </div>
    </section>
  )
}
