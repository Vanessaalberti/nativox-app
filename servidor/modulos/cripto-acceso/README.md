# cripto-acceso ♻

**Qué hace:** Hash de contraseñas con PBKDF2 (WebCrypto, 100.000 iteraciones: el máximo que permite Workers), códigos de recuperación (XXXX-XXXX-XXXX-XXXX, sin caracteres ambiguos), tokens de sesión al azar (256 bits), hash SHA-256 de códigos y tokens y comparación en tiempo constante.

**Qué NO hace:** Decidir permisos por sala (eso es `api/`) ni guardar nada: la sesión es un token opaco, y en la base queda solo su hash.

## API pública (solo desde `index.ts`)

- `hashearContrasena` · `verificarContrasena`
- `generarCodigoDeRecuperacion` · `normalizarCodigo` · `hashearCodigo`
- `generarCodigoDeInvitacion` (NTVX-XXXX-XXXX-XXXX, 60 bits) · `hashearCodigoDeInvitacion` (ignora mayúsculas, guiones y el prefijo)
- `generarToken` · `hashearToken`
- `compararEnTiempoConstante`

## Dependencias

- **Puede importar:** nada.
- **Lo usan:** `api/acceso`, `api/sesion`; después `api/operadores`.

## Pruebas

Contraseña correcta e incorrecta, sal distinta en cada hash, formato guardado roto, formato y unicidad de los códigos, y que el código se compare sin importar mayúsculas ni guiones.

## Referencia

Documento de decisiones → "Cuentas y acceso".
