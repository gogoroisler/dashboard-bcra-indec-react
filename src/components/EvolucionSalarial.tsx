import { useEffect, useMemo, useState } from 'react'
import { fetchSerieMonetariaCompleta, VARIABLES_BCRA, type PuntoSerie } from '../lib/bcra'
import { fetchSerieDatosGobAr, SERIES_DATOS_GOB_AR } from '../lib/datosGobAr'
import {
  calcularCoeficiente,
  construirIndiceDesdeNivel,
  construirIndiceEncadenado,
  type IndiceMensual,
} from '../lib/indices'
import { useAsyncData } from '../hooks/useAsyncData'
import { MensajeError } from './MensajeError'

const formatMoneda = (valor: number) =>
  valor.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  })

const formatPorcentaje = (valor: number) =>
  valor.toLocaleString('es-AR', { maximumFractionDigits: 1, signDisplay: 'always' })

type Resultado =
  | { ok: true; sueldoNecesario: number; diferencia: number; diferenciaPorc: number }
  | { ok: false; error: string }

function calcularDiferenciaSalarial(
  indice: IndiceMensual,
  mesOrigen: string,
  mesDestino: string,
  sueldoAntiguo: number,
  sueldoActual: number,
): Resultado {
  try {
    const coeficiente = calcularCoeficiente(indice, mesOrigen, mesDestino)
    const sueldoNecesario = sueldoAntiguo * coeficiente
    const diferencia = sueldoActual - sueldoNecesario
    return {
      ok: true,
      sueldoNecesario,
      diferencia,
      diferenciaPorc: (diferencia / sueldoNecesario) * 100,
    }
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'No se pudo calcular' }
  }
}

interface SeriesCargadas {
  inflacion: PuntoSerie[]
  salariosIndec: PuntoSerie[]
}

