import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RoleSummaryDto } from '../types/GameState'
import { SelectableOption } from './ui/SelectableOption'
import { JoinProgressHeader } from './ui/JoinProgressHeader'
import { Footer } from './ui/Footer'
import { Button } from './ui/Button'
import { tDynamic } from '../i18n/useT'

export interface JoinRoleStepProps {
  roles: RoleSummaryDto[]
  takenRoleIds: string[]
  onPick: (roleId: string) => void
  onBack: () => void
  stepIndex: number
  stepCount: number
  error?: string | null
}

/** Tweede join-stap (FO §3/§8, alleen bij RoleAssignment = Kiezen): rol kiezen.
 * Select-dan-bevestig (uit het oorspronkelijke design): een klik
 * zet alleen de lokale keuze; zonder keuze toont de knopplek een placeholder-tekst
 * i.p.v. een knop. De footer is een rij van twee knoppen: `onBack` (naar de
 * naam+kleur-stap) en de bevestigknop die `onPick` aanroept. */
export function JoinRoleStep({
  roles,
  takenRoleIds,
  onPick,
  onBack,
  stepIndex,
  stepCount,
  error = null,
}: JoinRoleStepProps) {
  const { t } = useTranslation('join')
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null)

  return (
    <div className="flex flex-1 flex-col gap-4 p-5">
      <JoinProgressHeader currentStep={stepIndex} stepCount={stepCount} />
      <div>
        <h1 className="font-display text-[26px] font-extrabold">{t('role.title')}</h1>
        <p className="mt-1.5 text-sm text-fg-secondary">{t('role.sub')}</p>
      </div>
      <div
        role="radiogroup"
        aria-label={t('role.ariaLabel')}
        className="flex flex-1 flex-col gap-2.5 overflow-y-auto"
      >
        {roles.map((role) => {
          const taken = takenRoleIds.includes(role.id)
          const selected = pendingRoleId === role.id

          return (
            <SelectableOption
              key={role.id}
              selected={selected}
              disabled={taken}
              onSelect={() => setPendingRoleId(role.id)}
              className="flex flex-col gap-2 p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-display font-bold">{tDynamic(`${role.id}.name`, 'roles')}</span>
                {taken && <span className="ml-auto text-xs text-fg-muted">{t('role.taken')}</span>}
                {selected && (
                  <span className="ml-auto text-pitch-400" aria-hidden>
                    {'✓'}
                  </span>
                )}
              </div>
              <p className="text-sm text-fg-secondary">{tDynamic(`${role.id}.description`, 'roles')}</p>
            </SelectableOption>
          )
        })}
      </div>
      <Footer error={error}>
        <div className="flex flex-row gap-2.5">
          <Button variant="secondary" onClick={onBack} className="min-h-[46px] flex-1 text-sm">
            {t('role.back')}
          </Button>
          {pendingRoleId ? (
            <Button onClick={() => onPick(pendingRoleId)} className="flex-[2]">
              {t('role.confirm')}
            </Button>
          ) : (
            <div className="flex min-h-16 flex-[2] items-center justify-center rounded-card border border-dashed border-border-strong text-sm text-fg-muted">
              {t('role.pickFirst')}
            </div>
          )}
        </div>
      </Footer>
    </div>
  )
}
