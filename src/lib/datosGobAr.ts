import type { PuntoSerie } from './bcra'

const BASE_URL = 'https://apis.datos.gob.ar/series/api/series'

/** IDs de serie relevantes de la API de series de datos.gob.ar — ver DECISIONS.md (008). */
export const SERIES_DATOS_GOB_AR = {
  indiceSalarios: '149.1_TL_INDIIOS_OCTU_0_21',
} as const

interface SeriesResponse {
  data: Array<[string, number]>
}

export async function fetchSerieDatosGobAr(idSerie: string, limit = 1000): Promise<PuntoSerie[]> {
  const res = await fetch(`${BASE_URL}/?ids=${idSerie}&limit=${limit}`)
  if (!res.ok) {
    throw new Error(`API de series respondió ${res.status} para la serie ${idSerie}`)
  }

  const data: SeriesResponse = await res.json()
  // A diferencia de la API del BCRA, esta devuelve orden ascendente por default.
  return data.data.map(([fecha, valor]) => ({ fecha, valor }))
}
