import { AjusteAlquileres } from './components/AjusteAlquileres'
import { ComparadorInversion } from './components/ComparadorInversion'
import { EvolucionSalarial } from './components/EvolucionSalarial'
import { TipoCambioChart } from './components/TipoCambioChart'

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--chart-page)]">
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Dashboard BCRA / INDEC
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Decisiones financieras cotidianas en Argentina — inflación, dólar, plazo fijo y
            evolución salarial — con datos públicos del BCRA y el INDEC.
          </p>
        </header>

        <main className="space-y-6">
          <ComparadorInversion />
          <EvolucionSalarial />
          <AjusteAlquileres />
          <TipoCambioChart />
        </main>
      </div>

      <footer className="border-t border-[var(--grid-line)] px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-2 text-xs text-[var(--text-muted)]">
          <p>
            Esta herramienta es un proyecto de portfolio con fines educativos — no es
            asesoramiento financiero. Verificá siempre los datos contra la fuente oficial antes
            de tomar una decisión.
          </p>
          <p>
            Datos:{' '}
            <a
              className="underline hover:text-[var(--text-secondary)]"
              href="https://www.bcra.gob.ar/"
              target="_blank"
              rel="noreferrer"
            >
              BCRA
            </a>{' '}
            ·{' '}
            <a
              className="underline hover:text-[var(--text-secondary)]"
              href="https://www.indec.gob.ar/"
              target="_blank"
              rel="noreferrer"
            >
              INDEC
            </a>{' '}
            (vía{' '}
            <a
              className="underline hover:text-[var(--text-secondary)]"
              href="https://datos.gob.ar/"
              target="_blank"
              rel="noreferrer"
            >
              datos.gob.ar
            </a>
            ) · Santiago Gonzalez ·{' '}
            <a
              className="underline hover:text-[var(--text-secondary)]"
              href="https://github.com/gogoroisler/dashboard-bcra-indec-react"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
