/*
  Page background: a quiet star field, an orbital chart centred on the sun
  of the page menu (right edge, middle), lunar surface contours in the upper
  left and a planetary contour globe in the lower left. Inline vector art in theme tokens, kept low-contrast so it
  never competes with the content. Static: no motion to reduce.
*/

const STARS = Array.from({ length: 70 }, (_, i) => {
  const x = (i * 137.508) % 600
  const y = (i * 89.443 + (i % 7) * 31) % 600
  const r = i % 11 === 0 ? 1.3 : i % 4 === 0 ? 0.9 : 0.6
  return { x: +x.toFixed(1), y: +y.toFixed(1), r, o: i % 5 === 0 ? 1 : 0.55 }
})

const ORBITS = [230, 330, 450, 590, 760, 960]

/* Lunar surface: crater rims as pairs of rings (x, y, r) and a terminator curve */
const CRATERS: [number, number, number][] = [
  [120, 140, 62],
  [300, 90, 28],
  [250, 260, 40],
  [430, 200, 18],
  [60, 330, 24],
  [380, 330, 12],
  [180, 40, 14],
]

export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="kh-stars" width="600" height="600" patternUnits="userSpaceOnUse">
            {STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--star)" opacity={s.o} />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#kh-stars)" />
      </svg>

      <svg viewBox="-1000 -1000 2000 2000" className="absolute top-1/2 right-0 h-[2000px] w-[2000px] translate-x-1/2 -translate-y-1/2">
        {ORBITS.map((r, i) => (
          <circle key={r} r={r} fill="none" stroke="var(--orbit-line)" strokeWidth={1} strokeDasharray={i % 2 ? '2 6' : undefined} />
        ))}
        {ORBITS.slice(1).map((r, i) => {
          const a = ((168 + i * 9) * Math.PI) / 180
          return <circle key={`p${r}`} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={i % 2 ? 2.5 : 3.5} fill="var(--orbit-tick)" />
        })}
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i * 10 * Math.PI) / 180
          const r0 = 960
          const r1 = i % 3 === 0 ? 990 : 975
          return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke="var(--orbit-tick)" strokeWidth={1} />
        })}
      </svg>

      <svg viewBox="0 0 520 420" className="absolute -top-10 -left-16 h-[420px] w-[520px] opacity-80">
        <path d="M-20 380 C 140 300, 300 330, 540 210" fill="none" stroke="var(--orbit-line)" />
        <path d="M-20 400 C 150 330, 320 360, 540 250" fill="none" stroke="var(--orbit-line)" strokeDasharray="1 7" />
        {CRATERS.map(([x, y, r]) => (
          <g key={`${x}-${y}`} fill="none">
            <circle cx={x} cy={y} r={r} stroke="var(--orbit-line)" />
            <circle cx={x + r * 0.12} cy={y + r * 0.1} r={r * 0.78} stroke="var(--orbit-line)" strokeDasharray="2 4" />
          </g>
        ))}
      </svg>

      <svg viewBox="-400 -400 800 800" className="absolute -bottom-[340px] -left-[300px] h-[760px] w-[760px]">
        <circle r={380} fill="none" stroke="var(--orbit-line)" />
        {[-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((t) => (
          <ellipse key={`lat${t}`} cy={t * 380} rx={380 * Math.sqrt(1 - t * t)} ry={380 * Math.sqrt(1 - t * t) * 0.14} fill="none" stroke="var(--orbit-line)" />
        ))}
        {[0.2, 0.45, 0.7, 0.92].map((k) => (
          <ellipse key={`lon${k}`} rx={380 * k} ry={380} fill="none" stroke="var(--orbit-line)" />
        ))}
        <circle r={392} fill="none" stroke="var(--orbit-tick)" strokeDasharray="1 9" />
      </svg>
    </div>
  )
}
