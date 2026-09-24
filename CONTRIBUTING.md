# Cómo contribuir

1. Leé `documentacion/convenciones.md` (reglas), `documentacion/guardas-ia.md` y `documentacion/arquitectura.md` (dónde va cada cosa).
2. Una rama por cambio; nunca directo a `main` (`main` siempre se tiene que poder desplegar con el botón).
3. Commits con Conventional Commits, con la descripción en español (`feat: agrega avisos por Discord`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
4. Un PR = un cambio lógico, con la plantilla de `.github/pull_request_template.md` completa.
5. Integración continua en verde antes de mergear (`.github/workflows/`).
6. Si el cambio toma una decisión de arquitectura, sumá un registro en `documentacion/decisiones/`.
