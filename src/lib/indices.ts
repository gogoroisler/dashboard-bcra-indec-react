import type { PuntoSerie } from './bcra'

export type IndiceMensual = Record<string, number>

const mesDeFecha = (fecha: string) => fecha.slice(0, 7)

/**
 * Reduce una serie que puede traer varias filas por mes (ej. series diarias
 * como el tipo de cambio o una tasa de interés) a un punto por mes, quedándose
 * con el último valor observado de ese mes.
 */
export function colapsarUltimoPorMes(serieAscendente: PuntoSerie[]): PuntoSerie[] {
  const porMes = new Map<string, PuntoSerie>()
  for (const punto of serieAscendente) {
    porMes.set(mesDeFecha(punto.fecha), punto)
  }
  return [...porMes.values()]
}

/**
 * Encadena un factor de crecimiento mes a mes — para series que dan una
 * variación (inflación mensual, tasa nominal anual) en vez de un nivel.
 * Colapsa a un punto por mes antes de encadenar: si la serie de entrada es
 * diaria (ej. una tasa de interés), el factor mensual se aplica una vez por
 * mes, no una vez por cada fila diaria.
 */
export function construirIndiceEncadenado(
  serieAscendente: PuntoSerie[],
  factorMensual: (punto: PuntoSerie) => number,
  base = 100,
): IndiceMensual {
  const indice: IndiceMensual = {}
  let nivel = base
  for (const punto of colapsarUltimoPorMes(serieAscendente)) {
    nivel *= factorMensual(punto)
    indice[mesDeFecha(punto.fecha)] = nivel
  }
  return indice
}

/**
 * Para series que ya son un nivel (tipo de cambio, índice de precios/salarios):
 * toma el último valor disponible de cada mes, sin encadenar nada.
 */
export function construirIndiceDesdeNivel(serieAscendente: PuntoSerie[]): IndiceMensual {
  const indice: IndiceMensual = {}
  for (const punto of colapsarUltimoPorMes(serieAscendente)) {
    indice[mesDeFecha(punto.fecha)] = punto.valor
  }
  return indice
}

export function calcularCoeficiente(
  indice: IndiceMensual,
  mesOrigen: string,
  mesDestino: string,
): number {
  const nivelOrigen = indice[mesOrigen]
  const nivelDestino = indice[mesDestino]
  if (nivelOrigen === undefined || nivelDestino === undefined) {
    throw new Error('No hay datos para alguno de los meses seleccionados')
  }
  return nivelDestino / nivelOrigen
}
