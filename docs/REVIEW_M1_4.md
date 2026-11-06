# Auditoría de versión M1.4 — 06-nov-2026

**Fuentes verificadas:** GitHub API de `main` SHA `a9a6f3c3b6c4cfef0bf76c482ebfb2a4010a9ade`, ZIP de la misma versión proporcionado por el usuario, código original y pruebas unitarias. **No se pudo inspeccionar el HTML renderizado en la URL HTTPS pública** por conectividad restringida. Se realizó smoke en Chromium con harness offline.

| Control | Publicación original (24-oct) | Entrega preparada M1.4 |
|---|---|---|
| 3 tableros Main/Off/Flex visibles | Sí | Conservado |
| Orden manual intratier | No | Sí, drag/drop y botones |
| Guía tiers S–D + N/A arriba | No | Sí |
| Intratier en inferencia | No | Sí, 80/20 heurístico |
| Una captura idealizada | Sí | Conservado |
| Cualidades para análisis por bandas | No | Dos etiquetas curadas por subrol, sin datos inventados |
| Banda seleccionable sin tier alternativo | No | Sí, 5 bandas y 2 objetivos |
| Reglas por banda versionadas | No | JSON v0.9, hipótesis de calibración |
| Reglas hero-specific reales | No | Pendiente de datos curados por parche |
| Validar composiciones importadas | Parcial | 6 héroes únicos, slots, subrol, modelo, parche |
| Arte Lord | No | No redistribuido |
| Motores Composition/Matchup completos | No | No (sigue Alpha) |
| Pruebas JS | 20 | 49 |

**Hallazgo crítico:** un score de rank-band sin perfiles mecánicos reales sería una ficción. `profiles:{}` en `data/rank-bands.v09.json` impide publicar conclusiones no fundamentadas. Para habilitarlo, proporcionar por héroe y subrol las seis cualidades, evidencia verificable, estado curated y patchId coincidente; estas reglas siguen siendo hipótesis hasta calibración con datos reales.

**Fuera de alcance de este parche:** obtener derechos de retratos, verificar valores de TTK reales, construir un predictor de win rate, desarrollar desde cero los motores completos v0.6–v0.7, alterar el modelo personal de los usuarios, sincronización con servidor.
