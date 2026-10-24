# Publication status

The static application is deployed from `main` and the repository root using GitHub Pages.

The application source is unchanged from the prepared alpha package. Personal rankings remain in each browser's local storage; no actual user rankings are published.

## Validation

- 20 JavaScript tests passed locally; the included read-only GitHub Actions workflow runs this suite.
- All 12 original v0.8 contract tests and the validator passed locally with the complete prepared package.
- The automatic approval review blocked publication of `legacy/v0.8/examples/model.personal.demo.json` because it was classified as a personal model. The file was inspected and is explicitly labeled fictional demonstration data. It remains omitted pending explicit approval; it has not been renamed or reconstructed to bypass that decision.
- Consequently, the legacy contract suite is preserved but cannot run from this checkout until the missing fixture is approved and supplied. Legacy CI is not enabled, and no passing legacy CI result is claimed.
- `legacy/v0.8/tools/build.py` is also omitted because it embeds and regenerates that same blocked fixture.

The omitted test fixture is not required by the web application. Composition and matchup analysis remain preliminary as described in the project README.
