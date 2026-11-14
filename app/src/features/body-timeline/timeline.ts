/* Body-over-time effects; rates from NASA HRP (see BodyTimeline.tsx) */
export const TIMELINE_MAX_DAY = 180

export function effectsAt(day: number) {
  const months = day / 30
  return {
    boneLossPct: { low: months * 1, high: months * 1.5 },
    fluidL: Math.min(2, day * 0.7),
    /** 0..1 visual strength for the 3D body */
    bone: Math.min(1, day / TIMELINE_MAX_DAY),
    eyes: Math.min(1, Math.max(0, (day - 14) / (TIMELINE_MAX_DAY - 14))),
  }
}
