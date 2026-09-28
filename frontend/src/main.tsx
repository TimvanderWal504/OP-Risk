// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TvPage } from './routes/tv/TvPage'
import { TvPairPage } from './routes/tv/TvPairPage'
import { PhonePage } from './routes/phone/PhonePage'
import { HomePage } from './routes/phone/HomePage'
import './index.css'
import './i18n'
import { GameHubProvider } from './hooks/GameHubProvider'
import { ToastProvider } from './hooks/ToastProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GameHubProvider>
        <Routes>
          <Route path="/" element={<ToastProvider device="phone"><HomePage /></ToastProvider>} />
          <Route path="/pair/:pairingCode" element={<ToastProvider device="phone"><HomePage /></ToastProvider>} />
          <Route path="/tv" element={<TvPairPage />} />
          <Route path="/tv/:gameId" element={<ToastProvider device="tv"><TvPage /></ToastProvider>} />
          <Route path="/play/:gameId" element={<ToastProvider device="phone"><PhonePage /></ToastProvider>} />
        </Routes>
      </GameHubProvider>
    </BrowserRouter>
  </StrictMode>,
)
