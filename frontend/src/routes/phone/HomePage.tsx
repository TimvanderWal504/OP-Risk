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

type Mode = 'choose' | 'create' | 'join' | 'send' | 'sent'

/**
 * Openingsscherm van de telefoon-app (FO §2.2): host vs speler, plus "TV opzetten" (dit toestel
 * wordt de TV, `/tv`). Via `/pair/:pairingCode` — de QR op zo'n TV — is dit de koppelstap van de
 * host: een nieuw spel starten of een bestaande spelcode sturen, en de TV krijgt die spelcode.
 */
export function HomePage() {
  const { pairingCode } = useParams<{ pairingCode?: string }>()
  const [mode, setMode] = useState<Mode>('choose')
  const [joinCode, setJoinCode] = useState('')
  // Het spel dat deze telefoon in de koppelstap zelf aanmaakte: lukt het sturen daarvan niet
  // meteen, dan blijft de lobby bereikbaar en kan de host het opnieuw proberen.
  const [createdGameId, setCreatedGameId] = useState<string | null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation(['home', 'common', 'tvPairing'])
  const sendToTv = useSendGameToTv()
  const code = joinCode.trim().toUpperCase()

  const handleCreated = async (gameId: string) => {
    if (!pairingCode) {
      navigate(`/play/${gameId}`)

      return
    }

    if (await sendToTv.send(pairingCode, gameId)) {
      navigate(`/play/${gameId}`)

      return
    }

    setCreatedGameId(gameId)
    setJoinCode(gameId)
    setMode('send')
  }

  if (mode === 'create') {
    return (
      <PhoneShell>
        <CreateGameForm mapId={MAP_ID} onCreated={(gameId) => void handleCreated(gameId)} />
      </PhoneShell>
    )
  }

  /** Het spelcode-invoerscherm, gedeeld door "Deelnemen" en "Spelcode naar TV sturen". */
  const codeForm = (onSubmit: () => void, actions: ReactNode, error: string | null = null) => {
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
            <Footer error={error}>{actions}</Footer>
          </PhoneScreen>
        </form>
      </PhoneShell>
    )
  }

  if (mode === 'join') {
    return codeForm(
      () => navigate(`/play/${code}`),
      <Button type="submit" disabled={!code}>
        {t('common:actions.join')}
      </Button>,
    )
  }

  if (mode === 'send' && pairingCode) {
    const handleSend = async () => {
      if (!(await sendToTv.send(pairingCode, code))) return

      if (code === createdGameId) {
        navigate(`/play/${code}`)
      } else {
        setMode('sent')
      }
    }

    return codeForm(
      () => void handleSend(),
      <>
        {createdGameId && (
          <Button type="button" variant="secondary" onClick={() => navigate(`/play/${createdGameId}`)}>
            {t('tvPairing:phone.continueToLobby')}
          </Button>
        )}
        <Button type="submit" disabled={!code || sendToTv.sending}>
          {t('tvPairing:phone.send')}
        </Button>
      </>,
      sendToTv.error,
    )
  }

  if (mode === 'sent') {
    return (
      <PhoneShell>
        <PhoneScreen>
          <div className="flex flex-1 flex-col justify-center">
            <GlassPanel elevation="base" context="phone" className="rounded-2xl text-center">
              <h1 className="font-display text-h1 font-bold">{t('tvPairing:phone.sent.title')}</h1>
              <p className="mt-2 text-sm text-fg-secondary">
                {t('tvPairing:phone.sent.description', { gameId: code })}
              </p>
            </GlassPanel>
          </div>
        </PhoneScreen>
      </PhoneShell>
    )
  }

  const entries: { mode: Mode | 'tv'; title: string; description: string }[] = pairingCode
    ? [
        { mode: 'create', title: t('home:createCard.title'), description: t('home:createCard.description') },
        {
          mode: 'send',
          title: t('tvPairing:phone.sendCard.title'),
          description: t('tvPairing:phone.sendCard.description'),
        },
      ]
    : [
        { mode: 'create', title: t('home:createCard.title'), description: t('home:createCard.description') },
        { mode: 'join', title: t('home:joinCard.title'), description: t('home:joinCard.description') },
        { mode: 'tv', title: t('home:tvCard.title'), description: t('home:tvCard.description') },
      ]

  return (
    <PhoneShell>
      <PhoneScreen>
        <GlassPanel elevation="base" context="phone" padding="none" className="self-center rounded-2xl px-5 py-2.5 text-center">
          <h1 className="font-display text-h1 font-black tracking-[var(--tracking-wide)]">{t('home:title')}</h1>
        </GlassPanel>

        <div className="flex flex-1 flex-col justify-center gap-3">
          {pairingCode && (
            <GlassPanel elevation="base" context="phone" className="rounded-2xl">
              <p className="font-display text-h2 font-black">{t('tvPairing:phone.title')}</p>
              <p className="mt-1 text-sm text-fg-secondary">{t('tvPairing:phone.description')}</p>
            </GlassPanel>
          )}

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