export function EvolucionSalarial() {
  const {
    datos: series,
    error: errorCarga,
    reintentar,
  } = useAsyncData<SeriesCargadas>(() =>
    Promise.all([
      fetchSerieMonetariaCompleta(VARIABLES_BCRA.inflacionMensual),
      fetchSerieDatosGobAr(SERIES_DATOS_GOB_AR.indiceSalarios),
    ]).then(([inflacionDesc, salariosIndec]) => ({
      inflacion: [...inflacionDesc].reverse(),
      salariosIndec, // la API de INDEC ya devuelve orden ascendente
    })),
  )

  const [sueldoAntiguo, setSueldoAntiguo] = useState('500000')
  const [sueldoActual, setSueldoActual] = useState('600000')
  const [mesOrigen, setMesOrigen] = useState('')
  const [mesDestino, setMesDestino] = useState('')

  const indices = useMemo(() => {
    if (!series) return null
    return {
      inflacion: construirIndiceEncadenado(series.inflacion, (p) => 1 + p.valor / 100),
      salariosIndec: construirIndiceDesdeNivel(series.salariosIndec),
    }
  }, [series])

  const rango = useMemo(() => {
    if (!series) return null
    const mins = [series.inflacion, series.salariosIndec].map((s) => s[0].fecha.slice(0, 7))
    const maxs = [series.inflacion, series.salariosIndec].map(
      (s) => s[s.length - 1].fecha.slice(0, 7),
    )
    return { min: mins.reduce((a, b) => (a > b ? a : b)), max: maxs.reduce((a, b) => (a < b ? a : b)) }
  }, [series])

  // Valores por default de los selectores de mes, calculados una sola vez
  // cuando llega el rango (no se pisan si el usuario ya los cambió).
  useEffect(() => {
    if (!rango || mesDestino) return
    setMesDestino(rango.max)
    const [anio, mes] = rango.max.split('-').map(Number)
    const haceUnAnio = new Date(anio, mes - 1 - 12, 1).toISOString().slice(0, 7)
    setMesOrigen(haceUnAnio > rango.min ? haceUnAnio : rango.min)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango])

  const antiguoNumero = Number(sueldoAntiguo)
  const actualNumero = Number(sueldoActual)
  const sueldosValidos =
    !Number.isNaN(antiguoNumero) &&
    antiguoNumero > 0 &&
    !Number.isNaN(actualNumero) &&
    actualNumero > 0

  const resultados = useMemo(() => {
    if (!indices || !mesOrigen || !mesDestino || !sueldosValidos) return null
    return {
      inflacion: calcularDiferenciaSalarial(
        indices.inflacion,
        mesOrigen,
        mesDestino,
        antiguoNumero,
        actualNumero,
      ),
      salariosIndec: calcularDiferenciaSalarial(
        indices.salariosIndec,
        mesOrigen,
        mesDestino,
        antiguoNumero,
        actualNumero,
      ),
    }
  }, [indices, mesOrigen, mesDestino, sueldosValidos, antiguoNumero, actualNumero])

  return (
    <div className="rounded-lg border border-[var(--grid-line)] bg-[var(--chart-surface)] p-4">
      <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
        ¿Tu sueldo le ganó a la inflación?
      </h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Comparás lo que ganabas en un mes contra lo que ganás ahora, contra dos referencias:
        inflación (BCRA) y el Índice de Salarios de INDEC (promedio general de la economía).
      </p>

      {errorCarga && (
        <MensajeError mensaje={`No se pudo cargar la información: ${errorCarga}`} onReintentar={reintentar} />
      )}

      {!errorCarga && !series && <p className="text-sm text-[var(--text-muted)]">Cargando…</p>}

      {!errorCarga && series && rango && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
              Sueldo anterior
              <input
                type="number"
                value={sueldoAntiguo}
                onChange={(e) => setSueldoAntiguo(e.target.value)}
                className="rounded border border-[var(--axis-line)] bg-transparent px-2 py-1 text-[var(--text-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
              Sueldo actual
              <input
                type="number"
                value={sueldoActual}
                onChange={(e) => setSueldoActual(e.target.value)}
                className="rounded border border-[var(--axis-line)] bg-transparent px-2 py-1 text-[var(--text-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
              Mes anterior
              <input
                type="month"
                value={mesOrigen}
                min={rango.min}
                max={rango.max}
                onChange={(e) => setMesOrigen(e.target.value)}
                className="rounded border border-[var(--axis-line)] bg-transparent px-2 py-1 text-[var(--text-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
              Mes actual
              <input
                type="month"
                value={mesDestino}
                min={rango.min}
                max={rango.max}
                onChange={(e) => setMesDestino(e.target.value)}
                className="rounded border border-[var(--axis-line)] bg-transparent px-2 py-1 text-[var(--text-primary)]"
              />
            </label>
          </div>

          {!sueldosValidos && (
            <p className="text-xs text-[var(--text-secondary)]">
              Ingresá sueldos mayores a cero, anterior y actual.
            </p>
          )}

          {resultados && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['Contra la inflación (BCRA)', resultados.inflacion],
                  ['Contra el promedio salarial (INDEC)', resultados.salariosIndec],
                ] as const
              ).map(([titulo, resultado]) => (
                <div key={titulo} className="rounded-md border border-[var(--grid-line)] p-3">
                  <p className="text-sm text-[var(--text-secondary)]">{titulo}</p>
                  {resultado.ok ? (
                    <>
                      <p className="text-sm text-[var(--text-muted)]">
                        Para no perder, necesitabas ganar {formatMoneda(resultado.sueldoNecesario)}
                      </p>
                      <p className="text-xl font-semibold text-[var(--text-primary)]">
                        {formatPorcentaje(resultado.diferenciaPorc)}%
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {resultado.diferencia >= 0 ? 'ganaste' : 'perdiste'}{' '}
                        {formatMoneda(Math.abs(resultado.diferencia))} por mes en términos reales
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">{resultado.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
