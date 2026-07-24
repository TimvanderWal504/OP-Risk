import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateGameForm } from '../../components/CreateGameForm'
import { PhoneShell } from '../../components/ui/PhoneShell'
import { TextField } from '../../components/ui/TextField'
import { Footer } from '../../components/ui/Footer'
import { Button } from '../../components/ui/Button'

const MAP_ID = 'standaard-43'

type Mode = 'choose' | 'create' | 'join'

/** Openingsscherm van de telefoon-app (FO §2.2): host vs speler. */
export function HomePage() {
  const [mode, setMode] = useState<Mode>('choose')
  const [joinCode, setJoinCode] = useState('')
  const navigate = useNavigate()

  if (mode === 'create') {
    return (
      <PhoneShell>
        <CreateGameForm mapId={MAP_ID} onCreated={(gameId) => navigate(`/play/${gameId}`)} />
      </PhoneShell>
    )
  }

  if (mode === 'join') {
    const handleSubmit = (event: FormEvent) => {
      event.preventDefault()

      if (joinCode.trim()) {
        navigate(`/play/${joinCode.trim().toUpperCase()}`)
      }
    }

    return (
      <PhoneShell>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-5">
            <h1 className="font-display text-h1 font-bold">Spelcode</h1>
            <TextField
              autoFocus
              uppercase
              value={joinCode}
              onChange={setJoinCode}
              placeholder="bv. ATLAS7"
            />
          </div>
          <Footer>
            <Button type="submit" disabled={!joinCode.trim()}>
              Deelnemen
            </Button>
          </Footer>
        </form>
      </PhoneShell>
    )
  }

  return (
    <PhoneShell>
      <div className="flex flex-1 flex-col px-6 pt-10 pb-6">
        <div className="text-center">
          <h1 className="font-display text-[34px] leading-tight font-black tracking-[.08em]">
            OPERATIE ATLAS
          </h1>
          <p className="mt-2 text-sm text-fg-muted">Verover de wereld — één telefoon per veldheer.</p>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4">
          <button
            type="button"
            onClick={() => setMode('create')}
            className="flex w-full items-center gap-4 rounded-[20px] border border-gold-600 px-5 py-[22px] text-left"
            style={{
              background: 'linear-gradient(120deg, rgba(242,169,34,.18), rgba(242,169,34,.04))',
            }}
          >
            <span className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-2xl bg-gold-400 text-[28px] text-[#0a0e17]">
              ✦
            </span>
            <span className="flex-1">
              <span className="block font-display text-[22px] font-black">Nieuw spel starten</span>
              <span className="mt-0.5 block text-[13px] text-fg-muted">
                Jij wordt de host en stelt het spel in.
              </span>
            </span>
            <span className="text-[22px] text-gold-300">›</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('join')}
            className="flex w-full items-center gap-4 rounded-[20px] border border-border-strong bg-white/4 px-5 py-[22px] text-left"
          >
            <span className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-2xl bg-pitch-500 text-[28px] text-[#04060b]">
              ⌂
            </span>
            <span className="flex-1">
              <span className="block font-display text-[22px] font-black">Deelnemen aan een spel</span>
              <span className="mt-0.5 block text-[13px] text-fg-muted">Scan de QR-code op de TV.</span>
            </span>
            <span className="text-[22px] text-fg-muted">›</span>
          </button>
        </div>

        <p className="text-center text-xs text-fg-muted">2 t/m 7 spelers · lokaal netwerk</p>
      </div>
    </PhoneShell>
  )
}
