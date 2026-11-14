import type { Variants } from 'motion/react'

/** Shared easing and stagger variants for motion/react */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
}
