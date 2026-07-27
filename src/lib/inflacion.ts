import type { PuntoSerie } from './bcra'

export type IndiceMensual = Record<string, number>

const mesDeFecha = (fecha: string) => fecha.slice(0, 7)

export function construirIndiceMensual(serieAscendente: PuntoSerie[]): IndiceMensual {
  const indice: IndiceMensual = {}
  let nivel = 100
  for (const punto of serieAscendente) {
    nivel *= 1 + punto.valor / 100
    indice[mesDeFecha(punto.fecha)] = nivel
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
    throw new Error('No hay datos de inflación para alguno de los meses seleccionados')
  }
  return nivelDestino / nivelOrigen
}
