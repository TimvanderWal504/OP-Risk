import { useEffect, useRef, useState } from 'react'

export interface UseMissionPanelResult {
  /** Of `MissionPanel` open staat. */
  open: boolean
  /** Of `MissionChangedNotice` getoond moet worden i.p.v. de "Mijn missie"-knop. */
  changed: boolean
  openPanel: () => void
  closePanel: () => void
  dismissChanged: () => void
}

/**
 * State voor de eigen geheime missie (FO §2, §6.1) — verplaatst uit het inmiddels verwijderde
 * `MissionAccess.tsx` (was een floating badge; de knop zit sinds deze taak in `PlayerHeader`,
 * via `PhonePlayerHeader.tsx`) naar een losse hook, zodat die aanroeper dun blijft.
 *
 * Bewaart de laatst geziene `missionId` in een ref om een latere, tussentijdse `id → ander-id`-
 * wissel te detecteren (de `EliminatePlayer`-fallbackregel, FO §6.1) en zet dan `changed` — de
 * aanroeper toont daarop `MissionChangedNotice` i.p.v. de missie-knop, totdat `dismissChanged`
 * wordt aangeroepen. Alleen relevant zodra `missionId` niet-null is (de aanroeper bewaakt dat,
 * zelfde patroon als voorheen); de eerste render met een toegewezen missie is dus nooit de
 * overgang `null → id` zelf.
 */
export function useMissionPanel(missionId: string): UseMissionPanelResult {
  const [open, setOpen] = useState(false)
  const [changed, setChanged] = useState(false)
  const previousMissionId = useRef(missionId)

  useEffect(() => {
    if (previousMissionId.current !== missionId) {
      previousMissionId.current = missionId
      setChanged(true)
    }
  }, [missionId])

  return {
    open,
    changed,
    openPanel: () => setOpen(true),
    closePanel: () => setOpen(false),
    dismissChanged: () => setChanged(false),
  }
}
