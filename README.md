# Marvel Rivals — Composition-Aware Tier Builder

**Estado: alpha funcional, no producción.** Proyecto de comunidad independiente. Modelo de conocimiento: Hero × Subrole × Model × Patch. El usuario define los tiers; la aplicación no inventa rankings, probabilidades de victoria ni habilidades no evaluadas.

## Inicio rápido

1. Extrae el paquete y coloca **el contenido de esta carpeta en la raíz del repositorio** (`index.html` debe quedar en la raíz).
2. Para ver en local: `python -m http.server 8000`, visita `http://localhost:8000/`. No abras `index.html` directamente como `file://`, porque `fetch` de JSON requiere HTTP.
3. En GitHub: **Settings → Pages → Deploy from a branch → main → /(root) → Save**. El archivo `.nojekyll` evita el procesamiento de Jekyll.
4. Corre `npm test`. Solo requiere Node.js >=20; la aplicación web no necesita npm ni servidor.
5. Exporta el respaldo JSON antes de limpiar el almacenamiento del navegador.

## Qué está implementado

| Vista | Estado | Funcionalidad |
|---|---|---|
| 00 Overview | Funcional | Estadísticas locales de asignaciones, bloqueos, perfiles completos y composiciones |
| 01 Rankings | Funcional | **Tres subroles simultáneos** por categoría oficial; catálogo lateral; búsqueda; drag-and-drop y click; S–D independientes por Hero × Subrole; N/A; editor contextual de 3 Likert; capacidades extra; vulnerabilidades/dependencias ternarias; notas, confianza y bloqueo |
| 02 Composition | Alpha funcional | Selección de 6 héroes únicos y subroles compatibles sin 2–2–2 obligatorio; guardado de borradores; cobertura declarada, win conditions potenciales, dependencia compartida exploratoria |
| 03 Matchup | Alpha limitado | Comparación bidireccional de dos composiciones guardadas; no genera predicciones ni contramedidas confirmadas sin datos suficientes |
| 04 Reglas | Funcional | Metodología, advertencias y pendientes; crear modelo vacío o fork de referencia importada |
| Import/Export | Funcional básico | Modelo v0.8 o respaldo completo; validación lógica básica y rechazo de parche incompatible; localStorage |
| Inferencia | Exploratoria | Concordancia por pares en perfiles bloqueados; ponderaciones exponenciales descriptivas solo con diversidad mínima; advertencia de dominancia por pares y confirmación manual |

## Qué NO se ha implementado como producto terminado

- Retratos **Lord** (el repositorio intencionalmente no redistribuye arte externo sin permiso). Se incluyen iniciales legibles y un `manifest.json` para agregar imágenes locales autorizadas.
- Metadatos reales de habilidades, Team-Ups, alcances, ventanas, objetivos, cooldowns y capacidad cuantificada de recursos, versionados por parche.
- Motor de sinergias confirmado por datos reales. La comparación actual es deliberadamente conservadora: desconocido **no significa ausente**.
- Un validador JSON Schema completo en navegador. El import actual realiza verificaciones estructurales y de referencia esenciales; los esquemas originales v0.8 se validan con Python en CI.
- Cambios de parche automáticos, migración semántica, backups entre dispositivos, multiusuario o backend.
- Pruebas e2e con HTTPS/GitHub Pages: el flujo de interfaz fue probado en Chromium en una página local con recursos simulados; verificar el sitio desplegado antes de anunciarlo públicamente.

## Contratos y procedencia

- `data/roster.reference.json`: **54 héroes** de referencia al 23-oct-2026. Deadpool tiene participación multirrol y aparece en las tres categorías. Ningún tier ni kit se atribuye automáticamente. Revalidar con el juego al cambiar el parche.
- `data/taxonomy.json`: 9 subroles, 17 capacidades, tres Likert sugeridos por subrol y conjuntos de casillas de la entrega v0.8.
- `legacy/v0.8/`: **contrato original sin reemplazar silenciosamente**. Incluye esquemas, fixtures y 12 pruebas Python. Las reglas de composición aún requieren evolución de contrato.
- `docs/Documento_Maestro_v1.0.pdf`: línea base de decisiones y trazabilidad.
- `docs/mockup_tres_subroles.png`: referencia estética, no una fuente de rankings reales.

### Distinción composición: borrador vs contrato v0.8

El contrato `composition.schema.json` v0.8 exige 6 `assignmentId`, es decir, seis perfiles Hero × Subrole registrados. Sin embargo, el usuario debe poder bosquejar una composición **antes** de rankear héroes. Por eso la UI conserva los borradores con `kind: composition-draft`, `schemaVersion: 1.0.0`, identificador, título y seis slots `{slot,heroId,subroleId}`. El respaldo JSON contiene `compositions` (borradores) y `contractCompositions` (solo las que pueden convertirse fielmente al esquema v0.8). No se inventa un `assignmentId` si el héroe no está evaluado.

### Preservación de datos

El almacenamiento es **localStorage** del origen donde corre la app, no una cuenta en GitHub. La exportación produce un JSON autocontenido con modelo y composiciones. Nunca añadas ese respaldo personal al repositorio público por defecto.

## Pruebas

```bash
npm test
python -m pip install jsonschema
python legacy/v0.8/tools/validate.py
python -m unittest discover -s legacy/v0.8/tests -v
```

- 20 pruebas JavaScript del dominio v1.0 y 12 pruebas Python del contrato ficticio v0.8.
- Prueba de humo Chromium: tres tableros renderizados, 28 héroes visibles en Duelist (incluyendo Deadpool), asignación Hela→Off DPS→A, puntuación, bloqueo, cero excepciones de ejecución.
- Estas pruebas NO validan el meta real, ni los matchups reales, ni los derechos sobre arte externo.

## GitHub Pages

Publicación estática, sin llamadas a bases de datos externas ni servicios de pago. Todas las rutas son relativas (`./css/`, `./js/`, `./data/`), compatibles con una URL de Project Pages. Si se usa una rama `main`, el sitio se despliega desde la raíz con Pages habilitado en el repositorio. Se incluye workflow de tests en `.github/workflows/test.yml`.

## Para Astra

**Leer primero [`ASTRA_HANDOFF.md`](./ASTRA_HANDOFF.md).** Astra debe continuar sobre este código, conservar la interfaz de tres tableros y atender únicamente pendientes identificados. No reconstruir el proyecto desde cero ni sustituir los contratos por un framework innecesario.

## Aviso de derechos

Marvel Rivals y sus personajes pertenecen a sus titulares. Esta herramienta es un proyecto no oficial y no está afiliada a NetEase, Marvel o Disney. La clasificación de héroes y nombres se usa descriptivamente; no se incluyen recursos gráficos oficiales ni una licencia sobre sus imágenes. No se establece licencia de código fuente hasta decisión del responsable del repositorio.
