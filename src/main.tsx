import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AnimalCalm from './AnimalCalm'
import App from './App'
import NatureMixer from './NatureMixer'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <NatureMixer />
    <AnimalCalm />
  </StrictMode>,
)
