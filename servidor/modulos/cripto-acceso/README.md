# cripto-acceso ♻

**Qué hace:** Hash de contraseñas con PBKDF2 (WebCrypto), sesiones firmadas, códigos de recuperación e invitación y comparación en tiempo constante.

**Qué NO hace:** Decidir permisos por sala (eso es `api/`).

## API pública (solo desde `index.ts`)

- `hashearContrasena` · `verificarContrasena` · `crearSesion` · `verificarSesion` · `generarCodigo`

## Dependencias

- **Puede importar:** nada.
- **Lo usan:** `api/acceso`, `api/operadores`.

## Archivos previstos

- `contrasena.ts` · `sesion.ts` · `codigos.ts` · `index.ts`

## Pruebas

Iteraciones calibradas al límite de CPU del plan; códigos que no se repiten.

## Referencia

Documento de decisiones → "Cuentas y acceso".
