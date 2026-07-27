import { CalculadoraInflacion } from './components/CalculadoraInflacion'
import { TipoCambioChart } from './components/TipoCambioChart'

function App() {
  return (
    <div className="min-h-screen bg-[var(--chart-page)]">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Dashboard BCRA / INDEC
        </h1>
        <CalculadoraInflacion />
        <TipoCambioChart />
      </div>
    </div>
  )
}

export default App
