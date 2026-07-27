# Uso de IA en este proyecto

Este proyecto se desarrolla usando [Claude Code](https://claude.com/claude-code) como asistente. Este documento registra **con qué criterio** se usó la herramienta — qué se delegó, qué se decidió de forma deliberada, y los momentos en que se corrigió o cuestionó el rumbo propuesto por la IA. El objetivo es que se pueda evaluar el uso de la herramienta, no solo el código resultante.

## Metodología acordada

Misma metodología que se acordó en `gestion-educativa-react`, reutilizada explícitamente para este proyecto (ítem #2 del roadmap, ver `roadmap-contexto.md`):

- Avanzar paso a paso, evaluando cada decisión antes de seguir — no generar el proyecto de una sola vez.
- Explicar el "por qué" de cualquier código o decisión no obvia, sin asumir conocimiento previo.
- Ante un error, diagnosticarlo en conjunto en vez de que la IA entregue el fix directo.
- Dejar explícitas las bifurcaciones de diseño y decidirlas en conjunto, no en silencio.
- Commits frecuentes y descriptivos como parte del proceso, no como prolijidad de último momento.
- Revisión de los archivos `.md` como paso obligatorio antes de cada push.

## Qué se delegó a la IA

- Scaffolding inicial de Vite + React + TypeScript, y setup de Tailwind CSS v4 (plugin de Vite, sin PostCSS manual).
- Verificación con `curl` de CORS y disponibilidad de las APIs del BCRA e INDEC antes de decidir la arquitectura (ver decisión 002 y 003 en `DECISIONS.md`).
- Redacción de boilerplate (`README.md`, limpieza del `App.tsx`/`index.css` de ejemplo que trae la plantilla de Vite).

## Qué se decidió de forma humana

- Nombre del repositorio y de la carpeta del proyecto (`dashboard-bcra-indec-react`, definido en `roadmap-contexto.md`).
- Alcance y prioridad del proyecto dentro del roadmap general de portfolio.
- Replicar en este proyecto la misma metodología de trabajo y documentación (`AI_USAGE.md`, `DECISIONS.md`, `BACKLOG.md`) usada en `gestion-educativa-react` — decisión tomada el 2026-07-21, antes de escribir la primera línea de código, para no repetir el error de arrancar a generar estructura sin acuerdo previo (ver corrección del 2026-06-29 en el `AI_USAGE.md` de `gestion-educativa-react`).

## Momentos en que se corrigió el rumbo propuesto por la IA

- **2026-07-27** — En `CalculadoraInflacion.tsx`, la función de cálculo podía devolver dos formas de objeto distintas: `{ coeficiente, montoAjustado }` en el caso de éxito, o `{ error }` en el caso de fallo (mes fuera de rango, etc.). La IA escribió el código que distinguía un caso del otro con el operador `in` (`'montoAjustado' in resultado`), asumiendo que TypeScript iba a "angostar" (narrow) el tipo correctamente a partir de esa comprobación. `tsc` lo rechazó: dentro del bloque que debía ser el caso exitoso, marcaba `coeficiente` como posiblemente `undefined`, es decir, no logró garantizar cuál de las dos formas tenía el objeto. El error apareció de inmediato al correr `npx tsc -b` (no quedó latente ni pasó a runtime). Se corrigió reemplazando el chequeo `in` por un **tipo discriminado** explícito, agregando un campo `ok: true | false` como discriminante:
  ```ts
  type ResultadoCalculo =
    | { ok: true; coeficiente: number; montoAjustado: number }
    | { ok: false; error: string }
  ```
  Con `ok` como campo literal (no un `boolean` genérico), TypeScript sí puede garantizar en cada rama cuál es la forma real del objeto. Este es el patrón estándar en TypeScript para "una función puede devolver un resultado exitoso O un error, con formas de datos distintas" — más confiable que intentar inferir la forma a partir de qué propiedades existen.

- **2026-07-27** — Al construir el comparador de inversión (dólar/plazo fijo), la IA reutilizó `construirIndiceEncadenado` (pensada originalmente para la inflación mensual, que trae un valor por mes) para la tasa de depósitos a 30 días — sin notar que esa serie del BCRA es **diaria**, no mensual. La función componía el factor de crecimiento mensual una vez por cada fila de la serie, es decir, ~250 veces por año (una por día hábil) en vez de 12. El resultado en pantalla para un plazo fijo a un año daba +49.228% (`$493.288` a partir de `$1.000`) — un número absurdo a simple vista para cualquier tasa de interés real. El error no lo señaló el desarrollador: lo detectó la IA misma al revisar el screenshot de la app corriendo, antes de mostrarlo como terminado. Se corrigió agregando `colapsarUltimoPorMes` (reduce cualquier serie a un punto por mes, quedándose con el último valor observado) como paso previo dentro de `construirIndiceEncadenado`, en vez de arreglar solo el llamado puntual — así la función queda protegida contra el mismo error si en el futuro se le pasa otra serie diaria. Después de la corrección, el mismo cálculo dio +34,4% para un año, un valor consistente con el nivel de tasas de interés en Argentina en ese período.
