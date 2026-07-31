export type FrequencyCategory =
  | 'Audio feature'
  | 'Wellness practice'
  | 'Traditional association'

export type FrequencyEntry = {
  id: string
  name: string
  hz: number
  category: FrequencyCategory
  description: string
  intention: string
  tags: string[]
}

export const FREQUENCY_CATEGORIES: Array<'All' | FrequencyCategory> = [
  'All',
  'Audio feature',
  'Wellness practice',
  'Traditional association',
]

export const FREQUENCY_LIBRARY: FrequencyEntry[] = [
  {
    id: 'deep-ground',
    name: 'Deep Ground',
    hz: 100,
    category: 'Audio feature',
    description: 'A low, steady carrier tone with a soft physical presence at comfortable listening levels.',
    intention: 'Settle into the beginning of a quiet session.',
    tags: ['low tone', 'steady', 'settling'],
  },
  {
    id: 'earth-pulse',
    name: 'Earth Pulse',
    hz: 136.1,
    category: 'Traditional association',
    description: 'A tone used in some modern meditation and sound-practice traditions. The association is cultural, not a medical claim.',
    intention: 'Pair with slow breathing or reflective practice.',
    tags: ['meditation', 'tradition', 'breath'],
  },
  {
    id: 'ground',
    name: 'Ground',
    hz: 174,
    category: 'Wellness practice',
    description: 'A low, steady tone for settling into a calm listening session.',
    intention: 'Create a gentle transition from activity to rest.',
    tags: ['grounding', 'calm', 'low tone'],
  },
  {
    id: 'steady-focus',
    name: 'Steady Focus',
    hz: 220,
    category: 'Audio feature',
    description: 'A clear A3 carrier tone that can sit quietly beneath reading, journaling, or creative work.',
    intention: 'Support a simple, distraction-light sound environment.',
    tags: ['focus', 'A3', 'creative work'],
  },
  {
    id: 'middle-c',
    name: 'Middle C',
    hz: 261.6,
    category: 'Audio feature',
    description: 'The familiar middle-C pitch, offered as a neutral musical reference tone.',
    intention: 'Use as a balanced starting point for custom sessions.',
    tags: ['music', 'middle C', 'balanced'],
  },
  {
    id: 'release',
    name: 'Release',
    hz: 285,
    category: 'Traditional association',
    description: 'A frequency commonly listed in modern sound-wellness collections. VibraHeal presents it as a reflective listening option only.',
    intention: 'Pair with journaling, rest, or a slow body scan.',
    tags: ['reflection', 'tradition', 'body scan'],
  },
  {
    id: 'warm-focus',
    name: 'Warm Focus',
    hz: 320,
    category: 'Wellness practice',
    description: 'A warm mid-range carrier selected for calm attention and gentle creative sessions.',
    intention: 'Build a steady background for thoughtful work.',
    tags: ['focus', 'warm', 'attention'],
  },
  {
    id: 'restore',
    name: 'Restore',
    hz: 396,
    category: 'Traditional association',
    description: 'A tone associated in contemporary spiritual sound practices with release and renewal; these meanings are traditional, not clinical.',
    intention: 'Use with reflection, gratitude, or an evening wind-down.',
    tags: ['renewal', 'tradition', 'evening'],
  },
  {
    id: 'reset',
    name: 'Reset',
    hz: 417,
    category: 'Traditional association',
    description: 'A modern frequency-practice tone often linked with change and fresh starts. No treatment effect is claimed.',
    intention: 'Mark the beginning of a new habit or mindful pause.',
    tags: ['fresh start', 'tradition', 'pause'],
  },
  {
    id: 'concert-a',
    name: 'Concert A',
    hz: 440,
    category: 'Audio feature',
    description: 'The standard A4 tuning reference used by many musicians and instruments.',
    intention: 'Choose a familiar musical anchor for a custom session.',
    tags: ['music', 'A4', 'tuning'],
  },
  {
    id: 'soft-tuning',
    name: 'Soft Tuning',
    hz: 432,
    category: 'Traditional association',
    description: 'An alternate tuning reference favored by some listeners for its subjective character. Preference is personal and not evidence of healing effects.',
    intention: 'Explore an alternate musical reference during relaxation.',
    tags: ['alternate tuning', 'music', 'relaxation'],
  },
  {
    id: 'clear-octave',
    name: 'Clear Octave',
    hz: 512,
    category: 'Audio feature',
    description: 'A precise octave-based tone with a bright, clean character.',
    intention: 'Use as a simple tone for attentive listening.',
    tags: ['octave', 'bright', 'listening'],
  },
  {
    id: 'open',
    name: 'Open',
    hz: 528,
    category: 'Traditional association',
    description: 'A widely shared tone in contemporary spiritual wellness culture. VibraHeal offers it for mindfulness without cure or repair claims.',
    intention: 'Pair with an uplifting meditation or gratitude practice.',
    tags: ['uplifting', 'gratitude', 'tradition'],
  },
  {
    id: 'connect',
    name: 'Connect',
    hz: 639,
    category: 'Traditional association',
    description: 'A contemporary sound-practice tone associated with connection and harmony in some spiritual traditions.',
    intention: 'Use during gratitude, compassion, or relationship reflection.',
    tags: ['connection', 'compassion', 'tradition'],
  },
  {
    id: 'clarity',
    name: 'Clarity',
    hz: 741,
    category: 'Traditional association',
    description: 'A bright carrier tone associated with clarity in modern spiritual frequency systems. The label describes tradition, not a guaranteed outcome.',
    intention: 'Pair with focused breathing or a creative reset.',
    tags: ['clarity', 'creative', 'tradition'],
  },
  {
    id: 'inner-listening',
    name: 'Inner Listening',
    hz: 852,
    category: 'Traditional association',
    description: 'A higher tone used in some contemplative frequency traditions for inward attention.',
    intention: 'Use briefly at low volume during quiet reflection.',
    tags: ['contemplation', 'reflection', 'high tone'],
  },
  {
    id: 'spacious',
    name: 'Spacious',
    hz: 888,
    category: 'Wellness practice',
    description: 'A clear upper-range carrier designed for short, low-volume mindful listening.',
    intention: 'Create a spacious-feeling pause between activities.',
    tags: ['spacious', 'pause', 'high tone'],
  },
  {
    id: 'stillness',
    name: 'Stillness',
    hz: 963,
    category: 'Traditional association',
    description: 'A high tone associated with stillness and contemplation in some modern spiritual frequency systems.',
    intention: 'Use at very low volume for a brief meditation.',
    tags: ['stillness', 'meditation', 'tradition'],
  },
]
