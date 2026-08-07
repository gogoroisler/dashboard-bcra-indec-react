import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchSerieMonetaria, VARIABLES_BCRA, type PuntoSerie } from '../lib/bcra'
import { useAsyncData } from '../hooks/useAsyncData'
import { MensajeError } from './MensajeError'

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

const formatValor = (valor: number) =>
  valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ payload: PuntoSerie }>
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const punto = payload[0].payload
  return (
    <div className="rounded-md border border-[var(--axis-line)] bg-[var(--chart-surface)] px-3 py-2 text-sm shadow-sm">
      <p className="text-[var(--text-muted)]">{formatFecha(punto.fecha)}</p>
      <p className="font-semibold text-[var(--text-primary)]">$ {formatValor(punto.valor)}</p>
    </div>
  )
}

export function TipoCambioChart() {
  const { datos, error, reintentar } = useAsyncData<PuntoSerie[]>(() =>
    fetchSerieMonetaria(VARIABLES_BCRA.tipoCambioMayorista, { limit: 180 }).then((puntos) =>
      // La API devuelve orden descendente (más nuevo primero); el gráfico necesita orden cronológico.
      [...puntos].reverse(),
    ),
  )

  return (
    <div className="rounded-lg border border-[var(--grid-line)] bg-[var(--chart-surface)] p-4">
      <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
        Tipo de cambio mayorista
      </h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Pesos argentinos por dólar estadounidense — últimos 180 días (BCRA)
      </p>

      {error && (
        <MensajeError mensaje={`No se pudo cargar el tipo de cambio: ${error}`} onReintentar={reintentar} />
      )}

      {!error && !datos && (
        <p className="text-sm text-[var(--text-muted)]">Cargando…</p>
      )}

      {!error && datos && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--grid-line)" vertical={false} />
            <XAxis
              dataKey="fecha"
              tickFormatter={formatFecha}
              stroke="var(--axis-line)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="var(--axis-line)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(valor: number) => valor.toLocaleString('es-AR')}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: 'var(--axis-line)', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="var(--series-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--chart-surface)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
