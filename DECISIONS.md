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

### 007 — El producto se divide en dos secciones: decisión de inversión y evolución salarial
**Fecha:** 2026-07-27
**Decisión:** Lo que parecía una sola calculadora en realidad responde dos preguntas distintas, con forma de entrada distinta:
- **Decisión de inversión** ("tenía $X en fecha A, ¿qué me convenía hacer con eso para fecha B?"): un solo monto, se compara contra varios caminos hipotéticos — quedarse en pesos (inflación, ya construido), convertir a dólares (tipo de cambio mayorista, id 5), plazo fijo (tasa de depósitos a 30 días, id 12).
- **Evolución salarial** ("gané $X en fecha A y ahora gano $Y en fecha B, ¿le gané a la inflación?"): **dos montos reales** (sueldo antiguo y sueldo actual), la pregunta es la diferencia entre el sueldo actual y lo que haría falta ganar para no perder poder adquisitivo.
Ambas secciones conviven en el mismo dashboard (no son proyectos separados) porque comparten toda la infraestructura ya construida (fetch, construcción de índice, formato de moneda).
**Por qué:** Forzar las dos preguntas en una sola UI (monto único + dos fechas) responde bien a la primera pregunta pero mal a la segunda — la evolución salarial necesita dos montos reales, no una proyección hipotética de uno solo. Separarlas es más correcto que generalizar de más una sola calculadora.
**Alternativas consideradas:** una sola calculadora genérica "ajustá cualquier monto" — descartada porque no puede expresar la pregunta salarial (comparar un valor real contra otro valor real) sin una segunda entrada de monto, momento en el que ya es, en los hechos, una calculadora distinta.

---

### 008 — Fuente de la sección salarial: Índice de Salarios de INDEC, no RIPTE
**Fecha:** 2026-07-27
**Decisión:** La sección de evolución salarial usa el **Índice de Salarios** de INDEC (serie `149.1_TL_INDIIOS_OCTU_0_21`, base octubre 2016=100, vía la API de series de datos.gob.ar — mismo mecanismo verificado para IPCBA en el BACKLOG). Es un índice de nivel, no requiere reconstrucción por encadenado.
**Por qué:** A diferencia del intento anterior de sumar el IPC de INDEC en paralelo al del BCRA (descartado en la decisión 005 por ser información duplicada), acá INDEC aporta algo que el BCRA no publica en absoluto: evolución de remuneraciones. Es la primera razón genuina para consumir INDEC en este proyecto, coherente con el nombre del repositorio.
**Alternativas consideradas:** RIPTE (Remuneración Imponible Promedio de los Trabajadores Estables) — es una referencia salarial muy usada en Argentina (ajuste de alquileres, juicios laborales), pero la publica la Secretaría de Seguridad Social, no INDEC ni BCRA. Se pospone como método comparativo en `BACKLOG.md`, mismo tratamiento que se le dio al IPCBA como alternativa de inflación.

---

### 009 — Vitest para la lógica pura de `src/lib/`, no para componentes todavía
**Fecha:** 2026-07-27
**Decisión:** Se suma Vitest (configurado en `vite.config.ts` vía `defineConfig` de `vitest/config`, entorno `node`) con una primera suite en `src/lib/indices.test.ts`, cubriendo `construirIndiceEncadenado`, `construirIndiceDesdeNivel`, `colapsarUltimoPorMes` y `calcularCoeficiente`. Tests de componentes React (interacción de usuario, casos de error en pantalla) quedan pospuestos.
**Por qué:** Hasta este punto, la única verificación era manual — `tsc` para tipos y capturas de pantalla con Chrome headless para ver la app corriendo. Nada de eso queda guardado corriendo de nuevo mañana. Se priorizó `src/lib/` porque ahí ocurrió esta misma sesión el bug real de compounding (serie diaria tratada como mensual, ver `AI_USAGE.md`) — mismo criterio que ya se usó en `gestion-educativa-react` (decisión 026: testear donde de verdad aparecen los bugs, no por cobertura). Uno de los tests nuevos es explícitamente una prueba de regresión de ese bug puntual.
**Alternativas consideradas:** empezar por tests de componentes con React Testing Library — pospuesto porque hoy no hay manejo de errores complejo en la UI que lo justifique; se retoma cuando se ataque esa parte (ver `BACKLOG.md`).

---

### 010 — Deploy a GitHub Pages vía GitHub Actions, no build manual
**Fecha:** 2026-07-28
**Decisión:** Se agrega `.github/workflows/deploy.yml`: en cada push a `main`, corre `npm ci && npm run build` y publica `dist/` a GitHub Pages con `actions/upload-pages-artifact` + `actions/deploy-pages`. Además, `vite.config.ts` fija `base: '/dashboard-bcra-indec-react/'`.
**Por qué:** El deploy anterior (ver entrada del 2026-07-27 en `BACKLOG.md`) mostraba la página en blanco por dos motivos: Pages publicaba el código fuente sin buildear (`<script src="/src/main.tsx">`, que ningún navegador ejecuta), y aunque se buildeara, Vite generaba rutas absolutas desde la raíz del dominio en vez de considerar el subpath del proyecto. El workflow resuelve el primer problema (siempre se publica el build, nunca el código fuente) y el `base` resuelve el segundo. Requiere un paso manual único: cambiar la fuente de Pages a "GitHub Actions" en Settings → Pages del repositorio (no se puede hacer por API sin autenticación).
**Alternativas consideradas:** buildear localmente y pushear `dist/` a una rama `gh-pages` (con la librería `gh-pages` de npm, o a mano) — descartado porque depende de acordarse de buildear antes de cada publicación; el workflow lo hace solo y no puede quedar desincronizado de `main`.

