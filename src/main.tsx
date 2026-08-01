import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AccessibilityControls from './AccessibilityControls'
import AnimalCalm from './AnimalCalm'
import App from './App'
import BackupRestore from './BackupRestore'
import BreathingGuide from './BreathingGuide'
import { installBreathingSessionBridge } from './breathingSessionBridge'
import NatureMixer from './NatureMixer'
import PwaInstall from './PwaInstall'
import './styles.css'

installBreathingSessionBridge()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityControls />
    <App />
    <BackupRestore />
    <BreathingGuide />
    <NatureMixer />
    <AnimalCalm />
    <PwaInstall />
  </StrictMode>,
)
