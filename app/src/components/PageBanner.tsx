import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE_OUT } from '@/components/motion-config'

/*
  Compact deep-space header used at the top of inner views.
  Motion: the title rises word by word out of a mask once per view (orientation
  on arrival); stars, the ECG trace and a slow nebula drift run in CSS and stop
  under reduced motion.
*/
export function PageBanner({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  const words = title.split(' ')
  return (
    <section className="bg-space relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="nebula absolute -top-1/2 right-[-10%] h-[200%] w-[60%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--space-3)_55%,transparent),transparent)] opacity-60" />
        <div
          className="nebula absolute -bottom-1/2 left-[-15%] h-[180%] w-[50%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--space-2)_60%,transparent),transparent)] opacity-50"
          style={{ animationDelay: '-11s' }}
        />
      </div>
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
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl" aria-label={title}>
            {words.map((w, i) => (
              <span key={`${w}-${i}`} aria-hidden="true" className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: '105%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.75, ease: EASE_OUT, delay: 0.08 + i * 0.07 }}
                >
                  {w}
                  {i < words.length - 1 ? ' ' : ''}
                </motion.span>
              </span>
            ))}
          </h1>
        </div>
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.25 }}
            className="text-space-muted max-w-md text-sm"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  )
}
