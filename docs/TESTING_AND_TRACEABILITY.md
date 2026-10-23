# Estado y trazabilidad técnica — corte 2026-10-23

## Validado por tests de implementación

- `npm test`: 20 casos JavaScript en `tests/core.test.mjs` (dominio, roster, ratings/flags, N/A, multirrol, bloqueos, dominancia, inferencia por pares, borradores, referencias, composiciones y matchups desconocidos).
- `python -m unittest discover -s legacy/v0.8/tests -v`: 12 casos previos de contrato.
- `python legacy/v0.8/tools/validate.py`: schemas, fixtures y conflicto cuantificable demo.
- Prueba de humo Chromium con recursos locales interceptados: 3 subroles, catálogo de 28 personajes en Duelist (27 exclusivos más Deadpool), selección de Hela → Off DPS tier A, Likert Off-Angle 4/5, lock, sin `pageerror`.

## Estado de las vistas (no inflar conclusión)

| Función | Evidencia | Limitación |
|---|---|---|
| Rankings y editor | UI ejecutada en navegador + tests JS | Faltan pruebas multi-navegador y avatar Lord |
| Overviews | Implementación DOM y datos locales | KPIs no incluyen estadísticas reales de partida |
| Compositions | Funciones puras con tests básicos | Faltan ventanas/targets/recursos para confirmar sinergias |
| Matchups | Función pura de escenarios sin datos | No existe hoy motor completo de matchups reales |
| GitHub Pages | Archivos y rutas relativas, `.nojekyll` | Falta validación sobre URL final publicada |
| Import/Export | Implementación y test de validación del dominio | Requiere e2e y migraciones formales |

## Principales riesgos abiertos

- Vigencia y categoría exacta del roster por parche, especialmente Deadpool multirrol. Tratar `roster.reference.json` como corte editorial, no como feed en vivo.
- Derechos y disponibilidad de avatares `Lord_Icon`; no redistribuir hasta autorización.
- Capacidad real de un soporte para proveer recursos simultáneos: jamás derivar capacidad de suministro de `Healing 5/5`.
- Modelo ordinal con pocas observaciones por subrol: interpretación descriptiva, nunca validar tier real con su propio score.
- Funciones de UI con persistencia local: comprobar restauración con refresh en URL final y límites de storage.

## Documentos de decisión

`docs/Documento_Maestro_v1.0.pdf`, `ASTRA_HANDOFF.md`, `legacy/v0.8/README.md`.
