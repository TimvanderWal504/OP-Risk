import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dice } from './Dice'
import { TvShell } from './TvShell'
import { diceGlassBlurPx, diceGlassShadow, dicePip, dicePipRecessedHighlight } from '../../styles/glass-tokens'
import { scaleCssPx } from '../../styles/tvDisplay'
import { TvLanguageDto } from '../../types/TvDisplay'
import { expectedColorMixBorder } from '../../test/cssColorMix'

describe('Dice', () => {
  it('geeft de waarde als toegankelijke naam', () => {
    render(<Dice value={5} colorHex="#0057ff" context="tv" size={104} radius={22} padding={15} gap={6} pipSize={17} />)
    expect(screen.getByRole('img', { name: 'Dobbelsteen 5' })).toBeInTheDocument()
  })

  it('kleurt de rand met de solide spelerskleur op 60% alpha', () => {
    render(<Dice value={1} colorHex="#ca3c25" context="tv" size={104} radius={22} padding={15} gap={6} pipSize={17} />)
    const die = screen.getByRole('img', { name: 'Dobbelsteen 1' })
    expect(die.style.border).toBe(expectedColorMixBorder('#ca3c25'))
  })

  it('legt de recessed hoogtelicht-laag over de constante, volledig ondoorzichtige dice.pip-kleur, ongeacht de spelerskleur', () => {
    render(<Dice value={1} colorHex="#ca3c25" context="tv" size={104} radius={22} padding={15} gap={6} pipSize={17} />)
    const die = screen.getByRole('img', { name: 'Dobbelsteen 1' })
    // De pip blijft 100% dekkend: de radiale hoogtelicht-laag (met eigen alpha) zit ALTIJD
    // bovenop de opake `dicePip.fill`-laag, nooit los, zodat de pip nooit vermengt met wat
    // er via de surface heen schemert (zie dicePipRecessedHighlight-doc-comment).
    expect(die.querySelector('span > span')).toHaveStyle({ background: `${dicePipRecessedHighlight}, ${dicePip.fill}` })
  })

  describe('TV-dobbelsteeninstelling (plan-testronde-tv punt 2)', () => {
    const display = { textScale: 50, glassOpacity: 50, glassBlur: 50, language: TvLanguageDto.Nl, diceScale: 100 }

    it('schaalt een TV-dobbelsteen als geheel: maat, radius, pips, rand, blur, schaduw en perspectief', () => {
      render(
        <TvShell display={display}>
          <Dice value={1} colorHex="#ca3c25" context="tv" size={96} radius={18} padding={13} gap={5} pipSize={16} />
        </TvShell>,
      )
      const die = screen.getByRole('img', { name: 'Dobbelsteen 1' })

      expect(die.style.width).toBe('192px')
      expect(die.style.borderRadius).toBe('36px')
      expect(die.style.padding).toBe('26px')
      expect(die.style.borderWidth).toBe('2px')
      expect(die.style.backdropFilter).toContain(`blur(${diceGlassBlurPx('tv') * 2}px)`)
      expect(die.style.boxShadow).toBe(scaleCssPx(diceGlassShadow, 2))
      expect(die.style.transform).toContain('perspective(800px)')
      expect((die.querySelector('span > span') as HTMLElement).style.width).toBe('32px')
    })

    it('houdt op de kleinste stand minimaal een rand van 1px (de rand draagt de spelerskleur)', () => {
      render(
        <TvShell display={{ ...display, diceScale: 0 }}>
          <Dice value={1} colorHex="#ca3c25" context="tv" size={96} radius={18} padding={13} gap={5} pipSize={16} />
        </TvShell>,
      )
      const die = screen.getByRole('img', { name: 'Dobbelsteen 1' })

      expect(die.style.width).toBe('24px')
      expect(die.style.borderWidth).toBe('1px')
    })

    it('laat een telefoon-dobbelsteen binnen dezelfde shell ongemoeid', () => {
      render(
        <TvShell display={display}>
          <Dice value={1} colorHex="#ca3c25" context="phone" size={58} radius={13} padding={8} gap={3} pipSize={9} />
        </TvShell>,
      )
      const die = screen.getByRole('img', { name: 'Dobbelsteen 1' })

      expect(die.style.width).toBe('58px')
      expect(die.style.boxShadow).toBe(diceGlassShadow)
    })
  })

  it('valt terug op een neutrale glas-surface als colorHex geen hex-kleur is (nog geen speler bekend)', () => {
    render(<Dice value={2} colorHex="var(--surface-3)" context="phone" size={58} radius={13} padding={8} gap={3} pipSize={9} />)
    expect(screen.getByRole('img', { name: 'Dobbelsteen 2' })).toBeInTheDocument()
  })
})
