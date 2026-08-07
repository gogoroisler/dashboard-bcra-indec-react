// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import * as bcra from '../lib/bcra'
import type { PuntoSerie } from '../lib/bcra'
import * as datosGobAr from '../lib/datosGobAr'
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
  it('si IPCBA no tiene dato para el mes de destino, muestra su propio error sin afectar al resto', async () => {
    vi.spyOn(bcra, 'fetchSerieMonetariaCompleta').mockImplementation((idVariable: number) => {
      if (idVariable === bcra.VARIABLES_BCRA.inflacionMensual) return Promise.resolve(serieBcra(10))
      if (idVariable === bcra.VARIABLES_BCRA.tipoCambioMayorista)
        return Promise.resolve(serieBcra(1500))
      return Promise.resolve(serieBcra(30)) // tasaDepositos30Dias
    })

    // IPCBA (ascendente, como devuelve datos.gob.ar) solo llega hasta 2025-01,
    // no incluye el mes de destino (2025-08) que sí tienen las otras tres series.
    vi.spyOn(datosGobAr, 'fetchSerieDatosGobAr').mockResolvedValue(
      mesesDesc
        .filter((mes) => mes <= '2025-01')
        .reverse()
        .map((mes, i) => ({ fecha: `${mes}-01`, valor: 100 + i })),
    )

    render(<ComparadorInversion />)

    await waitFor(() => expect(screen.getByText('Comprar dólares')).toBeInTheDocument())

    // Las tres referencias con datos completos muestran un resultado en pesos.
    expect(screen.getAllByText(/\$\s?[\d.,]+/).length).toBeGreaterThanOrEqual(3)

    // IPCBA, con menos historia, falla con su propio mensaje — no rompe la pantalla.
    expect(
      screen.getByText('No hay datos para alguno de los meses seleccionados'),
    ).toBeInTheDocument()
  })
})
