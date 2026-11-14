/*
  Feature switches. Each optional feature lives in its own folder under
  src/features/ and only shows when its switch is true here. To remove one
  for good, set it to false (or delete the folder and its imports).
*/
export const FEATURES = {
  /** "Play demo" button that runs the whole story by itself (src/features/demo) */
  playDemo: true,
  /** Slow-change warnings, e.g. sleep falling 4 nights in a row (src/features/trends) */
  trendWarnings: true,
  /** Mission radiation dose against the 600 mSv career limit + solar event drill (src/features/radiation) */
  radiation: true,
  /** NASA's five questions and the science sign-off table on the Methodology page (src/features/why) */
  whyItMatters: true,
  /** "Morning check due in 20 min" and the measuring streak (src/features/schedule) */
  scheduleReminders: true,
  /** Crew medical officer board with every crew member (src/features/crew-board) */
  crewBoard: true,
  /** Mission day slider that shows bone loss and fluid shift on the 3D body (src/features/body-timeline) */
  bodyTimeline: true,
  /** Heart rate estimate from the phone camera, PPG (src/features/camera-pulse) */
  cameraPulse: true,
  /** Sun at the right edge that opens the pages as orbiting planets (src/features/solar-nav) */
  solarNav: true,
  /** TOT, the on-device AI assistant (WebLLM, no cloud) (src/features/tot) */
  tot: true,
} as const
