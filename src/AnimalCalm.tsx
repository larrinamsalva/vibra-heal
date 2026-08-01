import { useEffect, useMemo, useState } from 'react'
import './animalCalm.css'

type SpeciesId = 'dog' | 'cat' | 'rabbit' | 'bird'

type SpeciesProfile = {
  id: SpeciesId
  name: string
  symbol: string
  summary: string
  setup: string[]
  watch: string[]
  vetFlags: string[]
  note: string
}

const SPECIES: SpeciesProfile[] = [
  {
    id: 'dog',
    name: 'Dogs',
    symbol: '🐕',
    summary: 'Dogs can detect sounds people may barely notice. The safest plan is a quiet room, a distant speaker only when needed, and plenty of choice.',
    setup: [
      'Keep the speaker across the room, never beside the bed, crate, or ears.',
      'Use ordinary room sound only—never ultrasonic tones, earbuds, or headphones.',
      'Begin with silence. Add soft ambient sound only when it helps mask an outside noise.',
      'Leave a clear path to another room and keep water, bedding, and familiar scents available.',
    ],
    watch: ['panting when not hot', 'pacing or repeated repositioning', 'trembling', 'hiding', 'ears held back', 'trying to escape', 'unusual barking or growling'],
    vetFlags: ['new sound sensitivity', 'ear pain or discharge', 'head tilt or balance changes', 'sudden loss of response to sound'],
    note: 'A dog choosing to leave is useful feedback, not a failed session.',
  },
  {
    id: 'cat',
    name: 'Cats',
    symbol: '🐈',
    summary: 'Cats hear a wider frequency range than people and most dogs. Quiet, distance, predictability, and escape options matter more than any particular sound.',
    setup: [
      'Keep speakers far from resting places, hiding spots, food, water, and litter areas.',
      'Do not use headphones, collars with speakers, or high-frequency test tones.',
      'Protect access to a familiar hiding place and an elevated resting option.',
      'Avoid sudden starts, volume changes, or looping sounds with sharp clicks.',
    ],
    watch: ['ears flattened or rotated back', 'tail lashing', 'crouching', 'freezing', 'hiding', 'wide pupils', 'leaving the area', 'swatting or vocalizing'],
    vetFlags: ['new startle reactions', 'ear scratching or discharge', 'head tilt', 'balance changes', 'sudden hearing changes'],
    note: 'A relaxed cat may still prefer silence. Let the cat decide the distance and duration.',
  },
  {
    id: 'rabbit',
    name: 'Rabbits & small mammals',
    symbol: '🐇',
    summary: 'Prey animals may hide stress and can be startled by abrupt noise. Keep the environment quiet and focus on shelter, familiar routines, and observation.',
    setup: [
      'Start with no added sound and avoid moving the enclosure for a session.',
      'Provide covered hiding spaces, familiar bedding, hay or food, and an uninterrupted retreat.',
      'Never place a speaker against the enclosure and never use headphones or vibration devices.',
      'Keep children, dogs, cats, and sudden household activity away during the observation period.',
    ],
    watch: ['flattened ears', 'tense crouching', 'hiding', 'thumping', 'bar chewing', 'over-grooming', 'repeated circling', 'changes in eating or toileting'],
    vetFlags: ['reduced appetite', 'fewer or no droppings', 'lethargy', 'breathing difficulty', 'head tilt or abnormal movement'],
    note: 'Changes in eating or droppings can be urgent in rabbits. Contact a veterinarian promptly.',
  },
  {
    id: 'bird',
    name: 'Companion birds',
    symbol: '🦜',
    summary: 'Bird species and individuals differ greatly. Animal Calm does not recommend frequency tones for birds; it supports a stable, low-stimulation room setup.',
    setup: [
      'Keep the cage or stand in its familiar location with normal light and sleep routines.',
      'Never place speakers against a cage and never use headphones, earbuds, or vibration devices.',
      'Avoid sudden tones, bass vibration, sharp clicks, and rapidly changing sound.',
      'Allow the bird to move to a preferred perch or sheltered part of the enclosure.',
    ],
    watch: ['feathers held tightly to the body', 'crouching or leaning away', 'repeated escape movements', 'alarm calling', 'freezing', 'open-mouth breathing', 'unusual aggression'],
    vetFlags: ['open-mouth breathing', 'tail bobbing with breathing', 'loss of balance', 'falling from the perch', 'sudden behavior or appetite change'],
    note: 'Breathing changes in a bird can be an emergency. Seek an avian veterinarian promptly.',
  },
]

