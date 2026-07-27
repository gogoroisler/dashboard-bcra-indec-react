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

*(vacío por ahora — se completa a medida que avanza el proyecto, no se redacta retroactivamente al final)*
