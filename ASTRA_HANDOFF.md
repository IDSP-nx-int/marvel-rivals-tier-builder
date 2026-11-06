# INSTRUCCIONES EXACTAS PARA ASTRA — M1.4

**Objetivo:** Montar el ZIP acumulativo en GitHub sin rediseñar, sin inventar perfiles mecánicos, sin modificar datos personales.

**Repo único:** `https://github.com/IDSP-nx-int/marvel-rivals-tier-builder`.
**Base esperada**: `main` SHA `a9a6f3c3b6c4cfef0bf76c482ebfb2a4010a9ade`.
**Target de publicación:** GitHub Pages `main` / `(root)`; URL `https://idsp-nx-int.github.io/marvel-rivals-tier-builder/`.

## Operación obligatoria, sin decisiones de producto

1. Confirmar SHA en repositorio: `git rev-parse HEAD`. **Si ya no es `a9a6f3c3b6c4cfef0bf76c482ebfb2a4010a9ade`, detenerse y reportar que hay cambios nuevos; no pisarlos.**
2. Trabajar en rama: `git switch -c release/m1-4-rank-band`
3. Extraer el ZIP `Marvel_Rivals_M1_4_PATCH_SOLO_CAMBIOS.zip` **en la raíz del repo, sobrescribiendo solo archivos presentes en el ZIP, sin borrar otros archivos**. `index.html` debe quedar en la raíz. No volver a aplicar M1.1, M1.2, M1.3; M1.4 ya los incluye.
4. Ejecutar en la raíz: `npm test` y confirmar **49 tests, 0 fails**. Opcional: `node --check js/app.mjs && node --check js/core.mjs && node --check js/rank-band.mjs`.
5. Verificar el diff. Solo pueden existir los cambios previstos en `MANIFEST_M1_4.json` (archivos versionados nuevos o modificados); **no borrar ni sustituir** `data/roster.reference.json`, `data/taxonomy.json`, `legacy/`, `assets/heroes/`, los modelos locales o las cinco vistas.
6. Commit y PR: `git add -A && git commit -m "feat: intra-tier ordering, tier guide and rank-band v0.9 scaffold" && git push -u origin release/m1-4-rank-band`. Crear PR hacia `main`, aprobar y fusionar tras ver tests verdes. Si Astra tiene autorización explícita para integrar directo a `main`, puede hacerlo siguiendo los controles anteriores; no forzar push.
7. Esperar a que GitHub Pages termine el deploy y comprobar manualmente URL HTTPS. Probar en incógnito con modelo ficticio de prueba; no sobreescribir datos de un usuario real.
8. Mostrar al responsable del proyecto el commit final y la URL publicada. No afirmar que el M1.4 está montado hasta comprobarlo.

## Checklist visual y funcional E2E obligatorio

- Cambiar Vanguard/Duelist/Strategist mantiene 3 tableros Main/Off/Flex simultáneos.
- Guía S/A/B/C/D visible justo arriba; detalle expandible, N/A correcto.
- Colocar dos héroes en tier A Off DPS y cambiar su orden por drag/drop y por botones. Si están bloqueados y tienen 3 Likert, el conteo de comparaciones intratier cambia sin mover su tier; otras columnas no se alteran.
- Clasificar héroe sin Likert; guardarlo; bloquearlo; recargar; sigue allí.
- Evaluación rápida contiene exactamente 3 Likert comunes + 2 **cualidades curadas de solo lectura** + vulnerabilidades/dependencias sugeridas; el resto expandible.
- Cambiar banda (5 opciones) y objetivo (climbing/progresión) no reordena ni modifica tiers. En roster real sin perfiles curados muestra "Pendiente de curación" y **no** inventa desempeño.
- Exportar JSON de prueba, reimportar y confirmar orden, locks, ratings y N/A. Para pruebas de importación maliciosa/errónea, verificar rechazo de dos héroes iguales en una composición y de slots repetidos.
- Vista 00, 02, 03 y 04 siguen navegables. Composición y matchup deben conservar aviso Alpha, sin tasas de victoria.
- Abrir en móvil: columnas en carrusel/scroll horizontal, sin superposición del sidebar sobre guía o menú.
- Consola de navegador sin excepciones; sin fallos de recursos 404 en `js/rank-band.mjs`, `data/rank-bands.v09.json` ni enlaces a V2.

## Guardrails / no hacer

- NO reconstruir usando React ni sustituir el diseño oscuro de tres tableros.
- NO modificar 17 capacidades, 9 subroles ni las tres principales por subrol.
- NO llenar a mano los 6 atributos con datos inventados o extrapolados de tiers.
- NO generar tiers automáticos por banda ni win probabilities.
- NO cambiar clave `mr_tier_builder_v1` de localStorage, `model.schemaVersion` 0.8 ni formato de respaldo.
- NO subir a GitHub respaldos personales. Exportar JSON de seguridad antes de probar importaciones en navegador real.
- NO añadir retratos Lord sin permiso y procedencia revisada.
- NO reintroducir fixture legado bloqueado por la revisión anterior.

## Entrega que Astra debe devolver

SHA del commit de fusión, enlace a CI verde, URL HTTPS verificada, capturas escritorio y móvil, tabla de checklist aprobada y cualquier incidencia exacta. No necesita proponer más diseño.
