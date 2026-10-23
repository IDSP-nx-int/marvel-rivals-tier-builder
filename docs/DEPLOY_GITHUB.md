# Despliegue en GitHub Pages

**Repositorio sugerido:** `IDSP-nx-int/marvel-rivals-tier-builder` si esa es la cuenta de GitHub seleccionada. Confirma el propietario antes de subir archivos.

1. Crea el repositorio público y carga los contenidos extraídos de este ZIP **a la raíz**, no el ZIP como un solo archivo. Verifica la presencia de `index.html`, `.nojekyll`, `js/`, `css/`, `data/`, `docs/`.
2. En GitHub, Settings → Pages → Deploy from a branch → branch `main`, folder `/(root)` → Save.
3. Abre `https://<owner>.github.io/<repo>/` (sustituye tus valores). Si el repositorio tiene otra rama predeterminada, ajústala en Pages.
4. Comprueba consola y Network: sin errores JS; `./data/roster.reference.json`, `./data/taxonomy.json`, `./assets/heroes/manifest.json` responden 200.
5. Clasifica un héroe, evalúalo, bloquea y recarga. Comprueba persistencia. Exporta e importa un backup.
6. Confirma las cinco vistas y la prueba de Team Builder; nunca anuncies sinergias reales como confirmadas si no hay datos curados.

No requiere dominio de pago, API keys, build ni dependencia npm del sitio.
