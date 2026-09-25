# arranque

- `principal.tsx` — monta la app y carga los estilos del sistema de diseño.
- `enrutador.tsx` — rutas (ver `rutas/`): hoy `/` y `/sala/:id/control`.
- `proveedores.tsx` — cliente de datos, sesión, idioma de la interfaz.
- `limite-de-error.tsx` — pantalla de error que dice qué hacer; registra el error una vez.
- `cliente-api.ts` — cliente de `/api/*` (misma cookie de sesión, mismo origen); valida las respuestas con `compartido/contratos`.
- `sesion.ts` — rol y evento actual (administrador, operador, todo en uno).

Sin lógica de negocio.