const ROOM_CHECKS = [
  'The animal can leave or retreat freely.',
  'No headphones, earbuds, or wearable speakers are being used.',
  'Any speaker is several feet away and set extremely low.',
  'Food, water, bedding, hiding places, and normal routines are available.',
  'I am watching the animal instead of assuming the sound is calming.',
]

const SOURCES = [
  {
    label: 'Merck Veterinary Manual — Deafness in Animals',
    href: 'https://www.merckvetmanual.com/ear-disorders/deafness/deafness-in-animals',
  },
  {
    label: 'Merck Veterinary Manual — Ear Structure and Function in Dogs',
    href: 'https://www.merckvetmanual.com/dog-owners/ear-disorders-of-dogs/ear-structure-and-function-in-dogs',
  },
  {
    label: 'Merck Veterinary Manual — Ear Structure and Function in Cats',
    href: 'https://www.merckvetmanual.com/cat-owners/ear-disorders-of-cats/ear-structure-and-function-in-cats',
  },
  {
    label: 'RSPCA — Rabbit Behaviour and Body Language',
    href: 'https://www.rspca.org.uk/adviceandwelfare/pets/rabbits/behaviour/understanding',
  },
]

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function AnimalCalm() {
  const [activeSpeciesId, setActiveSpeciesId] = useState<SpeciesId>('dog')
  const [checkedItems, setCheckedItems] = useState<number[]>([])
  const [secondsLeft, setSecondsLeft] = useState(5 * 60)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('Choose a species and prepare the room before starting the observation timer.')

  const activeSpecies = useMemo(
    () => SPECIES.find((species) => species.id === activeSpeciesId) ?? SPECIES[0],
    [activeSpeciesId],
  )

  const roomReady = checkedItems.length === ROOM_CHECKS.length

  useEffect(() => {
    const badge = document.querySelector<HTMLElement>('.status-pill')
    if (badge) badge.textContent = 'MVP 0.5'
  }, [])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setRunning(false)
          setStatus('Observation complete. Keep only what your animal appeared comfortable with, and choose silence when unsure.')
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  function toggleCheck(index: number) {
    setCheckedItems((current) => (
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    ))
  }

  function selectSpecies(id: SpeciesId) {
    setActiveSpeciesId(id)
    setRunning(false)
    setSecondsLeft(5 * 60)
    setStatus('Review the species guidance, prepare the room, and observe without forcing participation.')
  }

  function toggleTimer() {
    if (running) {
      setRunning(false)
      setStatus('Observation paused. Stop completely when the animal shows discomfort or tries to leave.')
      return
    }
    if (!roomReady) {
      setStatus('Complete the five room-safety checks before starting the observation timer.')
      return
    }
    if (secondsLeft === 0) setSecondsLeft(5 * 60)
    setRunning(true)
    setStatus('Observation started. This timer produces no sound—watch body language and keep the exit open.')
  }

  function resetPlanner() {
    setRunning(false)
    setSecondsLeft(5 * 60)
    setCheckedItems([])
    setStatus('Planner reset. Silence is always an acceptable choice.')
  }

  return (
    <>
      <a className="animal-calm-jump" href="#animal-calm" aria-label="Open Animal Calm safety guidance">
        <span aria-hidden="true">🐾</span>
        <strong>Animal Calm</strong>
      </a>

      <section className="animal-calm-shell" id="animal-calm" aria-labelledby="animal-calm-title">
        <div className="animal-calm-hero">
          <div>
            <p className="animal-eyebrow">Animal Calm • MVP 0.5</p>
            <h2 id="animal-calm-title">Make the room gentler. Let the animal choose.</h2>
            <p>
              This section does not prescribe frequencies or treat anxiety. It helps caregivers create a quieter environment,
              notice species-specific stress signals, and decide when silence or veterinary care is the better choice.
            </p>
          </div>
          <div className="animal-safety-card" role="note" aria-label="Animal audio safety rule">
            <span aria-hidden="true">🔇</span>
            <div>
              <strong>No headphones on animals.</strong>
              <p>Do not place earbuds, headphones, wearable speakers, or vibration devices on an animal. The human tone player above is not an animal-treatment tool.</p>
            </div>
          </div>
        </div>

        <div className="animal-species-tabs" aria-label="Choose an animal group">
          {SPECIES.map((species) => (
            <button
              key={species.id}
              className={species.id === activeSpeciesId ? 'animal-species-tab active' : 'animal-species-tab'}
              onClick={() => selectSpecies(species.id)}
              aria-pressed={species.id === activeSpeciesId}
            >
              <span aria-hidden="true">{species.symbol}</span>
              <strong>{species.name}</strong>
            </button>
          ))}
        </div>

        <div className="animal-profile-grid">
          <article className="animal-profile-card">
            <div className="animal-profile-heading">
              <span aria-hidden="true">{activeSpecies.symbol}</span>
              <div>
                <p className="animal-kicker">Species-sensitive guidance</p>
                <h3>{activeSpecies.name}</h3>
              </div>
            </div>
            <p className="animal-summary">{activeSpecies.summary}</p>

            <div className="animal-guidance-columns">
              <section>
                <h4>Prepare the space</h4>
                <ul>{activeSpecies.setup.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
              <section>
                <h4>Stop and reassess when you see</h4>
                <div className="animal-signal-list">
                  {activeSpecies.watch.map((item) => <span key={item}>{item}</span>)}
                </div>
              </section>
            </div>

            <div className="animal-vet-box">
              <strong>Contact a veterinarian about:</strong>
              <span>{activeSpecies.vetFlags.join(' • ')}</span>
            </div>
            <p className="animal-note">{activeSpecies.note}</p>
          </article>

          <aside className="animal-planner-card" aria-labelledby="animal-planner-title">
            <p className="animal-kicker">Five-minute observation</p>
            <h3 id="animal-planner-title">Calm-room planner</h3>
            <p>This timer plays no audio. It simply creates a short window for careful observation.</p>

            <div className="animal-checklist">
              {ROOM_CHECKS.map((item, index) => (
                <label key={item}>
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(index)}
                    onChange={() => toggleCheck(index)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>

            <div className="animal-timer" aria-label="Animal observation timer">
              <span>{formatTime(secondsLeft)}</span>
              <small>{running ? 'Observe quietly' : roomReady ? 'Room checks complete' : `${ROOM_CHECKS.length - checkedItems.length} checks remaining`}</small>
            </div>

            <div className="animal-planner-actions">
              <button className="animal-primary-button" onClick={toggleTimer}>
                {running ? 'Pause observation' : secondsLeft === 0 ? 'Start another 5 minutes' : 'Start silent observation'}
              </button>
              <button className="animal-text-button" onClick={resetPlanner}>Reset</button>
            </div>
            <p className="animal-status" aria-live="polite">{status}</p>
          </aside>
        </div>

        <div className="animal-boundaries-grid">
          <article>
            <span>01</span>
            <h3>Choice before sound</h3>
            <p>Keep an exit or retreat available. Do not confine an animal so it must remain near a speaker.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Silence is a valid result</h3>
            <p>VibraHeal does not assume music or tones are calming for every species or individual.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Behavior beats a preset</h3>
            <p>Stop when body language changes. A saved setting never outweighs what the animal is showing now.</p>
          </article>
        </div>

        <details className="animal-sources">
          <summary>Veterinary and animal-welfare sources used for this safety design</summary>
          <div>
            {SOURCES.map((source) => (
              <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
            ))}
          </div>
        </details>
      </section>
    </>
  )
}
