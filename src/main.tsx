import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AccessibilityControls from './AccessibilityControls'
import AnimalCalm from './AnimalCalm'
import App from './App'
import BackupRestore from './BackupRestore'
import NatureMixer from './NatureMixer'
import PwaInstall from './PwaInstall'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityControls />
    <App />
    <BackupRestore />
    <NatureMixer />
    <AnimalCalm />
    <PwaInstall />
  </StrictMode>,
)
