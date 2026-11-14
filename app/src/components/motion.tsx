import { animate, motion, useInView, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { EASE_OUT } from './motion-config'
import { Children, useEffect, useRef, useState, type ReactNode } from 'react'

/*
  Shared motion primitives (motion/react). Everything respects
  prefers-reduced-motion through <MotionConfig reducedMotion="user"> in App.
*/


/** Fades and lifts its content into place the first time it scrolls into view */
export function Reveal({ delay = 0, y = 24, ...props }: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
      {...props}
    />
  )
}

/** Number that counts up once when it scrolls into view */
export function CountUp({ value, decimals = 0, duration = 1.4, className }: { value: number; decimals?: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, value, { duration, ease: EASE_OUT, onUpdate: setShown })
    return () => controls.stop()
  }, [inView, value, duration, reduce])
  return (
    <span ref={ref} className={className}>
      {(reduce ? value : shown).toFixed(decimals)}
    </span>
  )
}

/** Grid whose direct children each fade up as they scroll into view */
export function RevealGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {Children.toArray(children).map((child, i) => (
        <Reveal key={i} delay={Math.min(i, 3) * 0.06} className="min-w-0">
          {child}
        </Reveal>
      ))}
    </div>
  )
}
