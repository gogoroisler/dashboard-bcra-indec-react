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

/**
 * Genera los meses intermedios entre origen y destino para graficar una evolución.
 * Regla: si la diferencia es de 3 años o más, un punto por año (mismo mes
 * calendario que el origen); si es menor, un punto por mes. El mes de destino
 * siempre queda incluido como último punto, aunque no caiga en el mismo mes
 * calendario que el origen (ver DECISIONS.md 013).
 */
export function generarMesesEvolucion(mesOrigen: string, mesDestino: string): string[] {
  const [anioOrigen, mesNumOrigen] = mesOrigen.split('-').map(Number)
  const [anioDestino, mesNumDestino] = mesDestino.split('-').map(Number)
  const totalMeses = (anioDestino - anioOrigen) * 12 + (mesNumDestino - mesNumOrigen)

  if (totalMeses <= 0) return [mesOrigen]

  const puntos: string[] = []

  if (totalMeses / 12 >= 3) {
    for (let anio = anioOrigen; anio <= anioDestino; anio++) {
      puntos.push(`${anio}-${String(mesNumOrigen).padStart(2, '0')}`)
    }
  } else {
    let anio = anioOrigen
    let mes = mesNumOrigen
    while (anio < anioDestino || (anio === anioDestino && mes <= mesNumDestino)) {
      puntos.push(`${anio}-${String(mes).padStart(2, '0')}`)
      mes += 1
      if (mes > 12) {
        mes = 1
        anio += 1
      }
    }
  }

  if (puntos[puntos.length - 1] !== mesDestino) {
    puntos.push(mesDestino)
  }

  return puntos
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
