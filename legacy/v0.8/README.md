# Marvel Rivals Composition-Aware Tier Builder — contrato JSON v0.8.0

**Estado:** prototipo de contrato con catálogos, personajes y escenarios **100 % ficticios**. No contiene el roster real ni evaluaciones del meta. Esta entrega especifica datos y valida contratos: no implementa todavía la web ni ejecuta el motor completo de combate.

## Estructura del paquete

```text
schemas/
  catalog.schema.json        Catálogo del parche, héroes, 17 capacidades, 9 subroles, restricciones y mecanismos
  model.schema.json          Modelo personal/referencia y asignaciones Hero × Subrole
  composition.schema.json    Seis héroes, trabajos, planes y demandas de recursos
  matchup.schema.json        Comparación contextual de dos composiciones
  rulepack.schema.json       Reglas declarativas y recursos explícitos
  report.schema.json         Hallazgos derivados, trazabilidad y limitaciones

data/
  catalog.demo.json          12 héroes ficticios, 9 subroles, 17 capacidades
  rulepack.demo.json         Reglas y disponibilidad de recursos ficticios

examples/
  model.reference.demo.json  Snapshot editorial de muestra (solo lectura por política de app)
  model.personal.demo.json   Fork personal de muestra; 13 asignaciones para 12 héroes
  composition.brawl.demo.json
  composition.dive.demo.json
  composition.conflict.demo.json
  matchup.brawl-vs-dive.demo.json
  report.brawl-vs-dive.demo.json

tools/validate.py             Validación JSON Schema + integridad referencial
tests/test_contracts.py          12 pruebas positivas/negativas
```

## Decisiones vinculantes

1. **Identidad primaria:** la posición del tier corresponde a `heroId + subroleId + modelId + patchId`. Un mismo héroe puede pertenecer a Main y Off independientemente; no puede duplicarse el mismo par dentro de un modelo.
2. **Un modelo, un parche:** el `patchId` es común a catálogo, modelo, composiciones, matchup y reglas. Actualizar el parche requiere crear un modelo/snapshot de revisión, no reinterpretar silenciosamente perfiles antiguos.
3. **Roles:** la categoría oficial (`vanguard`, `duelist`, `strategist`) establece los tres subroles compatibles; no se fuerza la distribución 2-2-2 en composiciones de seis.
4. **Tier vs perfil:** tier `S/A/B/C/D` siempre es una clasificación declarada por la persona; `locked: true` puede coexistir con un perfil funcional incompleto.
5. **N/A y pendiente:** `eligibilityOverrides: ineligible` significa N/A declarado. No existir una asignación ni una exclusión explícita significa **pendiente/desconocido**, no D ni N/A. `eligible` puede registrarse para expresar elegibilidad aún sin rankear.
6. **Likert:** `ratings[capabilityId] = {"state":"rated","score":1..5}`; `{ "state":"not_applicable" }` es diferente de desconocido; la **ausencia de la clave** indica que no se evaluó.
7. **Casillas:** `vulnerabilities` y `dependencies` son mapas con estados explícitos `present` o `absent`. La **ausencia de la clave** significa desconocido. Lista/mapa vacío no garantiza inexistencia.
8. **Captura contextual:** `subroles[].coreCapabilities` define exactamente tres capacidades sugeridas comunes por subrol. Capacidades adicionales son opcionales, nunca sumadas automáticamente a tiers.
9. **Bloqueo:** solo la aplicación autoriza edición/desbloqueo. Un modelo `origin: reference` debe tratarse como read-only desde la UI; un modelo `personal` puede editarse. El JSON Schema no puede imponer permisos de ejecución por sí mismo.
10. **Recursos:** la disponibilidad de un recurso se declara por reglas/metadata independientes del Likert. `Healing 5/5` NO se convierte en cinco puntos de atención; `resourcePools.capacity` expresa unidades explícitas del escenario.
11. **Sinergia:** las reglas `requiresSameWindow` y `requiresCompatibleTarget` son condiciones obligatorias para confirmar la interacción. Este contrato **no incluye todavía** la base de datos real de alcances, tiempos ni objetivos; sin esos datos, informar `insufficient-data`.
12. **Reportes:** resultados derivados llevan `engineVersion`, `rulepackId`, `modelRevision`, evidencia y limitaciones. No alteran los tiers y deben invalidarse al cambiar cualquiera de las entradas.
13. **Confianza estadística:** los pesos inferidos son explicaciones exploratorias, no probabilidades de victoria. Los informes pueden incluir esos hallazgos en una revisión futura con esquema propio.

## Ejemplo de Hero × Subrole

```json
{
  "id": "assign.garra.off-dps",
  "heroId": "hero.garra",
  "subroleId": "subrole.off-dps",
  "tier": "B",
  "locked": true,
  "lockedAt": "2026-10-23T10:00:00-06:00",
  "ratings": {
    "cap.off-angle-pressure": { "state": "rated", "score": 3 },
    "cap.effective-uptime": { "state": "not_applicable" }
  },
  "vulnerabilities": {},
  "dependencies": {},
  "authoredBy": "player"
}
```

La falta de `cap.kill-conversion` significa **sin evaluar**. Es un ejemplo deliberadamente incompleto; el tier puede seguir bloqueado.

## Validar los datos

```bash
pip install jsonschema
python tools/validate.py
python -m unittest discover -s tests -v
```

El validador comprueba el esquema formal y luego las referencias cruzadas: IDs duplicados, categoría/subrol, catálogos, perfiles, elegibilidad, seis héroes diferentes, referencias de planes, recursos, revisión/parche, matchup y evidencias. El script reporta los conflictos cuantificables de recursos sin considerarlos errores de estructura: precisamente son condiciones que el Composition Engine debe diagnosticar.

### Resultado verificado del ejemplo

- 12 héroes ficticios, 9 subroles y 17 capacidades.
- 13 asignaciones (incluida la segunda evaluación independiente de Garra).
- 3 composiciones; una contiene conflicto: demanda 2, capacidad 1, mismo recurso/ventana.
- 1 reporte con procedencia `derived` y limitación explícita.
- 12 pruebas unitarias superadas.

## GitHub Pages y almacenamiento local

La implementación web prevista será estática. Los JSON de catálogo y reglas podrán servirse desde el propio repositorio. Los modelos personalizados vivirán en almacenamiento local del navegador y podrán exportarse/importarse como archivos JSON. **No hay sincronización entre dispositivos ni respaldo automático**: el usuario deberá exportar su modelo para preservarlo o transferirlo. La persistencia y validación en navegador forman parte de v1.0.

## Pendientes deliberados para v1.0

- Reemplazar héroes ficticios por roster real y metadatos curados por parche.
- Modelar alcances, ventanas, destinatarios, Team-Ups, efectos y rutas de ejecución reales antes de declarar una sinergia confirmada.
- Implementar motor de interpretación de reglas, comprobaciones de compatibilidad e interfaz de las cinco vistas.
- Implementar controles de importación/exportación, bloqueo y migraciones entre versiones de esquema.
- Aplicar hash de entradas e invalidación de reportes cacheados. `modelRevision` y `engineVersion` dan una primera protección, no una garantía criptográfica.
- Resolver el alcance de los perfiles y capacidad de recursos cuando cambian héroes, Team-Ups o reglas del parche.

**No se ha supuesto que el JSON, por sí solo, pueda ejecutar el motor de v0.6/v0.7.** Es el contrato sobre el cual escribiremos las funciones JavaScript.