---

### 011 — IPCBA como segunda referencia dentro de "Quedarte en pesos", no como tarjeta aparte
**Fecha:** 2026-08-06
**Decisión:** El IPCBA (backlog previo, serie `193.2_NIVEL_GENERAL_2021_0_13_2`) se muestra como un segundo resultado dentro de la misma tarjeta "Quedarte en pesos" de `ComparadorInversion` — inflación nacional (BCRA) e IPCBA (CABA) lado a lado, no una cuarta tarjeta separada.
**Por qué:** Las dos cifras responden la misma pregunta ("si te quedabas en pesos, cuánto necesitabas") con dos fuentes distintas — agruparlas mantiene la comparación principal en tres opciones (pesos / dólar / plazo fijo) en vez de diluirla en cuatro, y dejan clara la relación entre ambas cifras (dos respuestas a la misma pregunta) en vez de sugerir que son opciones distintas entre sí.
**Alternativas consideradas:** tarjeta separada para IPCBA — descartada por el motivo anterior.

---

### 012 — Se reincorpora el ajuste de alquileres por ICL, que había quedado afuera sin decisión explícita
**Fecha:** 2026-08-06
**Decisión:** Se agrega una tercera sección al dashboard, ajuste de alquileres según el ICL del BCRA (`idVariable` 40, ya definido en `VARIABLES_BCRA` desde la decisión 005 pero nunca usado). Mismo patrón que las secciones existentes: monto (alquiler) + mes de origen + mes de destino → alquiler ajustado, vía `construirIndiceDesdeNivel` (el ICL ya es un índice de nivel, no requiere reconstrucción).
**Por qué:** Estaba en el alcance original del MVP (decisión 005, tabla de las cuatro calculadoras) pero se perdió en el camino cuando el producto se redefinió en dos secciones (decisión 007), que no lo mencionó ni para incluirlo ni para descartarlo explícitamente — fue un olvido, no un corte consciente. Se detectó al pedido de Santiago, no por revisión propia.
**Nota de dominio:** recordar el rótulo "ajuste según ICL" y no "aumento exigido por ley", ya documentado en la decisión 005 (el ICL dejó de ser obligatorio desde el DNU 70/2023).

---

### 013 — Gráfico de evolución punta a punta para el ajuste por inflación, con granularidad variable
**Fecha:** 2026-08-06
**Decisión:** La tarjeta de inflación en `ComparadorInversion` suma un gráfico de línea mostrando el monto ajustado en los puntos intermedios entre el mes de origen y el mes de destino, no solo el resultado final. Regla de granularidad: si la diferencia entre ambos meses es de **3 años o más**, un punto por año usando el mismo mes calendario que el origen/destino (ej. origen=marzo 2020, destino=marzo 2026 → un punto cada marzo); si es **menor a 3 años**, un punto por mes. Por ahora se implementa solo para inflación — no para dólar, plazo fijo ni alquileres — aunque el mecanismo (mismo índice mensual ya construido) es reutilizable para los otros tres sin rehacer nada.
**Por qué:** Con rangos largos (décadas), un punto por mes generaría cientos de puntos y un gráfico ilegible; con rangos cortos, un punto por año sería demasiado poco detalle (¿3 puntos para 2 años?). La regla de 3 años balancea ambos casos. Se prioriza inflación primero porque fue el pedido explícito — el resto queda pospuesto, no descartado.
**Alternativas consideradas:** granularidad fija (siempre mensual o siempre anual) — descartada por no servir bien en ambos extremos del rango de fechas que soporta la calculadora (desde 1943).

---

### 014 — Paginar las series del BCRA en vez de pedir un único `limit: 3000`
**Fecha:** 2026-08-06
**Decisión:** Se agrega `fetchSerieMonetariaCompleta` en `src/lib/bcra.ts`, que pagina con el parámetro `offset` hasta traer todo el historial disponible de una variable, en vez de un solo pedido con `limit: 3000`. `ComparadorInversion`, `EvolucionSalarial` y `AjusteAlquileres` pasan a usarla para inflación, tipo de cambio, tasa de depósitos e ICL. `TipoCambioChart` sigue usando `fetchSerieMonetaria` con `limit: 180` sin cambios — a propósito solo quiere los últimos 180 días para el gráfico, no el historial completo.
**Por qué:** Santiago notó que no podía ver información más atrás de ~2010 para tipo de cambio y tasa de depósitos. Al revisar el catálogo del BCRA (campo `primerFechaInformada`), la variable de tipo de cambio mayorista en realidad tiene datos desde **2002-03-04** (5986 registros) y la tasa de depósitos desde **1985-08-26** (9586 registros) — muy por encima del tope de 3000 registros por request de la API. Como `fetchSerieMonetaria` solo pedía una página, nos quedábamos en silencio con los ~3000 registros más recientes de cada serie (≈2014 en adelante) sin ningún error ni aviso — el código nunca falló, simplemente devolvía menos historia de la que existe. No fue detectado por revisión propia ni por un test (nada de lo que probamos manualmente necesitaba fechas tan viejas) — lo encontró Santiago al intentar elegir una fecha anterior a 2010.
**Alternativas consideradas:** subir el `limit` — no es posible, la API lo rechaza con `400` por encima de 3000 (es un tope real, no una elección nuestra). Usar `desde`/`hasta` apuntando a `primerFechaInformada` del catálogo en vez de paginar con `offset` — descartado porque agrega una llamada extra al catálogo sin necesidad: paginar hasta recibir una página más corta que el límite ya detecta el final de los datos por sí solo.

---
