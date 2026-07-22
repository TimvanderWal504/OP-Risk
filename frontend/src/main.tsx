// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TvPage } from './routes/tv/TvPage'
import { PhonePage } from './routes/phone/PhonePage'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/tv/:gameId" element={<TvPage />} />
        <Route path="/play/:gameId" element={<PhonePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)