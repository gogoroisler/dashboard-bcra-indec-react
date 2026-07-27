# Decisiones técnicas

Registro de decisiones de diseño relevantes, con el contexto y las alternativas consideradas. A diferencia de `BACKLOG.md` (qué pospusimos), esto documenta el "por qué" de lo que sí se construyó.

---

### 001 — Nombre del repositorio incluye el stack y las fuentes de datos
**Fecha:** 2026-07-21
**Decisión:** `dashboard-bcra-indec-react` en vez de `dashboard-economico` o `dashboard-financiero`.
**Por qué:** Mantiene la convención ya usada en `gestion-educativa-react` (nombre = dominio + stack), y en este caso además deja claro de qué fuentes públicas depende el proyecto (BCRA, INDEC), relevante porque es el diferencial del proyecto (background contable aplicado al código).

---

### 002 — Sin backend propio: consumo directo de las APIs públicas desde el frontend
**Fecha:** 2026-07-22
**Decisión:** El proyecto es un solo repo frontend (Vite + React), sin `backend/` como en `gestion-educativa-react`.
**Por qué:** Se probó con `curl` (incluyendo el header `Origin` para simular una llamada real del browser) que tanto la API del BCRA (`api.bcra.gob.ar`) como la API de series de tiempo de datos.gob.ar (fuente de datos de INDEC) responden con `Access-Control-Allow-Origin: *`. Esto significa que el navegador puede llamarlas directo, sin bloqueo de CORS. Un backend propio solo agregaría una capa sin necesidad real (no hay auth, no hay datos propios que persistir, no hay transformación compleja que no pueda hacerse en el cliente).
**Alternativas consideradas:** monorepo con backend Node/Express como proxy — descartado porque no resuelve ningún problema real hoy. Se reevaluará si en el futuro hace falta cachear datos, ocultar alguna llamada, o si alguna API cambia su política de CORS.

---

### 003 — BCRA API v4.0, no v3.0
**Fecha:** 2026-07-22
**Decisión:** Se usa `https://api.bcra.gob.ar/estadisticas/v4.0/...` para las variables monetarias.
**Por qué:** Se probó `v3.0` (versión que aparece en varios tutoriales y ejemplos existentes) y devuelve `410 Gone` — está dada de baja. `v4.0` responde `200 OK` con el mismo tipo de datos (variables monetarias: reservas, tasas, tipo de cambio, etc.) y certificado SSL válido.
**Alternativas consideradas:** ninguna — es simplemente la versión vigente de la misma API.

---
