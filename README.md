# Dashboard BCRA / INDEC

Dashboard de indicadores económicos argentinos (tipo de cambio, tasas de interés, inflación) consumiendo APIs públicas del BCRA y datos de series de tiempo de INDEC.

Proyecto de portfolio — carrera Técnico en Desarrollo de Software.

## Stack

| Capa       | Tecnología                          |
|------------|--------------------------------------|
| Frontend   | React 19 · Vite · TypeScript          |
| UI         | Tailwind CSS v4                       |
| Gráficos   | Recharts                              |
| Datos      | API BCRA v4.0 · API series de tiempo (datos.gob.ar) — sin backend propio, ver `DECISIONS.md` |

## Por qué este stack

No es una lista de tecnologías de moda — cada una responde a una necesidad concreta de este proyecto puntual:

- **TypeScript**: el proyecto vive de consumir JSON de APIs externas (BCRA, potencialmente INDEC) con estructuras anidadas no triviales (`results[0].detalle[]`, por ejemplo). Tipar esa forma una sola vez (`src/lib/bcra.ts`) hace que cualquier error de contrato — un campo mal nombrado, un `undefined` no manejado — aparezca al compilar, no en producción frente a un usuario. En una app que hace cálculos financieros (ajuste por inflación, reexpresión), ese chequeo en tiempo de compilación no es un lujo académico: un error silencioso ahí significa un número mal calculado.
- **React**: el dashboard combina varias piezas interactivas que comparten estado y se re-renderizan con datos que cambian (gráficos, calculadoras, selectores de fecha). El modelo de componentes de React es el ajuste natural para eso, y es el mismo stack ya usado en `gestion-educativa-react` — reutilizar el conocimiento adquirido ahí en vez de sumar un framework nuevo por sumar.
- **Vite**: dev server y HMR rápidos; es el estándar actual para React sin la configuración manual que pedía Create React App (ya deprecado).
- **Tailwind CSS v4**: estilos co-ubicados con el componente en vez de archivos `.css` separados que hay que mantener sincronizados; útil en un proyecto con muchas piezas visuales chicas (tarjetas de gráficos, calculadoras) más que páginas grandes.
- **Recharts**: librería de gráficos pensada para React (los charts son componentes, no imperativa por fuera de React como D3 puro), con la interactividad (tooltips, hover) que necesita un dashboard financiero ya resuelta.
- **Sin backend propio**: ver decisión 002 en `DECISIONS.md` — las APIs públicas que consumimos ya responden con CORS abierto, así que una capa de backend no resolvería ningún problema real en esta etapa.

## Instalación

Requiere **Node.js 20+**.

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

## Tests

```bash
npm test
```

Vitest cubre por ahora la lógica de cálculo en `src/lib/` (construcción de índices mensuales,
coeficiente de ajuste) — es donde ocurrió un bug real durante el desarrollo (ver `AI_USAGE.md`).
Tests de componentes quedan para una etapa posterior (ver `BACKLOG.md`).

## Documentación del proyecto

- `roadmap-contexto.md` — contexto general de portfolio y prioridad de este proyecto.
- `DECISIONS.md` — decisiones técnicas con su porqué.
- `BACKLOG.md` — funcionalidades evaluadas y pospuestas.
- `AI_USAGE.md` — cómo se usó IA en el desarrollo.

---

Santiago Gonzalez · [github.com/gogoroisler](https://github.com/gogoroisler)
