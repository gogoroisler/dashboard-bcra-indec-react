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

/** Tope real de la API por request — confirmado por el mensaje de error si se pide más. */
const LIMITE_POR_PAGINA = 3000

/**
 * Trae el historial completo de una variable, paginando con `offset` las veces
 * que haga falta. Necesario para series largas (tipo de cambio, tasas) que
 * superan el tope de 3000 registros por request — con una sola llamada nos
 * quedábamos solo con los últimos ~3000 registros sin darnos cuenta (ver
 * DECISIONS.md 014).
 */
export async function fetchSerieMonetariaCompleta(idVariable: number): Promise<PuntoSerie[]> {
  const todos: PuntoSerie[] = []
  let offset = 0

  while (true) {
    const params = new URLSearchParams({
      limit: String(LIMITE_POR_PAGINA),
      offset: String(offset),
    })
    const res = await fetch(`${BASE_URL}/monetarias/${idVariable}?${params}`)
    if (!res.ok) {
      throw new Error(`BCRA API respondió ${res.status} para la variable ${idVariable}`)
    }

    const data: MonetariasSerieResponse = await res.json()
    const pagina = data.results[0]?.detalle ?? []
    todos.push(...pagina)

    if (pagina.length < LIMITE_POR_PAGINA) break
    offset += LIMITE_POR_PAGINA
  }

  return todos
}
