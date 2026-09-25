# cliente-instancia ♻

**Qué hace:** Las llamadas del navegador a la API de la propia instancia (`/api/*`): estado de la instancia, crear cuenta, ingresar, recuperar con código, entrar como operador, salir y crear o leer el evento, y las salas y sus charlas (listar, crear, cambiar, borrar). Valida lo que vuelve con los contratos y convierte cualquier falla (sin red, error del servidor, respuesta rara) en un mensaje para mostrar: **nunca lanza**.

**Qué NO hace:** Guardar la sesión (es una cookie `HttpOnly`: el navegador la manda solo y el JavaScript no la puede leer) ni decidir permisos (los decide el servidor).

## API pública (solo desde `index.ts`)

- `leerEstado()` · `crearCuenta(datos)` · `ingresar(datos)` · `recuperar(datos)` · `ingresarComoOperador(codigo)` · `salir()`
- `crearEvento(datos)` · `leerEvento()`
- `listarSalas()` · `crearSalas(datos[])` · `leerSala(id)` · `actualizarSala(id, datos)` · `borrarSala(id)`
- `listarCharlas(salaId)` · `crearCharla(salaId, datos)` · `actualizarCharla(id, datos)` · `borrarCharla(id)`

## Dependencias

- **Puede importar:** `compartido/contratos`.
- **Lo usan:** `acceso`, `crear-evento`, `paneles`, `salas`, `agenda`.

## Pruebas

Una falla de red, un error del servidor y una respuesta que no es JSON dan un mensaje, no una excepción.
