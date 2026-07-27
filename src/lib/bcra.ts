const BASE_URL = 'https://api.bcra.gob.ar/estadisticas/v4.0'

/** IDs de variable relevantes para este proyecto — ver DECISIONS.md (005). */
export const VARIABLES_BCRA = {
  inflacionMensual: 27,
  tipoCambioMayorista: 5,
  tasaDepositos30Dias: 12,
  icl: 40,
} as const

export interface PuntoSerie {
  fecha: string
  valor: number
}

interface MonetariasSerieResponse {
  status: number
  results: Array<{
    idVariable: number
    detalle: PuntoSerie[]
  }>
}

interface FetchSerieOpts {
  desde?: string
  hasta?: string
  limit?: number
}

export async function fetchSerieMonetaria(
  idVariable: number,
  opts: FetchSerieOpts = {},
): Promise<PuntoSerie[]> {
  const params = new URLSearchParams()
  if (opts.desde) params.set('desde', opts.desde)
  if (opts.hasta) params.set('hasta', opts.hasta)
  params.set('limit', String(opts.limit ?? 3000))

  const res = await fetch(`${BASE_URL}/monetarias/${idVariable}?${params}`)
  if (!res.ok) {
    throw new Error(`BCRA API respondió ${res.status} para la variable ${idVariable}`)
  }

  const data: MonetariasSerieResponse = await res.json()
  return data.results[0]?.detalle ?? []
}
