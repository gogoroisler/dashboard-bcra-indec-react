// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MensajeError } from './MensajeError'

describe('MensajeError', () => {
  it('muestra el mensaje y llama a onReintentar al clickear el botón', async () => {
    const onReintentar = vi.fn()
    render(<MensajeError mensaje="No se pudo cargar" onReintentar={onReintentar} />)

    expect(screen.getByText('No se pudo cargar')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(onReintentar).toHaveBeenCalledTimes(1)
  })
})
