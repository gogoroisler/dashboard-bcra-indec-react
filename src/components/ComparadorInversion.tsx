import { useEffect, useMemo, useState } from 'react'
import { fetchSerieMonetariaCompleta, VARIABLES_BCRA, type PuntoSerie } from '../lib/bcra'
import { fetchSerieDatosGobAr, SERIES_DATOS_GOB_AR } from '../lib/datosGobAr'
import { EvolucionChart } from './EvolucionChart'
import { useAsyncData } from '../hooks/useAsyncData'
import { MensajeError } from './MensajeError'
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

function ResultadoLinea({
  etiqueta,
  resultado,
}: {
  etiqueta?: string
  resultado: ResultadoCalculo
}) {
  return (
    <div>
      {etiqueta && <p className="text-xs text-[var(--text-muted)]">{etiqueta}</p>}
      {resultado.ok ? (
        <>
          <p className="text-xl font-semibold text-[var(--text-primary)]">
            {formatMoneda(resultado.montoResultado)}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            {formatPorcentaje((resultado.coeficiente - 1) * 100)}%
          </p>
        </>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">{resultado.error}</p>
      )}
    </div>
  )
}

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
  ipcba: PuntoSerie[]
}

export function ComparadorInversion() {
  const {
    datos: series,
    error: errorCarga,
    reintentar,
  } = useAsyncData<SeriesCargadas>(() =>
    Promise.all([
      fetchSerieMonetariaCompleta(VARIABLES_BCRA.inflacionMensual),
      fetchSerieMonetariaCompleta(VARIABLES_BCRA.tipoCambioMayorista),
      fetchSerieMonetariaCompleta(VARIABLES_BCRA.tasaDepositos30Dias),
      fetchSerieDatosGobAr(SERIES_DATOS_GOB_AR.ipcba),
    ]).then(([inflacion, dolar, tasaDepositos, ipcba]) => ({
      inflacion: [...inflacion].reverse(),
      dolar: [...dolar].reverse(),
      tasaDepositos: [...tasaDepositos].reverse(),
      ipcba, // ya viene ascendente de datos.gob.ar
    })),
  )

  const [monto, setMonto] = useState('1000')
  const [mesOrigen, setMesOrigen] = useState('')
  const [mesDestino, setMesDestino] = useState('')

  // El rango de los selectores de fecha usa solo inflación/dólar/tasa (desde 2014).
  // IPCBA queda afuera de esta cuenta a propósito: tiene menos historia y más
  // rezago (ver DECISIONS.md 011) — si entrara acá, achicaría el rango disponible
  // para las otras tres referencias por una sola que va más atrasada. IPCBA calcula
  // su propio resultado por separado y muestra su propio error si el mes elegido
  // queda fuera de su rango, sin restringir al resto.
  useEffect(() => {
    if (!series || mesDestino) return
    const minComun = [series.inflacion, series.dolar, series.tasaDepositos]
      .map((s) => s[0].fecha.slice(0, 7))
      .reduce((a, b) => (a > b ? a : b))
    const maxComun = [series.inflacion, series.dolar, series.tasaDepositos]
      .map((s) => s[s.length - 1].fecha.slice(0, 7))
      .reduce((a, b) => (a < b ? a : b))

    setMesDestino(maxComun)
    const [anio, mes] = maxComun.split('-').map(Number)
    const candidato = new Date(anio, mes - 1 - 12, 1).toISOString().slice(0, 7)
    setMesOrigen(candidato > minComun ? candidato : minComun)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series])

  const indices = useMemo(() => {
    if (!series) return null
    return {
      inflacion: construirIndiceEncadenado(series.inflacion, (p) => 1 + p.valor / 100),
      dolar: construirIndiceDesdeNivel(series.dolar),
      tasaDepositos: construirIndiceEncadenado(
        series.tasaDepositos,
        (p) => 1 + p.valor / 12 / 100,
      ),
      ipcba: construirIndiceDesdeNivel(series.ipcba),
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
  const montoValido = !Number.isNaN(montoNumero) && montoNumero > 0

  const resultados = useMemo(() => {
    if (!indices || !mesOrigen || !mesDestino || !montoValido) return null
    return {
      inflacion: calcularResultado(indices.inflacion, mesOrigen, mesDestino, montoNumero),
      dolar: calcularResultado(indices.dolar, mesOrigen, mesDestino, montoNumero),
      tasaDepositos: calcularResultado(indices.tasaDepositos, mesOrigen, mesDestino, montoNumero),
      ipcba: calcularResultado(indices.ipcba, mesOrigen, mesDestino, montoNumero),
    }
  }, [indices, mesOrigen, mesDestino, montoValido, montoNumero])

  return (
    <div className="rounded-lg border border-[var(--grid-line)] bg-[var(--chart-surface)] p-4">
      <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
        ¿Qué me convenía hacer con mi plata?
      </h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Si tenías un monto en el mes de origen, comparación de tres caminos hasta el mes de
        destino: quedarte en pesos, comprar dólares, o un plazo fijo. Datos del BCRA, con el IPCBA
        (INDEC/IDECBA) como segunda referencia de inflación para CABA.
      </p>

      {errorCarga && (
        <MensajeError mensaje={`No se pudo cargar la información: ${errorCarga}`} onReintentar={reintentar} />
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
              {!montoValido && (
                <span className="text-xs text-[var(--text-secondary)]">
                  Ingresá un monto mayor a cero
                </span>
              )}
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
              <div className="rounded-md border border-[var(--grid-line)] p-3">
                <p className="text-sm text-[var(--text-secondary)]">Quedarte en pesos</p>
                <ResultadoLinea etiqueta="Nacional (BCRA)" resultado={resultados.inflacion} />
                <div className="mt-3 border-t border-[var(--grid-line)] pt-3">
                  <ResultadoLinea etiqueta="Ciudad de Buenos Aires (IPCBA)" resultado={resultados.ipcba} />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    El IPCBA mide precios solo de CABA, no de todo el país — no es directamente
                    comparable con el resto del dashboard.
                  </p>
                </div>
              </div>

              {(
                [
                  ['Comprar dólares', resultados.dolar],
                  ['Plazo fijo', resultados.tasaDepositos],
                ] as const
              ).map(([titulo, resultado]) => (
                <div key={titulo} className="rounded-md border border-[var(--grid-line)] p-3">
                  <p className="text-sm text-[var(--text-secondary)]">{titulo}</p>
                  <ResultadoLinea resultado={resultado} />
                </div>
              ))}
            </div>
          )}

          {indices && montoValido && (
            <EvolucionChart
              indice={indices.inflacion}
              mesOrigen={mesOrigen}
              mesDestino={mesDestino}
              monto={montoNumero}
              titulo="Evolución del monto necesario para no perder contra la inflación (nacional, BCRA)"
            />
          )}
        </div>
      )}
    </div>
  )
}
