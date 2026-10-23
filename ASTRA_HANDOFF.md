# Handoff técnico a Astra — evitar reconstrucción

**Objetivo del encargo:** publicar y pulir el Builder web ya construido; no volver a diseñar metodología ni reescribir desde cero.

## Estado confirmado

- Sitio **estático ES Modules + CSS + HTML**, sin compilación, en `index.html`, `css/style.css`, `js/app.mjs`, `js/core.mjs`.
- **Cinco vistas** funcionalmente conectadas, con limitaciones explicitadas para motores avanzados.
- Vista 01 mantiene **TRES columnas visibles simultáneamente**, `Main / Off / Flex`, con `S,A,B,C,D` como FILAS de cada columna, nunca subroles mezclados como tiers. Catálogo lateral + editor contextual inferior.
- Base real de **54 héroes con Deadpool multirrol**, sin tiers ni propiedades competitivas inventadas. Los retratos son iniciales hasta disponer de archivos autorizados.
- Modelos y bloqueos independientes por `heroId × subroleId`, sin imposición 2-2-2.
- `localStorage`, exportación e importación; protección contra duplicados y datos básicos incompatibles.
- Pruebas: `npm test` (20 tests). Legado: 12 tests Python y JSON Schema originales v0.8. Captura de Chromium en `docs/app_preview.png`.

## Prioridad 0 — Repositorio / despliegue

1. Verifica que `index.html` y `.nojekyll` estén en la raíz, con rutas relativas. Si el repositorio existe, integra **sin borrar contenido del usuario**.
2. Publica la rama `main` con GitHub Pages `/(root)`; verifica HTTP 200 de `data/roster.reference.json` y `data/taxonomy.json` y que las cinco vistas funcionen en el URL final.
3. Ejecuta `npm test`; si cambias lógica, añade tests. Si GitHub Actions falla, conserva fixtures/contratos originales sin mutarlos.
4. No publiques ningún modelo personal en el repositorio público por accidente.

## Prioridad 1 — Completar la interfaz aprobada

1. Comparar con `docs/mockup_tres_subroles.png` y el documento maestro. Conservar distribución y proporciones: sidebar, tres tableros simultáneos, catálogo derecho, editor rápido inferior. **Nunca reemplazarlo por un filtro que muestre un solo subrol.**
2. Mejorar legibilidad, respuesta a tamaños estrechos y navegación por teclado. No introducir una pantalla obligatoria de 17 Likert.
3. Incorporar retratos `Lord_Icon` **solo si se autoriza y se proporcionan archivos/licencias compatibles**; usar `assets/heroes/<slug>.webp` y registrar ID en `manifest.json`. No hotlink ni scraping ciego.
4. Añadir indicadores `Pendiente`, `N/A`, `Tier bloqueado / Perfil incompleto` para cada Hero × Subrole. El bloqueo debe dejar la evaluación incompleta posible.

## Prioridad 2 — Integridad y persistencia

1. Añadir un validador exhaustivo en cliente con JSON Schema (o validación local equivalente) para modelos importados y respaldos; no incorporar servidores externos.
2. Completar **migraciones versionadas** antes de cambiar `patchId` o `schemaVersion`. El roster en `data/roster.reference.json` tiene `categories[]`, incluido Deadpool; el catálogo original v0.8 tiene una sola `category`. Diseñar esquema nuevo compatible SIN modificar retrospectivamente v0.8.
3. Permitir nombrar/revisar modelos personales, crear fork del modelo de referencia, exportar el modelo por separado y el respaldo integral. Mantener privacidad local y advertencias antes de reemplazar datos.
4. Formalizar las composiciones: hoy el editor guarda borradores `kind=composition-draft` (6 héroes sin necesidad de rankings); `toV08Composition` exporta únicamente cuando existen seis asignaciones válidas. Conservar este comportamiento.

## Prioridad 3 — Motores avanzados, únicamente con evidencia suficiente

1. Consistency Engine: robustecer advertencias para considerar condiciones no capturadas; no usarlas como prueba de verdad del meta. Mantener override consciente del usuario.
2. Priority Inference: probar robustez Leave-One-Out, manejo de correlaciones, sensibilidad y pesos descriptivos; evitar umbral estadístico 20 imposible por subrol. La función actual es exploratoria.
3. Composition Engine: implementar reglas deterministas trazables de sinergia, cobertura, economía de recursos y cadenas de win condition; vincular recursos a capacidades de fuente/ventana/objetivo **reales y revisadas por parche**. La versión actual solo muestra candidatos y dependencias compartidas, no confirmación de sinergias.
4. Matchup Engine: evaluar ambos sentidos, contramedidas compatibles, alcance, cooldowns, rutas, ventanas y contexto de mapa. **No estimar win probabilities** sin un modelo externo validado.
5. Añadir tests de regresión y procedencia para conclusiones derivadas, y no invalidar perfiles de jugador cuando cambien reglas del motor.

## Restricciones no negociables

- El **tier es humano, nunca suma de Likert**.
- `rating = sin evaluar` distinto de `not_applicable` distinto de `rated:1`.
- Casilla no seleccionada ≠ confirmación de ausencia; cuando explícitamente se evalúa usar `present/absent`.
- Un héroe puede tener Tier S en Main y C en Off sin conflicto de identidad.
- Tres columnas Main/Off/Flex **siempre visibles** dentro de una categoría, con scroll horizontal en móvil si es necesario.
- Un equipo no se descarta por distribución diferente de 2/2/2.
- Prioridad de inferencia y coherencia **por subrol y parche**; no transferir pesos automáticamente entre roles.
- Distinguir `declarado`, `derivado`, `curado`, `desconocido`; no inventar metadatos para completar huecos.
- Nada de cuentas, servicios de pago o backend en MVP; GitHub Pages y JSON import/export bastan.
- Mantener fidelidad al documento maestro y no cambiar las decisiones sin consultarlas.

## Criterios de aceptación inmediatos

- [ ] 3 subroles en paralelo, 5 tiers por tablero, drag & drop entre filas, teclado alternativo.
- [ ] Mismo héroe en dos subroles con tiers y perfiles independientes.
- [ ] Likert sugeridos = 3 por subrol; extra opcionales; sin autopuntuaciones.
- [ ] Bloquear perfil incompleto; desbloquear individual; otro subrol no se altera.
- [ ] N/A explícito no se confunde con «pendiente».
- [ ] Exportar → importar conserva contenido y estados; parche incompatible se rechaza con explicación.
- [ ] Modelo referencia read-only con fork editable.
- [ ] 6 héroes, cualquier distribución; conflictos claros o información insuficiente en vez de scoring ficticio.
- [ ] GitHub Pages sin rutas rotas en `/marvel-rivals-tier-builder/`.
- [ ] `npm test` y validadores legacy pasan.

## Resultado esperado de Astra

Entregar **código modificado mediante commits/PR en el repositorio**, URL funcional de GitHub Pages, resumen de diffs, pruebas ejecutadas, límites pendientes y decisiones que requieran aprobación. No solicitar rediseño inicial: este paquete ya incluye la base.
