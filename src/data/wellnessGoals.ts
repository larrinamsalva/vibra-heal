export type WellnessGoal = {
  id: string
  name: string
  symbol: string
  eyebrow: string
  description: string
  guidance: string
  starterEntryId: string
  entryIds: string[]
  minutes: number
  breathing: boolean
}

export const WELLNESS_GOALS: WellnessGoal[] = [
  {
    id: 'wind-down',
    name: 'Wind down',
    symbol: '☾',
    eyebrow: 'Ease toward rest',
    description: 'Build a quieter transition out of a busy day with lower, steadier tones.',
    guidance: 'Lower the volume, soften the lighting, and let the timer create a clear stopping point for the day.',
    starterEntryId: 'ground',
    entryIds: ['deep-ground', 'earth-pulse', 'ground', 'restore', 'soft-tuning'],
    minutes: 20,
    breathing: true,
  },
  {
    id: 'steady-focus',
    name: 'Steady focus',
    symbol: '◎',
    eyebrow: 'Make space to concentrate',
    description: 'Choose clear musical reference tones and warm carriers for reading, planning, or creative work.',
    guidance: 'Keep the tone quiet enough to sit behind the task rather than becoming the task itself.',
    starterEntryId: 'steady-focus',
    entryIds: ['steady-focus', 'middle-c', 'warm-focus', 'concert-a', 'clear-octave', 'clarity'],
    minutes: 30,
    breathing: false,
  },
  {
    id: 'grounding-pause',
    name: 'Grounding pause',
    symbol: '◉',
    eyebrow: 'Return to the present',
    description: 'Use simple lower-range tones as a gentle anchor during a short mindful pause.',
    guidance: 'Notice your seat, your feet, and the room around you. The sound is only an attention anchor.',
    starterEntryId: 'deep-ground',
    entryIds: ['deep-ground', 'earth-pulse', 'ground', 'middle-c'],
    minutes: 10,
    breathing: true,
  },
  {
    id: 'creative-reset',
    name: 'Creative reset',
    symbol: '✦',
    eyebrow: 'Shift the atmosphere',
    description: 'Explore brighter tones for brainstorming, journaling, making art, or beginning again.',
    guidance: 'Use the first few minutes to breathe and listen, then move directly into the creative activity.',
    starterEntryId: 'reset',
    entryIds: ['warm-focus', 'reset', 'clear-octave', 'open', 'clarity', 'spacious'],
    minutes: 20,
    breathing: true,
  },
  {
    id: 'quiet-reflection',
    name: 'Quiet reflection',
    symbol: '◇',
    eyebrow: 'Listen inward',
    description: 'Pair contemplative tones with journaling, gratitude, or a slow review of the day.',
    guidance: 'Let the descriptions remain invitations, not promises. Keep what feels useful and leave the rest.',
    starterEntryId: 'release',
    entryIds: ['release', 'restore', 'soft-tuning', 'connect', 'inner-listening', 'stillness'],
    minutes: 20,
    breathing: false,
  },
  {
    id: 'connection-gratitude',
    name: 'Connection & gratitude',
    symbol: '∞',
    eyebrow: 'Practice appreciation',
    description: 'Create a gentle setting for compassion, gratitude, and relationship reflection.',
    guidance: 'Bring one person, place, animal, or moment to mind and name what you appreciate about it.',
    starterEntryId: 'connect',
    entryIds: ['middle-c', 'soft-tuning', 'open', 'connect', 'spacious'],
    minutes: 10,
    breathing: true,
  },
]
