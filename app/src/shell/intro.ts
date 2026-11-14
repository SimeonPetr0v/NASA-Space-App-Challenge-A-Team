/*
  First-load entrance: the brand, the page headline, its intro text and
  buttons, then the first cards rise into place one after another with a
  slight fade and blur. Runs once per page load (never on hover, theme
  change or page change). With reduced motion it is a short plain fade.
*/

let played = false

export function playIntro() {
  if (played) return
  played = true
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  requestAnimationFrame(() => {
    const seen = new Set<Element>()
    const list: Element[] = []
    const take = (sel: string, max = 99) => {
      let n = 0
      for (const el of document.querySelectorAll(sel)) {
        if (n >= max || seen.has(el) || [...seen].some((s) => s.contains(el))) continue
        if (el.getBoundingClientRect().top > window.innerHeight) continue
        seen.add(el)
        list.push(el)
        n++
      }
    }
    take('header a[aria-label^="Khonsu"]', 1)
    take('main h1', 1)
    take('main section:first-of-type p', 2)
    take('main section:first-of-type a, main section:first-of-type button', 3)
    take('main .panel, main h2', 6)
    list.forEach((el, i) => {
      el.animate(
        reduce
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: 'translateY(14px)', filter: 'blur(6px)' },
              { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
            ],
        {
          duration: reduce ? 180 : 720,
          delay: reduce ? 0 : 80 + i * 85,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          fill: 'backwards',
        },
      )
    })
  })
}
