// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as bcra from '../lib/bcra'
import type { PuntoSerie } from '../lib/bcra'
import { AjusteAlquileres } from './AjusteAlquileres'

// La API real devuelve orden descendente (más nuevo primero) — el mock imita eso.
const serieIcl: PuntoSerie[] = [
  { fecha: '2025-08-01', valor: 30 },
  { fecha: '2024-08-01', valor: 20 },
]

describe('AjusteAlquileres', () => {
  it('muestra "Cargando…" y después el resultado ajustado', async () => {
    vi.spyOn(bcra, 'fetchSerieMonetariaCompleta').mockResolvedValue(serieIcl)

    render(<AjusteAlquileres />)

    expect(screen.getByText('Cargando…')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Alquiler ajustado')).toBeInTheDocument())
  })

  it('muestra el error de carga y permite reintentar', async () => {
    const fetchMock = vi
      .spyOn(bcra, 'fetchSerieMonetariaCompleta')
      .mockRejectedValueOnce(new Error('BCRA caído'))
      .mockResolvedValueOnce(serieIcl)

    render(<AjusteAlquileres />)

    await waitFor(() => expect(screen.getByText(/BCRA caído/)).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    await waitFor(() => expect(screen.getByText('Alquiler ajustado')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('avisa si el alquiler queda en cero y oculta el resultado', async () => {
    vi.spyOn(bcra, 'fetchSerieMonetariaCompleta').mockResolvedValue(serieIcl)

    render(<AjusteAlquileres />)
    await waitFor(() => expect(screen.getByText('Alquiler ajustado')).toBeInTheDocument())

    await userEvent.clear(screen.getByLabelText('Alquiler'))

    expect(await screen.findByText('Ingresá un monto mayor a cero')).toBeInTheDocument()
    expect(screen.queryByText('Alquiler ajustado')).not.toBeInTheDocument()
  })
})
