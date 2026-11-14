import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (reg) window.setInterval(() => void reg.update(), 60 * 1000)
  },
})

let reloading = false
const hadController = !!navigator.serviceWorker?.controller
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (reloading || !hadController) return
  reloading = true
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
