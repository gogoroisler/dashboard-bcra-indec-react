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

### 004 — El dashboard se organiza alrededor de una decisión financiera concreta, no de "mostrar variables"
**Fecha:** 2026-07-27
**Decisión:** El producto no es un monitor genérico de indicadores. El eje es una calculadora de **ajuste por inflación / poder adquisitivo** (técnica contable real: reexpresión de estados contables, RT 6 FACPCE) — el usuario ingresa un monto y una fecha pasada, y ve a cuánto equivale hoy según el índice de inflación (fuente definitiva en la decisión 005). Las variables del BCRA (tipo de cambio, tasas) se muestran como contexto complementario de la misma decisión: "si tengo $X, ¿inflación, dólar o plazo fijo?".
**Por qué:** Mostrar gráficos de variables sueltas es lo que hace cualquier tutorial de Recharts — no es un diferencial. Anclar el dashboard a un caso de uso contable real (que Santiago conoce de primera mano por su background en administración contable) responde a "por qué mostramos estas variables" con una razón de negocio genuina, no "porque hay una API pública".
**Alternativas consideradas:** dashboard de monitoreo puro (solo gráficos de variables, sin calculadora) — descartado por no diferenciarse de un ejercicio genérico; se deja como posible primera etapa técnica (ver más abajo) pero no como producto final.
**Consecuencia para el orden de trabajo:** se arranca igual por el lado técnico más simple (variables del BCRA, que tienen catálogo autodescriptivo) para establecer el patrón fetch → tipos → gráfico. Ver decisión 005: terminó alcanzando para todo el MVP.

---

### 005 — MVP construido 100% con variables del BCRA; INDEC queda pospuesto
**Fecha:** 2026-07-27
**Decisión:** Las tres calculadoras del MVP se construyen únicamente con variables del catálogo BCRA v4.0, sin consumir la API de series de INDEC en esta etapa:

| Calculadora | Variable BCRA | id |
|---|---|---|
| Ajuste por inflación / reexpresión contable | Inflación mensual | 27 |
| Comparación tipo de cambio | Tipo de cambio mayorista de referencia | 5 |
| Comparación plazo fijo | Tasa de interés de depósitos a 30 días | 12 |
| Ajuste de alquileres | Índice para Contratos de Locación (ICL) | 40 |

**Por qué:** Se verificó (`curl` contra `/estadisticas/v4.0/monetarias/{id}`) que el BCRA ya tiene series históricas completas para los cuatro usos: inflación mensual desde 1943, tipo de cambio mayorista desde 2014, e ICL actualizado a diario. No hace falta salir a buscar estos mismos datos en INDEC — sumarlo ahora no amplía el alcance definido en la decisión 004 y sí agrega complejidad (la API de series de datos.gob.ar exige conocer de antemano el ID de cada serie, sin catálogo autodescriptivo como el de BCRA).
**Alternativas consideradas:** usar el IPC de INDEC en paralelo al índice de inflación del BCRA para citar "la fuente primaria oficial" — descartado porque el id 27 del BCRA ya es la variación mensual de precios (esencialmente la misma información) y duplicar la fuente no le agrega nada al usuario del MVP.
**Nota de dominio:** el ICL (id 40) dejó de ser de uso obligatorio para contratos de alquiler nuevos desde el DNU 70/2023 (desregulación) — la feature debe rotularse como "ajuste según ICL", no como un aumento exigido por ley.
**Qué queda pendiente:** ver `BACKLOG.md` — evaluación de INDEC pospuesta hasta cerrar esta primera etapa.

---

### 006 — Calculadora de ajuste por inflación: granularidad mes/año, ambos extremos elegibles, vía índice reconstruido
**Fecha:** 2026-07-27
**Decisión:** Refina el alcance de la decisión 004. La calculadora no compara "una fecha pasada contra hoy" con fecha exacta, sino:
- **Granularidad mensual**: los selectores de fecha son de mes/año (`<input type="month">`), no fecha exacta con día — la variable 27 del BCRA solo tiene un valor por mes, un selector de día sugeriría una precisión que el dato no tiene.
- **Ambos extremos elegibles**: el usuario elige tanto el mes de origen como el mes de destino (por defecto, destino = último mes disponible, pero se puede cambiar). Caso real que motivó esto: ajustar un valor de un mes cualquiera al cierre de un ejercicio contable, que no necesariamente es "hoy".
- **Cálculo vía índice reconstruido, no suma de porcentajes**: la variable 27 da variación mensual (%), no un nivel de índice. Reconstruimos un índice encadenando esas variaciones mes a mes (base arbitraria = 100 en el primer mes disponible; la base se cancela porque el resultado usado es un cociente entre dos meses). El coeficiente de ajuste es `índice(mes destino) / índice(mes origen)` — la misma lógica que usa la técnica contable real de reexpresión (RT 6 FACPCE), que compara niveles de índice, no acumula porcentajes.
**Por qué:** Sumar porcentajes mensuales entre dos fechas da un resultado distinto (y conceptualmente incorrecto) al de comparar niveles de índice — encadenar (multiplicar factores) sí es equivalente a comparar índices y es la forma correcta de calcular inflación acumulada entre dos períodos.
**Alternativas consideradas:** fecha exacta con día (descartada, no la soporta la granularidad del dato); destino fijo = "hoy" (descartado a pedido explícito, el caso de cierre de ejercicio contable necesita un destino arbitrario).

---
