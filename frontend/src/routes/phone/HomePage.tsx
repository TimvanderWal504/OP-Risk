import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
          <div className="flex flex-1 flex-col gap-4 p-5">
            <h1 className="font-display text-h1 font-bold">{t('home:joinCode.title')}</h1>
            <TextField
              autoFocus
              uppercase
              value={joinCode}
              onChange={setJoinCode}
              placeholder={t('home:joinCode.placeholder')}
              ariaLabel={t('home:joinCode.title')}
            />
          </div>
          <Footer>
            <Button type="submit" disabled={!joinCode.trim()}>
              {t('common:actions.join')}
            </Button>
          </Footer>
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
      <div className="flex flex-1 flex-col px-6 pt-10 pb-6">
        <h1 className="text-center font-display text-h1 font-black tracking-[var(--tracking-wide)]">
          {t('home:title')}
        </h1>

        <div className="flex flex-1 flex-col justify-center gap-3">
          {entries.map((entry) => (
            <button
              key={entry.mode}
              type="button"
              onClick={() => setMode(entry.mode)}
              className="w-full rounded-card border border-border-strong bg-[var(--atlas-t03)] px-5 py-5 text-left"
            >
              <span className="block font-display text-h2 font-black">{entry.title}</span>
              <span className="mt-1 block text-sm text-fg-muted">{entry.description}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-fg-muted">{t('home:footer.playerCount')}</p>
      </div>
    </PhoneShell>
  )
}
