import { Feather, Moon } from 'lucide-react'
import { motion } from 'motion/react'
import { staggerChild, staggerParent } from '@/components/motion-config'

/* Where the names come from: two ancient Egyptian moon gods */

const NAMES = [
  {
    name: 'Khonsu',
    role: 'The app',
    icon: Moon,
    god: 'Ancient Egyptian god of the Moon. His name means “traveller”, after the Moon’s nightly journey across the sky. With Thoth he marked the passage of time, and he was called the Healer and was thought to watch over those who travel at night.',
    why: 'A health monitor for a crew on a long night voyage, counting mission days and watching over them on the way.',
    source: 'https://en.wikipedia.org/wiki/Khonsu',
  },
  {
    name: 'TOT',
    role: 'The AI assistant',
    icon: Feather,
    god: 'Tot is Thoth (Djehuti in Egyptian), god of the Moon, wisdom, knowledge, writing and science, often shown with the head of an ibis.',
    why: 'An assistant that reads the crew’s records and explains them in plain words, without guessing beyond what was measured.',
    source: 'https://en.wikipedia.org/wiki/Thoth',
  },
]

export function NameOrigins() {
  return (
    <section aria-labelledby="names-title" className="grid gap-8">
      <div className="max-w-2xl">
        <p className="label text-primary">About the names</p>
        <h2 id="names-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Two moon gods keep watch.
        </h2>
        <p className="text-muted-foreground mt-3 text-base">Both names come from ancient Egypt, where the Moon kept time and watched over night travellers.</p>
      </div>
      <motion.ul variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        {NAMES.map(({ name, role, icon: Icon, god, why, source }) => (
          <motion.li key={name} variants={staggerChild} className="panel grid content-start gap-3 p-6">
            <div className="flex items-center gap-3">
              <span className="border-border-strong text-teal flex size-11 items-center justify-center rounded-full border">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-xl font-semibold">{name}</h3>
                <p className="label text-muted-foreground">{role}</p>
              </div>
            </div>
            <p className="text-sm">{god}</p>
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">Why this name: </span>
              {why}
            </p>
            <a href={source} target="_blank" rel="noreferrer" className="text-muted-foreground text-xs underline underline-offset-4">
              Source: Wikipedia, {name === 'TOT' ? 'Thoth' : 'Khonsu'}
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}
