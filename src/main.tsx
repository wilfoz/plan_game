import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import './i18n/config'
import App from './App'
import { QueryProvider } from './context/QueryProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <App />
      <Toaster position="top-right" richColors closeButton />
    </QueryProvider>
  </StrictMode>,
)
