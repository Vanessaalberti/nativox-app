# navegador — la app que corre en el navegador

| Carpeta | Qué va | ¿♻? |
| --- | --- | --- |
| `arranque/` | Proveedores, enrutador, manejo de errores global, cliente de la API | No |
| `rutas/` | Una página por ruta; solo arma funcionalidades | No |
| `funcionalidades/` | El dominio de Nativox, una carpeta por funcionalidad | No |
| `modulos/` | Lógica reutilizable (audio, transcripción, traducción, autorreparación…) | Sí |
| `interfaz/` | Sistema de diseño y componentes de subtítulos | Sí |
| `componente-embebible/` | Web Component `<subtitulos-en-vivo>` para cualquier sitio | Sí |
| `segundo-plano/` | Puntos de entrada de los Web Workers y del SharedWorker de modelos | No |

Reglas de import: `documentacion/arquitectura.md`.
