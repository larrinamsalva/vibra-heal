import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AccessibilityControls from './AccessibilityControls'
import AnimalCalm from './AnimalCalm'
import App from './App'
import ArtifactInspector from './ArtifactInspector'
import BackupRestoreV2 from './BackupRestoreV2'
import BreathingGuide from './BreathingGuide'
import { installBreathingSessionBridge } from './breathingSessionBridge'
import DeviceCheck from './DeviceCheck'
import IssueReport from './IssueReport'
import LocalDataPrivacyCenter from './LocalDataPrivacyCenter'
import NatureMixer from './NatureMixer'
import PwaInstall from './PwaInstall'
import ReleaseChecklist from './ReleaseChecklist'
import ReleaseHistory from './ReleaseHistory'
import ReleasePackage from './ReleasePackage'
import SessionJournal from './SessionJournal'
import SessionSummary from './SessionSummary'
import ToolCenter from './ToolCenter'
import './styles.css'
import './releaseCleanup.css'
import './toolCenterDeviceCheck.css'

installBreathingSessionBridge()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityControls />
    <App />
    <BackupRestoreV2 />
    <BreathingGuide />
    <SessionSummary />
    <SessionJournal />
    <LocalDataPrivacyCenter />
    <NatureMixer />
    <AnimalCalm />
    <PwaInstall />
    <DeviceCheck />
    <IssueReport />
    <ReleaseChecklist />
    <ReleaseHistory />
    <ReleasePackage />
    <ArtifactInspector />
    <ToolCenter />
  </StrictMode>,
)
