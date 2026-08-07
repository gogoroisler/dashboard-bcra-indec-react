import { useCallback, useEffect, useState } from 'react'

interface AsyncDataState<T> {
  datos: T | null
  error: string | null
  cargando: boolean
  reintentar: () => void
}

/**
 * Centraliza el patrón repetido en los componentes de datos: fetch al montar,
 * estado de carga/error, limpieza si el componente se desmonta antes de que
 * resuelva, y un reintento manual sin tener que recargar toda la página.
 */
export function useAsyncData<T>(fetchFn: () => Promise<T>): AsyncDataState<T> {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelado = false
    setError(null)
    setDatos(null)
    fetchFn()
      .then((resultado) => {
        if (!cancelado) setDatos(resultado)
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Error al cargar datos')
      })
    return () => {
      cancelado = true
    }
    // Solo `intento` dispara un nuevo fetch — fetchFn es una closure nueva en
    // cada render a propósito (así cada componente puede armar su propio
    // fetch/Promise.all sin memoizar nada), no queremos re-fetchear por eso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento])

  const reintentar = useCallback(() => setIntento((i) => i + 1), [])

  return { datos, error, cargando: !datos && !error, reintentar }
}
