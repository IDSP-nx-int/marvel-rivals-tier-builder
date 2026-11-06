# Curación de cualidades de banda v0.9

## Regla de procedencia

Sin evidencia por héroe/subrol/parche, no se debe atribuir una puntuación. El `data/rank-bands.v09.json` publicado deja `profiles: {}` intencionadamente. Las bandas y pesos iniciales son **hipótesis del diseño**, no una estadística publicada del juego.

Para incorporar un perfil en un parche validado, usar la clave `hero.id|subrole.id`, un registro con `status: "curated"`, `patchId` igual al catálogo, seis `qualities` de 1..5 y `evidence` con referencias verificables. **El ejemplo siguiente es sintético y solo ilustra la estructura, no debe copiarse al archivo de producción:**

```json
{
  "hero.fictitious|subrole.off-dps": {
    "status": "curated",
    "patchId": "patch.roster.2026-10-reference",
    "qualities": {
      "effective-ttk": 4,
      "conversion-reliability": 4,
      "independent-agency": 3,
      "counterplay-sensitivity": 2,
      "punish-exposure": 3,
      "skill-scalability": 5
    },
    "evidence": ["EJEMPLO SINTÉTICO, reemplazar por fuentes reales"]
  }
}
```

El motor nunca mezcla parches. Las cualidades 1–5 son apreciaciones ordinales de desempeño bajo condiciones comparables y **no equivalen a mediciones precisas de TTK**; las dos mostradas en UI son solo destacadas. No se cargan como Likert del usuario.

Para calibración posterior: comprobar hipótesis de bandas con replay/VOD, calidad de respuestas rivales, rutas, acceso a objetivos, datos por banda cuando existan, y registrar fecha, fuente, sesgos y revisión. No equiparar win rate agregado a causalidad de una mecánica. La ponderación usada es exploratoria, no una validación de valores competitivos.
