import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

console.log('[main.jsx] Starting app...')
const root = document.getElementById('root')
console.log('[main.jsx] Root element:', root)
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
console.log('[main.jsx] App rendered')
