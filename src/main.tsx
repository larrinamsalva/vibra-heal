import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AnimalCalm from './AnimalCalm'
import App from './App'
import NatureMixer from './NatureMixer'
import PwaInstall from './PwaInstall'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <NatureMixer />
    <AnimalCalm />
    <PwaInstall />
  </StrictMode>,
)
