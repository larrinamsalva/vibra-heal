import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AccessibilityControls from './AccessibilityControls'
import AnimalCalm from './AnimalCalm'
import App from './App'
import BackupRestoreV2 from './BackupRestoreV2'
import BreathingGuide from './BreathingGuide'
import { installBreathingSessionBridge } from './breathingSessionBridge'
import NatureMixer from './NatureMixer'
import PwaInstall from './PwaInstall'
import SessionJournal from './SessionJournal'
import SessionSummary from './SessionSummary'
import './styles.css'
import './releaseCleanup.css'

installBreathingSessionBridge()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityControls />
    <App />
    <BackupRestoreV2 />
    <BreathingGuide />
    <SessionSummary />
    <SessionJournal />
    <NatureMixer />
    <AnimalCalm />
    <PwaInstall />
  </StrictMode>,
)
