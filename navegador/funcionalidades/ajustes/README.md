# ajustes

**Qué cubre:** "Salas sin nadie al lado" (webhook de Discord con prueba, qué avisar, autorreparación, agenda, equipo de reserva, lista de control), consumo de IA, calidad de la traducción, acceso, instancia, eliminar evento; confirmación de links de acción (`/accion/:token`).

**Qué NO hace:** Mostrar el webhook guardado: es un secreto.

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
