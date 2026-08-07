// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsyncData } from './useAsyncData'

describe('useAsyncData', () => {
  it('empieza cargando y expone los datos cuando el fetch resuelve', async () => {
    const fetchFn = vi.fn().mockResolvedValue('datos')
    const { result } = renderHook(() => useAsyncData(fetchFn))

    expect(result.current.cargando).toBe(true)
    expect(result.current.datos).toBeNull()

    await waitFor(() => expect(result.current.datos).toBe('datos'))
    expect(result.current.cargando).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('expone el mensaje de error si el fetch rechaza', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('falló la red'))
    const { result } = renderHook(() => useAsyncData(fetchFn))

    await waitFor(() => expect(result.current.error).toBe('falló la red'))
    expect(result.current.datos).toBeNull()
    expect(result.current.cargando).toBe(false)
  })

  it('reintentar vuelve a llamar a la función de fetch y limpia el error previo', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('falló'))
      .mockResolvedValueOnce('ok')
    const { result } = renderHook(() => useAsyncData(fetchFn))

    await waitFor(() => expect(result.current.error).toBe('falló'))
    expect(fetchFn).toHaveBeenCalledTimes(1)

    act(() => result.current.reintentar())

    await waitFor(() => expect(result.current.datos).toBe('ok'))
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(result.current.error).toBeNull()
  })
})
