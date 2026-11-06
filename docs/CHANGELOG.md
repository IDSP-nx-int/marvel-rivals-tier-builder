## M1.4 — 2026-11-06 — Preparado, pendiente de desplegar

- Basado en `main` SHA `a9a6f3c3b6c4cfef0bf76c482ebfb2a4010a9ade` (2026-10-24); revisión previa y paquete acumulativo M1.1–M1.4.
- M1.1: drag/drop y orden de héroes dentro de un tier, con botones alternativos.
- M1.2: guía de tiers S–D + N/A sobre los tres tableros.
- M1.3: Priority Engine considera orden intratier (ponderación heurística 80/20), sin modificar tiers.
- M1.4: selector de bandas y objetivos para analizar un solo modelo idealizado; rulepack externo v0.9 con hipótesis no validadas y seis cualidades curadas. Dos cualidades relevantes se muestran en la evaluación rápida de cada subrol. Sin perfiles mecánicos reales: no hay conclusiones de climbing para héroes.
- M1.4: validación compartida para composiciones de seis héroes únicos al guardar e importar, incluidas referencias y plazas.
- M1.4: corrección CSS móvil para evitar que la marca del sidebar invada la guía de tiers.
- 49 pruebas automatizadas JS aprobadas; smoke DOM en Chromium sin red aprobado. No se verificó HTTPS/GitHub Pages desde el contenedor.

## M1.3 — 2026-10-24

- Priority Inference incorpora orden de izquierda a derecha dentro de un mismo tier como señal secundaria.
- Sólo pares de perfiles bloqueados con los 3 Likert comunes; las preferencias entre tiers conservan peso principal (80 %) frente al intratier (20 %).
- `inferPriorities` expone `withinPairs`, métricas `intraAgree`/`intraDisagree` y `blendedConcordance`; UI muestra el origen de la evidencia.
- Sin cambios de contrato v0.8, tiers, perfiles, bloqueos ni Composition/Matchup Engines.
- Añadidas seis pruebas de regresión para el nuevo comportamiento.

# Changelog

## 1.0.0-alpha.1 — 2026-10-23

- Implementación estática base con cinco vistas y tres tableros simultáneos.
- Roster de 54 identidades, incluyendo héroe multirrol sin atribuir tier.
- Escala Likert contextual, criterios comunes por subrol, campos opcionales y flags ternarios.
- Modelos personales editables, referencia read-only y fork, N/A explícito, bloqueo independiente.
- Análisis exploratorio de prioridades; detección de discrepancias de dominancia con override.
- Composition Builder de seis plazas con inferencias conservadoras y borradores separados del contrato v0.8.
- Matchup bidireccional exploratorio sin win probabilities.
- Respaldo/importación JSON, persistencia local, tests y especificación para Astra.

## Pendientes

- Arte autorizado, habilidades/versiones de patch, engine completo v0.6–v0.7, migraciones y QA en GitHub Pages.
