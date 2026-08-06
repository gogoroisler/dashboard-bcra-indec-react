import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { generarMesesEvolucion, type IndiceMensual } from '../lib/indices'

const formatMoneda = (valor: number) =>
  valor.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  })

function formatMes(mes: string, modo: 'anual' | 'mensual') {
  const fecha = new Date(`${mes}-01`)
  if (modo === 'anual') return fecha.toLocaleDateString('es-AR', { year: 'numeric' })
  return fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
}

interface PuntoEvolucion {
  mes: string
  valor: number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ payload: PuntoEvolucion }>
  modo: 'anual' | 'mensual'
}

function ChartTooltip({ active, payload, modo }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const punto = payload[0].payload
  return (
    <div className="rounded-md border border-[var(--axis-line)] bg-[var(--chart-surface)] px-3 py-2 text-sm shadow-sm">
      <p className="text-[var(--text-muted)]">{formatMes(punto.mes, modo)}</p>
      <p className="font-semibold text-[var(--text-primary)]">{formatMoneda(punto.valor)}</p>
    </div>
  )
}

interface EvolucionChartProps {
  indice: IndiceMensual
  mesOrigen: string
  mesDestino: string
  monto: number
  titulo?: string
}

export function EvolucionChart({
  indice,
  mesOrigen,
  mesDestino,
  monto,
  titulo,
}: EvolucionChartProps) {
  const { datos, modo } = useMemo(() => {
    const meses = generarMesesEvolucion(mesOrigen, mesDestino)
    const nivelOrigen = indice[mesOrigen]
    const totalMeses =
      (Number(mesDestino.slice(0, 4)) - Number(mesOrigen.slice(0, 4))) * 12 +
      (Number(mesDestino.slice(5, 7)) - Number(mesOrigen.slice(5, 7)))

    const puntos: PuntoEvolucion[] = meses
      .filter((mes) => indice[mes] !== undefined)
      .map((mes) => ({ mes, valor: monto * (indice[mes] / nivelOrigen) }))

    return { datos: puntos, modo: totalMeses / 12 >= 3 ? ('anual' as const) : ('mensual' as const) }
  }, [indice, mesOrigen, mesDestino, monto])

  if (datos.length < 2) return null

  return (
    <div className="mt-4">
      {titulo && <p className="mb-2 text-sm text-[var(--text-secondary)]">{titulo}</p>}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={datos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--grid-line)" vertical={false} />
          <XAxis
            dataKey="mes"
            tickFormatter={(mes: string) => formatMes(mes, modo)}
            stroke="var(--axis-line)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            domain={['auto', 'auto']}
            stroke="var(--axis-line)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(valor: number) => formatMoneda(valor)}
          />
          <Tooltip
            content={<ChartTooltip modo={modo} />}
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
    </div>
  )
}
