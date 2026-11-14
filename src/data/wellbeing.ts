/** WHO-5 item/response text © WHO 2024, CC BY-NC-SA 3.0 IGO. */
export const WHO5_SOURCE = 'https://www.who.int/publications/m/item/who-ucn-msd-mhe-2024.01'

export const WHO5_ITEMS = [
  'I have felt cheerful and in good spirits',
  'I have felt calm and relaxed',
  'I have felt active and vigorous',
  'I woke up feeling fresh and rested',
  'My daily life has been filled with things that interest me',
] as const

export const WHO5_OPTIONS = [
  'At no time',
  'Some of the time',
  'Less than half of the time',
  'More than half of the time',
  'Most of the time',
  'All of the time',
] as const

export const WHO5_FOLLOWUP =
  'Consider a private check-in with your crew medical officer or behavioral health support. This is a screening result, not a diagnosis.'

export const WHO5_FOLLOWUP_RAW_CUTOFF = 13
