# Contexto de desarrollador y roadmap de proyectos — Santiago Gonzalez

## Perfil

**Nombre:** Santiago Gonzalez  
**GitHub:** [gogoroisler](https://github.com/gogoroisler)  
**Email:** santiago.gonzalez.roisler@gmail.com  
**LinkedIn:** linkedin.com/in/santiago-gonzalez-roisler  
**Ubicación:** Buenos Aires, Argentina

Desarrollador de software en formación. Estudiante de Tecnicatura Superior en Desarrollo de Software en IFTS Nº18 (2022–2026, en curso). Background previo en **administración contable** (autónomo desde 2018) y **docencia** esporádica (clases particulares y ayudantía en IFTS Nº18). Perfil híbrido: entiende el contexto de negocio y el dominio de los problemas que resuelve, no solo el código.

**Stack principal:** Python · Django · HTML · CSS · JavaScript · Node.js · React · SQL (MySQL / SQLite) · Git · Tailwind CSS  
**Conocimiento básico:** TypeScript · Angular · Java · Testing (Vitest · Supertest)  
**Inglés:** B1.2 MCER

**Intereses personales relevantes:** videojuegos (MTG Commander), boxeo, fotografía, literatura, cine, música. Tiene **diabetes tipo 2** — condición que abre una oportunidad de proyecto con dominio personal auténtico.

---

## Portfolio actual (live)

**URL:** https://gogoroisler.github.io/CV-Portfolio/  
**Repo:** https://github.com/gogoroisler/CV-Portfolio  
**Stack:** HTML + CSS + JS · Tailwind CDN (solo cards) · Font Awesome · Web3Forms  

Proyectos incluidos actualmente:

| Proyecto | Stack | Estado |
|---|---|---|
| Gestión Educativa | React + Node.js + JWT + SQLite + Vitest | Solo repo, sin deploy |
| Gestión de Consorcios | Python + Django + Tailwind + SQLite | Solo repo |
| Obras Públicas CABA | Python + POO + Peewee ORM + SQLite | Solo repo |
| Calculadora Web | JS + ES Modules + Vitest + localStorage | Live en GitHub Pages |
| CRUD Los Simpsons | Node.js + Express + Vitest + Supertest | Solo repo |
| App Clima | JS + OpenWeather API + Geolocalización | Live en GitHub Pages |

---

## Criterios para el roadmap

- **No repetir proyectos tipo:** ya tiene 2 CRUDs y 2 apps vanilla JS. Los próximos proyectos deben agregar tecnologías o dominios nuevos.
- **TypeScript no es un proyecto separado:** usarlo directamente en los proyectos React (Vite lo incluye por default). No hace falta un proyecto "de TypeScript" sin otro propósito.
- **Java y Angular fuera del roadmap de proyectos:** mencionarlos en skills está bien, pero no dedicarles proyectos. El stack web actual es más coherente sin ellos.
- **Python ya está cubierto:** Django (Consorcios) + POO/ORM (Obras Públicas). No se necesitan más proyectos Python salvo que apunte a data science, que no es el caso.
- **El background contable y de salud son diferenciales reales:** proyectos en esos dominios tienen autoridad genuina y se notan.

---

## Roadmap de proyectos

### 1. Deploy de Gestión Educativa
**Prioridad: inmediata — mayor ROI, menor esfuerzo**

El proyecto más complejo del portfolio no tiene demo live. Un reclutador que no puede probarlo lo descarta.

- Backend en **Render** (gratis), frontend en **Vercel** o **Netlify**
- Necesita un **seed script** con datos de prueba: usuarios demo (admin + alumnos), comisiones, materias y datos de riesgo académico. Sin datos cargados la app se ve vacía.
- No es un proyecto nuevo, es elevar el existente al nivel que merece.

---

### 2. Dashboard con APIs argentinas (BCRA + INDEC)
**Stack: React + Vite + TypeScript + Recharts + Tailwind**

Diferencial: background contable aplicado al código. Nadie más en su cohorte lo tiene.

- Consumir APIs del **BCRA** (tipo de cambio, tasas de interés) e **INDEC** (inflación, IPC)
- Visualización de datos con **Recharts**: gráficos de evolución temporal, comparativas
- Puede incluir calculadora de inflación o conversor histórico de moneda
- Posiciona para roles en fintech, banca, startups de economía argentina
- Primer proyecto en TypeScript real (aunque sea sin mencionarlo como objetivo)

---

### 3. App de gestión de diabetes tipo 2
**Stack: React + Vite + TypeScript + Node.js/Express + SQLite/PostgreSQL**

El más diferenciador del roadmap. Dominio personal auténtico + health tech en crecimiento.

Funcionalidades sugeridas:
- Registro de glucemia con fecha/hora y contexto (ayuno, postprandial)
- Gráfico de evolución de glucosa (Recharts)
- Calculadora de carga glucémica por comida
- Estimador de HbA1c basado en registros
- Exportación de datos para médico (CSV o PDF)
- Autenticación con JWT (reutilizar patrón de Gestión Educativa)

Health tech es un sector que contrata. Un proyecto así abre puertas que un CRUD genérico no abre.

---

### 4. Portfolio en React/Vite (reemplaza el actual)
**Stack: React + Vite + TypeScript + Tailwind v4 + Framer Motion + shadcn/ui**

El portfolio actual (HTML puro) queda disonante con el stack de los proyectos que muestra. El nuevo portfolio se convierte en proyecto en sí mismo.

- Arrancar de cero con `npm create vite@latest` (no migrar el HTML actual)
- El portfolio actual queda live durante el desarrollo
- Todo el contenido ya está definido (secciones, copy, proyectos, colores)
- Paleta: teal `#1CB698`, fondos `#1e2326` / `#252A2E`
- Formulario: Web3Forms, access key `6a7f15ef-46fa-4e45-9b74-c1b8f42a2503`
- Animaciones de entrada con Framer Motion, layout animations para filtros de portfolio

---

### 5. App companion para Commander (MTG) — proyecto a futuro
**Stack: React + Vite + TypeScript + Node.js + Socket.io + Scryfall API**

Para 4 jugadores en diferentes computadoras. **No** es un juego digital completo (eso requeriría años y un equipo). Es una app companion para partidas con cartas físicas:

- **Deck builder** con validación de reglas Commander:
  - Singleton (no repetidos salvo tierras básicas)
  - 100 cartas exactas
  - Validación de color identity del comandante (via Scryfall API)
  - Legalidad en formato Commander
- **Sala de juego en tiempo real** (WebSockets con Socket.io):
  - Tracker de vida (40 iniciales por jugador)
  - Tracker de daño de comandante (21 de un mismo comandante = eliminado)
  - Contador de veneno (10 = eliminado)
  - Impuesto de comandante (2 adicionales por recasts)
  - Zona de comando visible por todos

Agrega **WebSockets** al portfolio — tecnología de tiempo real que todavía no aparece en ningún proyecto. Hacerlo después de dominar bien React y TypeScript con los proyectos anteriores.

---

## Resumen del roadmap

| # | Proyecto | Tecnologías nuevas que agrega |
|---|---|---|
| 1 | Deploy Gestión Educativa | Deploy fullstack (Render + Vercel) |
| 2 | Dashboard BCRA/INDEC | TypeScript, Recharts, APIs externas |
| 3 | App diabetes | Health tech, dominio personal, fullstack TS |
| 4 | Portfolio en React/Vite | React, Framer Motion, shadcn/ui, Tailwind v4 |
| 5 | MTG Commander companion | WebSockets, real-time multiplayer |
