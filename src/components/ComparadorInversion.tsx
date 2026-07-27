import { useEffect, useMemo, useState } from 'react'
import { fetchSerieMonetaria, VARIABLES_BCRA, type PuntoSerie } from '../lib/bcra'
import {
  calcularCoeficiente,
  construirIndiceDesdeNivel,
  construirIndiceEncadenado,
  type IndiceMensual,
} from '../lib/indices'

const formatMoneda = (valor: number) =>
  valor.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  })

const formatPorcentaje = (valor: number) =>
  valor.toLocaleString('es-AR', { maximumFractionDigits: 1, signDisplay: 'always' })

type ResultadoCalculo =
  | { ok: true; coeficiente: number; montoResultado: number }
  | { ok: false; error: string }

function calcularResultado(
  indice: IndiceMensual,
  mesOrigen: string,
  mesDestino: string,
  montoNumero: number,
): ResultadoCalculo {
  try {
    const coeficiente = calcularCoeficiente(indice, mesOrigen, mesDestino)
    return { ok: true, coeficiente, montoResultado: montoNumero * coeficiente }
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'No se pudo calcular' }
  }
}

interface SeriesCargadas {
  inflacion: PuntoSerie[]
  dolar: PuntoSerie[]
  tasaDepositos: PuntoSerie[]
}

export function ComparadorInversion() {
  const [series, setSeries] = useState<SeriesCargadas | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [monto, setMonto] = useState('1000')
  const [mesOrigen, setMesOrigen] = useState('')
  const [mesDestino, setMesDestino] = useState('')

  useEffect(() => {
    let cancelado = false
    Promise.all([
      fetchSerieMonetaria(VARIABLES_BCRA.inflacionMensual, { limit: 1500 }),
      fetchSerieMonetaria(VARIABLES_BCRA.tipoCambioMayorista, { limit: 3000 }),
      fetchSerieMonetaria(VARIABLES_BCRA.tasaDepositos30Dias, { limit: 3000 }),
    ])
      .then(([inflacion, dolar, tasaDepositos]) => {
        if (cancelado) return
        const cargadas: SeriesCargadas = {
          inflacion: [...inflacion].reverse(),
          dolar: [...dolar].reverse(),
          tasaDepositos: [...tasaDepositos].reverse(),
        }
        setSeries(cargadas)

        // El rango útil es la intersección: dólar y tasa solo tienen datos desde 2014,
        // aunque inflación tenga historia desde 1943.
        const minComun = [cargadas.inflacion, cargadas.dolar, cargadas.tasaDepositos]
          .map((s) => s[0].fecha.slice(0, 7))
          .reduce((a, b) => (a > b ? a : b))
        const maxComun = [cargadas.inflacion, cargadas.dolar, cargadas.tasaDepositos]
          .map((s) => s[s.length - 1].fecha.slice(0, 7))
          .reduce((a, b) => (a < b ? a : b))

        setMesDestino(maxComun)
        const [anio, mes] = maxComun.split('-').map(Number)
        const haceUnAnio = new Date(anio, mes - 1 - 12, 1)
        const candidato = haceUnAnio.toISOString().slice(0, 7)
        setMesOrigen(candidato > minComun ? candidato : minComun)
      })
      .catch((err: unknown) => {
        if (cancelado) return
        setErrorCarga(err instanceof Error ? err.message : 'Error al cargar datos')
      })
    return () => {
      cancelado = true
    }
  }, [])

  const indices = useMemo(() => {
    if (!series) return null
    return {
      inflacion: construirIndiceEncadenado(series.inflacion, (p) => 1 + p.valor / 100),
      dolar: construirIndiceDesdeNivel(series.dolar),
      tasaDepositos: construirIndiceEncadenado(
        series.tasaDepositos,
        (p) => 1 + p.valor / 12 / 100,
      ),
    }
  }, [series])

  const rango = useMemo(() => {
    if (!series) return null
    const mins = [series.inflacion, series.dolar, series.tasaDepositos].map(
      (s) => s[0].fecha.slice(0, 7),
    )
    const maxs = [series.inflacion, series.dolar, series.tasaDepositos].map(
      (s) => s[s.length - 1].fecha.slice(0, 7),
    )
    return { min: mins.reduce((a, b) => (a > b ? a : b)), max: maxs.reduce((a, b) => (a < b ? a : b)) }
  }, [series])

  const montoNumero = Number(monto)

  const resultados = useMemo(() => {
    if (!indices || !mesOrigen || !mesDestino || Number.isNaN(montoNumero)) return null
    return {
      inflacion: calcularResultado(indices.inflacion, mesOrigen, mesDestino, montoNumero),
      dolar: calcularResultado(indices.dolar, mesOrigen, mesDestino, montoNumero),
      tasaDepositos: calcularResultado(indices.tasaDepositos, mesOrigen, mesDestino, montoNumero),
    }
  }, [indices, mesOrigen, mesDestino, montoNumero])

  return (
    <div className="rounded-lg border border-[var(--grid-line)] bg-[var(--chart-surface)] p-4">
      <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
        ¿Qué me convenía hacer con mi plata?
      </h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Si tenías un monto en el mes de origen, comparación de tres caminos hasta el mes de
        destino: quedarte en pesos, comprar dólares, o un plazo fijo. Todo con datos del BCRA.
      </p>

      {errorCarga && (
        <p className="text-sm text-[var(--text-secondary)]">
          No se pudo cargar la información: {errorCarga}
        </p>
      )}

      {!errorCarga && !series && <p className="text-sm text-[var(--text-muted)]">Cargando…</p>}

      {!errorCarga && series && rango && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
              Monto
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="rounded border border-[var(--axis-line)] bg-transparent px-2 py-1 text-[var(--text-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
              Mes de origen
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
              Mes de destino
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

          {resultados && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(
                [
                  ['Quedarte en pesos', resultados.inflacion],
                  ['Comprar dólares', resultados.dolar],
                  ['Plazo fijo', resultados.tasaDepositos],
                ] as const
              ).map(([titulo, resultado]) => (
                <div key={titulo} className="rounded-md border border-[var(--grid-line)] p-3">
                  <p className="text-sm text-[var(--text-secondary)]">{titulo}</p>
                  {resultado.ok ? (
                    <>
                      <p className="text-xl font-semibold text-[var(--text-primary)]">
                        {formatMoneda(resultado.montoResultado)}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {formatPorcentaje((resultado.coeficiente - 1) * 100)}%
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
