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

## Instalación

Requiere **Node.js 20+**.

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

## Documentación del proyecto

- `roadmap-contexto.md` — contexto general de portfolio y prioridad de este proyecto.
- `DECISIONS.md` — decisiones técnicas con su porqué.
- `BACKLOG.md` — funcionalidades evaluadas y pospuestas.
- `AI_USAGE.md` — cómo se usó IA en el desarrollo.

---

Santiago Gonzalez · [github.com/gogoroisler](https://github.com/gogoroisler)
