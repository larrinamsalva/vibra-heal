import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AnimalCalm from './AnimalCalm'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <AnimalCalm />
  </StrictMode>,
)
