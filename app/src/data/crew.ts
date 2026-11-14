/*
  SYNTHETIC crew for the demo - not real people or real astronaut data.
  Three members so the flight surgeon view shows a whole crew; each one has
  their own demo history (src/data/demo-readings.ts) and their own saved
  readings on this device.
*/

export type CrewId = 'cm1' | 'cm2' | 'cm3'

export type CrewMember = {
  id: CrewId
  callsign: string
  role: string
  initials: string
}

export const CREW_ORDER: CrewId[] = ['cm1', 'cm2', 'cm3']

export const CREW: Record<CrewId, CrewMember> = {
  cm1: { id: 'cm1', callsign: 'CM-1', role: 'Commander · crew medical officer', initials: 'C1' },
  cm2: { id: 'cm2', callsign: 'CM-2', role: 'Flight engineer', initials: 'C2' },
  cm3: { id: 'cm3', callsign: 'CM-3', role: 'Mission specialist', initials: 'C3' },
}

export const DEFAULT_CREW: CrewId = 'cm2'

export const isCrewId = (v: unknown): v is CrewId => typeof v === 'string' && v in CREW

/* CM-2 keeps the original storage keys so readings saved before crew support stay visible */
export const storageKey = (base: string, id: CrewId) => (id === DEFAULT_CREW ? base : `${base}:${id}`)
