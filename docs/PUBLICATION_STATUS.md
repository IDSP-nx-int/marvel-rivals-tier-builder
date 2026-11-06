# Estado de publicación y control de cambios

## Referencia publicada antes del parche

GitHub `IDSP-nx-int/marvel-rivals-tier-builder`, rama `main`, SHA `a9a6f3c3b6c4cfef0bf76c482ebfb2a4010a9ade` (24-oct-2026). En esa revisión pública figura la Alpha original; M1.1–M1.4 no se deben describir como desplegados hasta que Astra publique un commit nuevo.

## M1.4 — 06-nov-2026

Paquete acumulativo terminado y probado localmente. **Pendiente de desplegar y verificar en URL HTTPS**. En el archivo `ASTRA_HANDOFF.md` están las instrucciones exactas.

Ningún modelo de usuario ni respaldo personal debe ser subido a GitHub. La aplicación persiste modelos en `localStorage` del navegador. La actualización de recursos estáticos no borra sus datos, pero antes de realizar pruebas o importar JSON conviene exportar respaldo.

El fixture ficticio `legacy/v0.8/examples/model.personal.demo.json` no está en este repositorio, por decisión de revisión anterior. No introducirlo ni recrearlo para forzar CI; la suite legacy continúa fuera de CI.

Los motores Composition/Matchup siguen exploratorios y los retratos Lord no se incluyen por no haberse resuelto derechos de uso.
