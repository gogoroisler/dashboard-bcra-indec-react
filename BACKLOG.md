# Backlog

Funcionalidades evaluadas durante el desarrollo y pospuestas conscientemente para después del MVP. Cada entrada documenta el motivo del corte, para no perder el razonamiento de la decisión.

## Post-MVP

- **Sumar RIPTE como método comparativo en la sección salarial.** La sección de evolución salarial usa el Índice de Salarios de INDEC (ver decisión 008 en `DECISIONS.md`). RIPTE (Remuneración Imponible Promedio de los Trabajadores Estables) es otra referencia salarial muy usada en Argentina en la práctica — se usa habitualmente para ajustar cuotas de juicios laborales y algunos contratos de alquiler — pero la publica la Secretaría de Seguridad Social (ANSES), no INDEC ni BCRA. Mismo tratamiento que se le dio al IPCBA como alternativa de inflación: queda pospuesto como una segunda referencia posible, no como reemplazo. Pendiente antes de implementar: confirmar si la Secretaría de Seguridad Social publica RIPTE en datos.gob.ar con un ID de serie consultable (no se investigó todavía, a diferencia de IPCBA que ya se verificó funcionando). *(evaluado: 2026-07-27)*
