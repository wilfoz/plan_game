import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'
import { QueryProvider } from './context/QueryProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryProvider>
      <App />
      <Toaster position="top-right" richColors closeButton />
    </QueryProvider>
  </StrictMode>,
)
