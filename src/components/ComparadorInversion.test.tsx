// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import * as bcra from '../lib/bcra'
import type { PuntoSerie } from '../lib/bcra'
import { ComparadorInversion } from './ComparadorInversion'

// 13 meses (ago 2024 – ago 2025), descendente como la API real del BCRA.
const mesesDesc = [
  '2025-08',
  '2025-07',
  '2025-06',
  '2025-05',
  '2025-04',
  '2025-03',
  '2025-02',
  '2025-01',
  '2024-12',
  '2024-11',
  '2024-10',
  '2024-09',
  '2024-08',
]

function serieBcra(valorInicial: number): PuntoSerie[] {
  return mesesDesc.map((mes, i) => ({ fecha: `${mes}-01`, valor: valorInicial - i }))
}

describe('ComparadorInversion', () => {
  it('carga las tres series en paralelo y muestra un resultado distinto en cada tarjeta', async () => {
    vi.spyOn(bcra, 'fetchSerieMonetariaCompleta').mockImplementation((idVariable: number) => {
      if (idVariable === bcra.VARIABLES_BCRA.inflacionMensual) return Promise.resolve(serieBcra(10))
      if (idVariable === bcra.VARIABLES_BCRA.tipoCambioMayorista)
        return Promise.resolve(serieBcra(1500))
      return Promise.resolve(serieBcra(30)) // tasaDepositos30Dias
    })

    render(<ComparadorInversion />)

    await waitFor(() => expect(screen.getByText('Comprar dólares')).toBeInTheDocument())

    expect(screen.getByText('Quedarte en pesos')).toBeInTheDocument()
    expect(screen.getByText('Plazo fijo')).toBeInTheDocument()
    // Las tres tarjetas resuelven a un monto en pesos, no a un mensaje de error.
    expect(screen.getAllByText(/^\$\s?[\d.,]+$/).length).toBe(3)
  })
})
