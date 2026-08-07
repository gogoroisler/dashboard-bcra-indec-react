import { useEffect, useMemo, useState } from 'react'
import { fetchSerieMonetariaCompleta, VARIABLES_BCRA, type PuntoSerie } from '../lib/bcra'
import { calcularCoeficiente, construirIndiceDesdeNivel } from '../lib/indices'
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
  | { ok: true; coeficiente: number; montoAjustado: number }
  | { ok: false; error: string }

export function AjusteAlquileres() {
  const {
    datos: serie,
    error: errorCarga,
    reintentar,
  } = useAsyncData<PuntoSerie[]>(() =>
    fetchSerieMonetariaCompleta(VARIABLES_BCRA.icl).then((puntos) => [...puntos].reverse()),
  )

  const [monto, setMonto] = useState('100000')
  const [mesOrigen, setMesOrigen] = useState('')
  const [mesDestino, setMesDestino] = useState('')

  // Los selectores de fecha arrancan vacíos hasta que llegan los datos; ese
  // primer valor por default se calcula una sola vez, cuando `serie` pasa de
  // null a tener contenido.
  useEffect(() => {
    if (!serie || mesDestino) return
    setMesDestino(serie[serie.length - 1].fecha.slice(0, 7))
    const minMes = serie[0].fecha.slice(0, 7)
    const idxHaceUnAnio = Math.max(0, serie.length - 1 - 365)
    const candidato = serie[idxHaceUnAnio].fecha.slice(0, 7)
    setMesOrigen(candidato > minMes ? candidato : minMes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serie])

  const indice = useMemo(() => (serie ? construirIndiceDesdeNivel(serie) : null), [serie])

  const rango = useMemo(() => {
    if (!serie) return null
    return { min: serie[0].fecha.slice(0, 7), max: serie[serie.length - 1].fecha.slice(0, 7) }
  }, [serie])

  const montoNumero = Number(monto)
  const montoValido = !Number.isNaN(montoNumero) && montoNumero > 0

  const resultado: Resultado | null = useMemo(() => {
    if (!indice || !mesOrigen || !mesDestino || !montoValido) return null
    try {
      const coeficiente = calcularCoeficiente(indice, mesOrigen, mesDestino)
      return { ok: true, coeficiente, montoAjustado: montoNumero * coeficiente }
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : 'No se pudo calcular' }
    }
  }, [indice, mesOrigen, mesDestino, montoValido, montoNumero])

  return (
    <div className="rounded-lg border border-[var(--grid-line)] bg-[var(--chart-surface)] p-4">
      <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
        Ajuste de alquileres según ICL
      </h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Cuánto debería ser un alquiler hoy según el Índice para Contratos de Locación del BCRA.
        Desde el DNU 70/2023 el ICL ya no es de uso obligatorio para contratos nuevos — es una
        referencia, no un aumento exigido por ley.
      </p>

      {errorCarga && (
        <MensajeError mensaje={`No se pudo cargar el ICL: ${errorCarga}`} onReintentar={reintentar} />
      )}

      {!errorCarga && !serie && <p className="text-sm text-[var(--text-muted)]">Cargando…</p>}

      {!errorCarga && serie && rango && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
              Alquiler
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
              Mes del último ajuste
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

          {resultado && !resultado.ok && (
            <p className="text-sm text-[var(--text-secondary)]">{resultado.error}</p>
          )}

          {resultado && resultado.ok && (
            <div className="rounded-md border border-[var(--grid-line)] p-3">
              <p className="text-sm text-[var(--text-secondary)]">Alquiler ajustado</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {formatMoneda(resultado.montoAjustado)}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Coeficiente {resultado.coeficiente.toFixed(4)} — variación acumulada{' '}
                {formatPorcentaje((resultado.coeficiente - 1) * 100)}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
