import { describe, expect, it } from 'vitest'
import {
  calcularCoeficiente,
  colapsarUltimoPorMes,
  construirIndiceDesdeNivel,
  construirIndiceEncadenado,
} from './indices'
import type { PuntoSerie } from './bcra'

describe('colapsarUltimoPorMes', () => {
  it('se queda con el último valor de cada mes cuando hay varias filas por mes', () => {
    const serie: PuntoSerie[] = [
      { fecha: '2024-01-05', valor: 1 },
      { fecha: '2024-01-20', valor: 2 },
      { fecha: '2024-02-03', valor: 3 },
    ]

    expect(colapsarUltimoPorMes(serie)).toEqual([
      { fecha: '2024-01-20', valor: 2 },
      { fecha: '2024-02-03', valor: 3 },
    ])
  })
})

describe('construirIndiceEncadenado', () => {
  it('compone el factor mensual mes a mes para una serie ya mensual (ej. inflación)', () => {
    const serie: PuntoSerie[] = [
      { fecha: '2024-01-31', valor: 10 }, // +10%
      { fecha: '2024-02-29', valor: 10 }, // +10%
    ]

    const indice = construirIndiceEncadenado(serie, (p) => 1 + p.valor / 100)

    expect(indice['2024-01']).toBeCloseTo(110)
    expect(indice['2024-02']).toBeCloseTo(121)
  })

  it('regresión: una serie diaria compone una vez por mes, no una vez por fila', () => {
    // Reproduce el bug real: la tasa de depósitos del BCRA es diaria, no mensual.
    // Antes del fix, esto componía el factor una vez por cada fila del día.
    const tasaAnualConstante = 12 // 12% nominal anual -> 1%/mes
    const serieDiaria: PuntoSerie[] = [
      { fecha: '2024-01-05', valor: tasaAnualConstante },
      { fecha: '2024-01-15', valor: tasaAnualConstante },
      { fecha: '2024-01-25', valor: tasaAnualConstante },
      { fecha: '2024-02-03', valor: tasaAnualConstante },
      { fecha: '2024-02-10', valor: tasaAnualConstante },
    ]

    const indice = construirIndiceEncadenado(serieDiaria, (p) => 1 + p.valor / 12 / 100)

    // Correcto: se compone una vez por mes (1.01 * 1.01), sin importar cuántas
    // filas diarias haya dentro de cada mes.
    expect(indice['2024-01']).toBeCloseTo(101)
    expect(indice['2024-02']).toBeCloseTo(102.01)

    // Si el bug reapareciera (componer una vez por fila), '2024-02' daría
    // 100 * 1.01^5 ≈ 105.1 en vez de 102.01 — muy por encima del valor correcto.
    expect(indice['2024-02']).toBeLessThan(103)
  })
})

describe('construirIndiceDesdeNivel', () => {
  it('toma el último valor del mes directamente, sin encadenar', () => {
    const serie: PuntoSerie[] = [
      { fecha: '2024-01-02', valor: 800 },
      { fecha: '2024-01-31', valor: 850 },
      { fecha: '2024-02-15', valor: 900 },
    ]

    const indice = construirIndiceDesdeNivel(serie)

    expect(indice['2024-01']).toBe(850)
    expect(indice['2024-02']).toBe(900)
  })
})

describe('calcularCoeficiente', () => {
  it('calcula el cociente entre el nivel de destino y el de origen', () => {
    const indice = { '2024-01': 100, '2024-12': 130 }
    expect(calcularCoeficiente(indice, '2024-01', '2024-12')).toBeCloseTo(1.3)
  })

  it('tira un error si falta el mes de origen o destino', () => {
    const indice = { '2024-01': 100 }
    expect(() => calcularCoeficiente(indice, '2024-01', '2024-12')).toThrow()
    expect(() => calcularCoeficiente(indice, '2023-01', '2024-01')).toThrow()
  })
})
