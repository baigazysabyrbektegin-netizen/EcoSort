import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AppStoreProvider } from './state/AppStore'
import { ToastProvider } from './state/toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AppStoreProvider>
        <App />
      </AppStoreProvider>
    </ToastProvider>
  </StrictMode>,
)
