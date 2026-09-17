import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CardDto } from '../types/Card'
import { ModalShell } from './ui/ModalShell'
import { GlassPanel } from './ui/GlassPanel'
import { SelectableOption } from './ui/SelectableOption'
import { TerritoryCardTile } from './ui/TerritoryCardTile'
import { Button } from './ui/Button'
import { Footer } from './ui/Footer'
import { LockIcon } from './ui/icons'

export interface CardsPanelProps {
  hand: CardDto[]
  myTerritoryIds: Set<string>
  /** Bepaalt de copy ("verplicht") én of de sluit-/overslaanknoppen verborgen blijven. */
  mustTradeInCards: boolean
  initialMode: 'browse' | 'trade'
  onTradeInCards: (cardIds: string[]) => Promise<void>
  /**
   * Altijd een echte callback, ook zolang `mustTradeInCards` waar is: de aanroeper bepaalt
   * hoe "gesloten" zich gedraagt (`PlaceReinforcementStep` leidt zijn eigen open-state af als
   * `mustTradeInCards || vrijwilligOpen`, zodat deze aanroep tijdens een verplichting simpelweg
   * geen effect heeft in plaats van dat deze component zelf `null` moet doorgeven — zie de
   * doc-comment daar). Wordt na een geslaagde inleg altijd aangeroepen, ook als er meteen nóg
   * een inleg nodig is (hand nog steeds over de drempel): de aanroeper beslist of dat de
   * volgende render opnieuw opent.
   */
  onClose: () => void
  error: string | null
}

const TRADE_SET_SIZE = 3

/**
 * Het "Mijn kaarten"-paneel (FO §4.4/§5.2/§7): één full-screen `ModalShell`, twee interne
 * weergaven — hand-overzicht (browse) en inleg-stap (trade). Twee onafhankelijke oproepplekken
 * kiezen de startweergave (`PhonePlayerHeader` altijd `browse`, `PlaceReinforcementStep` altijd
 * `trade`); binnen browse kan de speler zelf naar trade schakelen via de "Leg 3 kaarten in"-knop.
 * Verlaten van trade-modus (annuleren óf bevestigen) roept altijd `onClose()` — geen interne
 * "terug naar browse"-navigatie, zie de plan-review-bevinding in het uitvoeringsplan: de
 * `PlaceReinforcementStep`-instantie start al in trade-modus zonder browse om naar terug te
 * keren, dus twee verschillende after-trade-gedragingen zou onnodige complexiteit zijn — de
 * volgende `GameStateUpdated` brengt de geslonken hand toch al mee.
 */
export function CardsPanel({
  hand,
  myTerritoryIds,
  mustTradeInCards,
  initialMode,
  onTradeInCards,
  onClose,
  error,
}: CardsPanelProps) {
  const { t } = useTranslation('cardsPanel')
  const [mode, setMode] = useState<'browse' | 'trade'>(initialMode)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const isOwned = (card: CardDto) => card.territoryId !== null && myTerritoryIds.has(card.territoryId)

  const toggleCard = (cardId: string) => {
    setSelectedIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId)
      if (current.length >= TRADE_SET_SIZE) return current

      return [...current, cardId]
    })
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await onTradeInCards(selectedIds)
      // Reset vóór onClose: als de aanroeper besluit toch weer open te blijven (nog een
      // verplichte inleg nodig), staat de selectie al leeg voor de volgende ronde.
      setSelectedIds([])
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  // Verplicht ⇒ geen ontsnapping, ook niet vanuit browse (kan in de praktijk niet voorkomen —
  // `mustTradeInCards` opent deze instantie altijd al in trade-modus — maar defensief geldt de
  // regel voor beide modi, niet alleen trade).
  const canClose = !mustTradeInCards

  return (
    <ModalShell
      context="phone"
      animated
      className="absolute inset-0 z-50 flex flex-col px-gutter pt-[52px] pb-gutter"
      style={{ borderRadius: 0 }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <span className="flex items-center justify-center gap-1.5 text-xs text-fg-muted">
          <LockIcon className="h-3.5 w-3.5" />
          {t('visibleOnlyToYou')}
        </span>
        <h1 className="text-center font-display text-h1 font-extrabold text-fg">
          {mode === 'trade' ? t('tradeTitle') : t('title')}
        </h1>
        <p className="text-center font-body text-body text-fg-secondary">
          {mode === 'trade' && mustTradeInCards ? t('tradeMandatory') : t('intro')}
        </p>

        {mode === 'browse' &&
          (hand.length === 0 ? (
            <GlassPanel elevation="base" context="phone" className="text-center font-body text-body text-fg-secondary">
              {t('empty')}
            </GlassPanel>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto">
              {hand.map((card) => (
                <TerritoryCardTile key={card.id} card={card} owned={isOwned(card)} />
              ))}
            </div>
          ))}

        {mode === 'trade' && (
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto" role="group">
            {hand.map((card) => {
              const selected = selectedIds.includes(card.id)

              return (
                <SelectableOption
                  key={card.id}
                  role="checkbox"
                  selected={selected}
                  disabled={!selected && selectedIds.length >= TRADE_SET_SIZE}
                  onSelect={() => toggleCard(card.id)}
                  className="p-0"
                >
                  <TerritoryCardTile card={card} owned={isOwned(card)} />
                </SelectableOption>
              )
            })}
          </div>
        )}
      </div>

      <Footer error={error}>
        {mode === 'browse' ? (
          <>
            {hand.length >= TRADE_SET_SIZE && (
              <Button variant="primary" onClick={() => setMode('trade')}>
                {t('tradeTitle')}
              </Button>
            )}
            {canClose && (
              <Button variant="secondary" onClick={onClose}>
                {t('close')}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              variant="primary"
              disabled={selectedIds.length !== TRADE_SET_SIZE || submitting}
              onClick={handleConfirm}
            >
              {t('tradeConfirm')}
            </Button>
            {canClose && (
              <Button variant="secondary" onClick={onClose}>
                {t('tradeSkip')}
              </Button>
            )}
          </>
        )}
      </Footer>
    </ModalShell>
  )
}
