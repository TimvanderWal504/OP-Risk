import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalShell } from './ui/ModalShell'
import { GlassPanel } from './ui/GlassPanel'
import { Button } from './ui/Button'
import { Footer } from './ui/Footer'
import { Slider } from './ui/Slider'
import { SegmentedControl } from './ui/SegmentedControl'
import { TvLanguageDto, type TvDisplaySettingsDto } from '../types/TvDisplay'
import { TV_DISPLAY_MAX_VALUE, TV_DISPLAY_MIN_VALUE, TV_DISPLAY_STEP } from '../styles/tvDisplay'

export interface TvDisplayPanelProps {
  /** De door de server bevestigde TV-weergave (`GameStateDto.tvDisplay`). */
  settings: TvDisplaySettingsDto
  /** De server-default (`GameStateDto.tvDisplayDefault`) — "Standaard" stuurt precies deze. */
  defaults: TvDisplaySettingsDto
  /**
   * Stuurt de volledige nieuwe set naar de server; het paneel toont pas iets nieuws na
   * bevestiging. `false` = geweigerd.
   */
  onChange: (settings: TvDisplaySettingsDto) => Promise<boolean>
  onClose: () => void
  /** De laatste hub-fout. Het paneel toont 'm alleen als die door een eigen wijziging ontstond. */
  error?: string | null
}

type ScaleKey = 'textScale' | 'glassOpacity' | 'glassBlur' | 'diceScale'

/**
 * "TV-weergave" op de host-telefoon (plan-testronde-tv punt 2): hoe de TV het spel toont.
 * Zelfde full-screen `ModalShell`-patroon en `z-50` als `MissionPanel` — een vrijwillige
 * "even bijstellen"-actie, geen spelbeslissing; een combat-modal moet erboven kunnen komen.
 *
 * Drie onderdelen: het scherm (tekst, panelen), de dobbelstenen als eigen onderdeel (ze schalen
 * als geheel, los van de tekst — besluit gebruiker 2026-09-24) en de taal op de TV. Elke wijziging
 * stuurt de volledige set; geen optimistic update (frontend/CLAUDE.md): de sliders tonen tijdens
 * het slepen alleen hun eigen concept-waarde en volgen daarna wat de server bevestigt.
 *
 * Basis voor een wijziging is de laatst *verstúúrde* set, niet de laatst bevestigde
 * (elite-code-review 2026-09-24): wie snel twee dingen aanpast, stuurt het tweede verzoek anders
 * met de oude waarde van het eerste mee, en de laatste wint — de eerste wijziging zou stilzwijgend
 * terugdraaien. Na een weigering valt de basis terug op wat de server bevestigd heeft. Dit
 * verandert niets aan wat er getóónd wordt; alleen aan wat er verstuurd wordt.
 */
export function TvDisplayPanel({ settings, defaults, onChange, onClose, error = null }: TvDisplayPanelProps) {
  const { t } = useTranslation('tvDisplay')
  const pendingRef = useRef<TvDisplaySettingsDto | null>(null)
  // Een fout van vóór het openen (bv. een mislukte startpoging) hoort niet in dit paneel.
  const [ownError, setOwnError] = useState(false)

  const send = async (next: TvDisplaySettingsDto): Promise<boolean> => {
    pendingRef.current = next
    setOwnError(false)

    const accepted = await onChange(next)

    if (!accepted) {
      if (pendingRef.current === next) pendingRef.current = null
      setOwnError(true)
    }

    return accepted
  }

  const base = () => pendingRef.current ?? settings

  const commit = (key: ScaleKey) => (value: number) => {
    const current = base()

    return value === current[key] ? Promise.resolve(true) : send({ ...current, [key]: value })
  }

  const slider = (key: ScaleKey) => (
    <Slider
      label={t(key)}
      value={settings[key]}
      min={TV_DISPLAY_MIN_VALUE}
      max={TV_DISPLAY_MAX_VALUE}
      step={TV_DISPLAY_STEP}
      formatValue={(value) => `${value}%`}
      onCommit={commit(key)}
    />
  )

  const isDefault =
    settings.textScale === defaults.textScale &&
    settings.glassOpacity === defaults.glassOpacity &&
    settings.glassBlur === defaults.glassBlur &&
    settings.diceScale === defaults.diceScale &&
    settings.language === defaults.language

  return (
    <ModalShell
      context="phone"
      animated
      className="absolute inset-0 z-50 flex flex-col gap-3 px-gutter pt-[52px] pb-gutter"
      style={{ borderRadius: 0 }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-h1 font-extrabold text-fg">{t('title')}</h1>
        <p className="font-body text-sm text-fg-secondary">{t('intro')}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        <Section label={t('sections.screen')}>
          {slider('textScale')}
          {slider('glassOpacity')}
          {slider('glassBlur')}
        </Section>

        <Section label={t('sections.dice')}>{slider('diceScale')}</Section>

        <Section label={t('sections.language')}>
          <SegmentedControl
            options={[
              { value: TvLanguageDto.Nl, label: t('languages.nl') },
              { value: TvLanguageDto.En, label: t('languages.en') },
            ]}
            value={settings.language}
            onChange={(language) => {
              const current = base()
              if (language !== current.language) void send({ ...current, language })
            }}
          />
        </Section>
      </div>

      <Footer error={ownError ? error : null}>
        <Button variant="secondary" disabled={isDefault} onClick={() => void send(defaults)}>
          {t('reset')}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          {t('close')}
        </Button>
      </Footer>
    </ModalShell>
  )
}

/** Eén onderdeel van het paneel: een label-kicker boven een glazen blok (zelfde kicker als `MissionPanel`). */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <GlassPanel elevation="raised" context="phone" className="flex flex-col gap-3">
      <span className="font-body text-xs font-extrabold tracking-[.12em] text-fg-muted uppercase">{label}</span>
      {children}
    </GlassPanel>
  )
}
