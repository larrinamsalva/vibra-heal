export type BreathingPace = 'standard' | 'slower'

export type BreathingPhase = {
  id: 'inhale' | 'hold-in' | 'exhale' | 'hold-out'
  label: string
  seconds: number
  guidance: string
}

export type BreathingPattern = {
  id: 'even' | 'long-exhale' | 'box' | 'gentle-reset'
  name: string
  summary: string
  note: string
  phases: BreathingPhase[]
}

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'even',
    name: 'Even breath',
    summary: 'A simple four-count inhale and four-count exhale with no pauses.',
    note: 'A straightforward rhythm for people who prefer not to hold their breath.',
    phases: [
      { id: 'inhale', label: 'Inhale gently', seconds: 4, guidance: 'Breathe in comfortably without filling past your natural limit.' },
      { id: 'exhale', label: 'Exhale gently', seconds: 4, guidance: 'Let the breath leave without pushing or forcing.' },
    ],
  },
  {
    id: 'long-exhale',
    name: 'Long exhale',
    summary: 'Inhale for four, pause for two, and exhale for six.',
    note: 'The pause is optional. Skip it whenever holding feels uncomfortable.',
    phases: [
      { id: 'inhale', label: 'Inhale gently', seconds: 4, guidance: 'Breathe in at an easy, quiet pace.' },
      { id: 'hold-in', label: 'Pause softly', seconds: 2, guidance: 'Keep the throat and shoulders relaxed. Skip this pause when needed.' },
      { id: 'exhale', label: 'Exhale slowly', seconds: 6, guidance: 'Let the exhale lengthen only as far as it remains comfortable.' },
    ],
  },
  {
    id: 'box',
    name: 'Box rhythm',
    summary: 'Four equal phases: inhale, pause, exhale, and pause.',
    note: 'Both pauses are optional. This is pacing guidance, not a performance test.',
    phases: [
      { id: 'inhale', label: 'Inhale gently', seconds: 4, guidance: 'Use a comfortable breath rather than the biggest breath possible.' },
      { id: 'hold-in', label: 'Pause softly', seconds: 4, guidance: 'Relax the jaw and skip the pause if it creates strain.' },
      { id: 'exhale', label: 'Exhale gently', seconds: 4, guidance: 'Release the breath evenly without squeezing.' },
      { id: 'hold-out', label: 'Rest briefly', seconds: 4, guidance: 'Stay relaxed and begin the next inhale early whenever needed.' },
    ],
  },
  {
    id: 'gentle-reset',
    name: 'Gentle reset',
    summary: 'A shorter three-count inhale followed by a five-count exhale.',
    note: 'No breath holds and a shorter cycle for a light, easy practice.',
    phases: [
      { id: 'inhale', label: 'Inhale lightly', seconds: 3, guidance: 'Take a small, comfortable breath.' },
      { id: 'exhale', label: 'Exhale softly', seconds: 5, guidance: 'Let the breath taper out naturally.' },
    ],
  },
]

export const DEFAULT_BREATHING_PATTERN_ID: BreathingPattern['id'] = 'long-exhale'

export function getBreathingPattern(id: string | undefined) {
  return BREATHING_PATTERNS.find((pattern) => pattern.id === id)
    ?? BREATHING_PATTERNS.find((pattern) => pattern.id === DEFAULT_BREATHING_PATTERN_ID)
    ?? BREATHING_PATTERNS[0]
}

export function getPhaseDuration(seconds: number, pace: BreathingPace) {
  return Math.max(1, Math.round(seconds * (pace === 'slower' ? 1.25 : 1)))
}
