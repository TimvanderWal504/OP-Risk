import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiUrl } from '../config/apiConfig'
import type { MapSummaryDto, StartingArmiesPresetDto } from '../types/GameSettings'
import { useToast } from './useToast'

export interface MapChoice {
  /** De kiesbare kaarten van `GET /maps`; leeg zolang die nog laden of als dat mislukte. */
  maps: MapSummaryDto[]
  /** De gekozen kaart, of `null` zolang er (nog) geen kaart is. */
  selectedMap: MapSummaryDto | null
  /** De startleger-presets van de gekozen kaart. */
  presets: StartingArmiesPresetDto[]
  selectMap: (map: MapSummaryDto) => void
}

export interface MapChoiceOptions {
  /**
   * Vuurt bij elke gekozen kaart, ook de eerste automatische keuze. `CreateGameForm` zet hier de
   * startlegers op `map.defaultStartingArmiesPresetId` (FO §10: de preset volgt de kaart).
   */
  onMapChosen: (map: MapSummaryDto) => void
  /** Toast-bron waaronder een laadfout verschijnt, zodat het formulier die kan opruimen. */
  toastSource: string
}

/**
 * Kaartkeuze voor een nieuw spel (FO §4.5, §10): laadt de kaarten, kiest de standaardkaart
 * voor, en laadt de presets van wat er gekozen is. Zonder kiesbare kaart kan er geen spel
 * aangemaakt worden; dan ziet de host een fouttoast.
 */
export function useMapChoice({ onMapChosen, toastSource }: MapChoiceOptions): MapChoice {
  const { t } = useTranslation('createGame')
  const { showError } = useToast()
  const [maps, setMaps] = useState<MapSummaryDto[]>([])
  const [mapId, setMapId] = useState<string | null>(null)
  const [presets, setPresets] = useState<StartingArmiesPresetDto[]>([])

  // De laatste callback, zonder dat het laad-effect opnieuw hoeft te draaien als de aanroeper
  // een nieuwe functie meegeeft.
  const onMapChosenRef = useRef(onMapChosen)
  useEffect(() => {
    onMapChosenRef.current = onMapChosen
  })

  const selectMap = useCallback((map: MapSummaryDto) => {
    setMapId(map.mapId)
    onMapChosenRef.current(map)
  }, [])

  useEffect(() => {
    let cancelled = false

    fetch(apiUrl('/maps'))
      .then((response) => (response.ok ? (response.json() as Promise<MapSummaryDto[]>) : Promise.reject()))
      .then((loaded) => {
        if (cancelled) return

        setMaps(loaded)
        // De server garandeert precies één standaardkaart; valt die toch weg, dan is de eerste
        // kaart beter dan een formulier dat stil op slot blijft.
        const initial = loaded.find((map) => map.isDefault) ?? loaded[0]
        if (!initial) {
          showError(t('errors.connection'), toastSource)
          return
        }
        selectMap(initial)
      })
      .catch(() => {
        if (!cancelled) showError(t('errors.connection'), toastSource)
      })

    return () => {
      cancelled = true
    }
  }, [selectMap, showError, t, toastSource])

  useEffect(() => {
    if (!mapId) return

    let cancelled = false

    fetch(apiUrl(`/maps/${mapId}/starting-armies-presets`))
      .then((response) => (response.ok ? (response.json() as Promise<StartingArmiesPresetDto[]>) : []))
      .then((loaded) => {
        if (!cancelled) setPresets(loaded)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [mapId])

  return { maps, selectedMap: maps.find((map) => map.mapId === mapId) ?? null, presets, selectMap }
}
