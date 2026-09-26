import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CreateGameForm } from '../../components/CreateGameForm'
import { PhoneShell } from '../../components/ui/PhoneShell'
import { TextField } from '../../components/ui/TextField'
import { Footer } from '../../components/ui/Footer'
import { Button } from '../../components/ui/Button'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { PhoneScreen } from '../../components/ui/PhoneScreen'
import { useSendGameToTv } from '../../hooks/useSendGameToTv'

const MAP_ID = 'standaard-43'

type Mode = 'choose' | 'create' | 'join' | 'pairTv' | 'retry'

interface CodeFormOptions {
  title: string
  placeholder: string
  submitLabel: string
  onSubmit: () => void
}

/**
 * Openingsscherm van de telefoon-app (FO §2.2): host vs speler, plus "TV koppelen" (dit toestel
 * wordt de TV en toont een koppel-QR, `/tv`) en de koppelcode van zo'n TV met de hand invoeren.
 *
 * Via `/pair/:pairingCode` — de QR op zo'n TV — wordt deze telefoon de host: hij gaat meteen naar
 * de spelinstellingen, en na het aanmaken krijgt de TV de spelcode.
 */
export function HomePage() {
  const { pairingCode } = useParams<{ pairingCode?: string }>()
  const [mode, setMode] = useState<Mode>(pairingCode ? 'create' : 'choose')
  const [codeInput, setCodeInput] = useState('')
  // Het spel dat in de koppelflow is aangemaakt maar (nog) niet bij de TV aankwam.
  const [createdGameId, setCreatedGameId] = useState<string | null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation(['home', 'common', 'tvPairing'])
  const sendToTv = useSendGameToTv()
  const code = codeInput.trim().toUpperCase()

  const sendAndContinue = async (gameId: string) => {
    if (pairingCode && !(await sendToTv.send(pairingCode, gameId))) {
      setCreatedGameId(gameId)
      setMode('retry')

      return
    }

    navigate(`/play/${gameId}`)
  }

  if (mode === 'create') {
    return (
      <PhoneShell>
        <CreateGameForm mapId={MAP_ID} onCreated={sendAndContinue} />
      </PhoneShell>
    )
  }

  if (mode === 'retry' && createdGameId) {
    return (
      <PhoneShell>
        <PhoneScreen>
          <div className="flex flex-1 flex-col justify-center">
            <GlassPanel elevation="base" context="phone" className="rounded-2xl">
              <h1 className="font-display text-h1 font-bold">{t('tvPairing:phone.retry.title')}</h1>
              <p className="mt-2 text-sm text-fg-secondary">
                {t('tvPairing:phone.retry.description', { gameId: createdGameId })}
              </p>
            </GlassPanel>
          </div>
          <Footer error={sendToTv.error}>
            <Button type="button" variant="secondary" onClick={() => navigate(`/play/${createdGameId}`)}>
              {t('tvPairing:phone.continueToLobby')}
            </Button>
            <Button type="button" disabled={sendToTv.sending} onClick={() => void sendAndContinue(createdGameId)}>
              {t('tvPairing:phone.retry.resend')}
            </Button>
          </Footer>
        </PhoneScreen>
      </PhoneShell>
    )
  }

  /** Het code-invoerscherm, gedeeld door "Deelnemen" en het invoeren van de koppelcode. */
  const codeForm = ({ title, placeholder, submitLabel, onSubmit }: CodeFormOptions): ReactNode => {
    const handleSubmit = (event: FormEvent) => {
      event.preventDefault()

      if (code) onSubmit()
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
              <h1 className="mb-3 font-display text-h1 font-bold">{title}</h1>
              <TextField
                autoFocus
                uppercase
                value={codeInput}
                onChange={setCodeInput}
                placeholder={placeholder}
                ariaLabel={title}
              />
            </GlassPanel>
            <Footer>
              <Button type="submit" disabled={!code}>
                {submitLabel}
              </Button>
            </Footer>
          </PhoneScreen>
        </form>
      </PhoneShell>
    )
  }

  if (mode === 'join') {
    return codeForm({
      title: t('home:joinCode.title'),
      placeholder: t('home:joinCode.placeholder'),
      submitLabel: t('common:actions.join'),
      onSubmit: () => navigate(`/play/${code}`),
    })
  }

  if (mode === 'pairTv') {
    return codeForm({
      title: t('tvPairing:phone.pairingCode.title'),
      placeholder: t('tvPairing:phone.pairingCode.placeholder'),
      submitLabel: t('tvPairing:phone.pairingCode.submit'),
      // `/` en `/pair/:pairingCode` renderen dezelfde HomePage op dezelfde plek in de boom; React
      // Router hermount 'm bij die wissel niet, dus de modus gaat hier zelf naar de instellingen.
      onSubmit: () => {
        setMode('create')
        navigate(`/pair/${code}`)
      },
    })
  }

  const entries: { mode: Mode | 'tv'; title: string; description: string }[] = [
    { mode: 'create', title: t('home:createCard.title'), description: t('home:createCard.description') },
    { mode: 'join', title: t('home:joinCard.title'), description: t('home:joinCard.description') },
    { mode: 'tv', title: t('home:tvCard.title'), description: t('home:tvCard.description') },
    { mode: 'pairTv', title: t('home:pairTvCard.title'), description: t('home:pairTvCard.description') },
  ]

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
                onClick={() => (entry.mode === 'tv' ? navigate('/tv') : setMode(entry.mode))}
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
