import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CreateGameForm } from '../../components/CreateGameForm'
import { PhoneShell } from '../../components/ui/PhoneShell'
import { TextField } from '../../components/ui/TextField'
import { Footer } from '../../components/ui/Footer'
import { Button } from '../../components/ui/Button'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { PhoneScreen } from '../../components/ui/PhoneScreen'

const MAP_ID = 'standaard-43'

type Mode = 'choose' | 'create' | 'join'

/** Openingsscherm van de telefoon-app (FO §2.2): host vs speler. */
export function HomePage() {
  const [mode, setMode] = useState<Mode>('choose')
  const [joinCode, setJoinCode] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation(['home', 'common'])

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
          <PhoneScreen className="gap-4">
            {/* Kop en invoerveld in één paneel — de kop is het label ván dit veld, geen los
                zwevend pil-paneel ernaast (zelfde ingreep als JoinNameColorStep). Het TextField
                blijft genest: de nesting-guard zet zijn eigen blur uit, zijn `--silver-600`-rand
                blijft zichtbaar. */}
            <GlassPanel elevation="base" context="phone" className="rounded-2xl">
              <h1 className="mb-3 font-display text-h1 font-bold">{t('home:joinCode.title')}</h1>
              <TextField
                autoFocus
                uppercase
                value={joinCode}
                onChange={setJoinCode}
                placeholder={t('home:joinCode.placeholder')}
                ariaLabel={t('home:joinCode.title')}
              />
            </GlassPanel>
            <Footer>
              <Button type="submit" disabled={!joinCode.trim()}>
                {t('common:actions.join')}
              </Button>
            </Footer>
          </PhoneScreen>
        </form>
      </PhoneShell>
    )
  }

  const entries = [
    { mode: 'create', title: t('home:createCard.title'), description: t('home:createCard.description') },
    { mode: 'join', title: t('home:joinCard.title'), description: t('home:joinCard.description') },
  ] as const

  return (
    <PhoneShell>
      <PhoneScreen>
        <GlassPanel elevation="base" context="phone" padding="none" className="self-center rounded-2xl px-5 py-2.5 text-center">
          <h1 className="font-display text-h1 font-black tracking-[var(--tracking-wide)]">{t('home:title')}</h1>
        </GlassPanel>

        <div className="flex flex-1 flex-col justify-center gap-3">
          {entries.map((entry) => (
            <GlassPanel
              key={entry.mode}
              elevation="base"
              context="phone"
              padding="none"
              className="rounded-card"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <button
                type="button"
                onClick={() => setMode(entry.mode)}
                className="w-full px-5 py-5 text-left"
              >
                <span className="block font-display text-h2 font-black">{entry.title}</span>
                <span className="mt-1 block text-sm text-fg-muted">{entry.description}</span>
              </button>
            </GlassPanel>
          ))}
        </div>

        <GlassPanel elevation="base" context="phone" padding="none" className="self-center rounded-2xl px-4 py-1.5 text-center text-xs text-fg-muted">
          {t('home:footer.playerCount')}
        </GlassPanel>
      </PhoneScreen>
    </PhoneShell>
  )
}
