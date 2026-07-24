import type { RoleSummaryDto } from '../types/GameState'
import { SelectableOption } from './ui/SelectableOption'

export interface JoinRoleStepProps {
  roles: RoleSummaryDto[]
  takenRoleIds: string[]
  selectedRoleId: string | null
  onPick: (roleId: string) => void
  error?: string | null
}

/** Derde join-stap (FO §3/§8, alleen bij RoleAssignment = Kiezen): rol kiezen. */
export function JoinRoleStep({
  roles,
  takenRoleIds,
  selectedRoleId,
  onPick,
  error = null,
}: JoinRoleStepProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-5">
      <h1 className="font-display text-h1 font-bold">Kies je rol</h1>
      {error && <p className="text-loss">{error}</p>}
      <div role="radiogroup" aria-label="Kies je rol" className="flex flex-1 flex-col gap-2.5 overflow-y-auto">
        {roles.map((role) => {
          const taken = takenRoleIds.includes(role.id) && selectedRoleId !== role.id
          const selected = selectedRoleId === role.id

          return (
            <SelectableOption
              key={role.id}
              selected={selected}
              disabled={taken}
              onSelect={() => onPick(role.id)}
              className="flex flex-col gap-2 p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-display font-bold">{role.name}</span>
                {taken && <span className="ml-auto text-xs text-fg-muted">Bezet</span>}
                {selected && <span className="ml-auto text-pitch-400">✓</span>}
              </div>
              <p className="text-sm text-fg-secondary">{role.description}</p>
            </SelectableOption>
          )
        })}
      </div>
    </div>
  )
}
