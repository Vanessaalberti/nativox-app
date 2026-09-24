# funcionalidades — el dominio de Nativox

Una carpeta por funcionalidad. Cada una tiene `componentes/`, `hooks/` y `api.ts` (sus llamadas a la API) según haga falta, y un `index.ts` con lo que exporta.

**Reglas:** una funcionalidad no importa a otra. Lo que dos funcionalidades comparten sube a `modulos/`, `interfaz/` o `compartido/`.

| Funcionalidad | Qué cubre |
| --- | --- |
| `crear-evento` | Roles, cuenta, "Tu evento y la IA", estimador de costo |
| `acceso` | Entrada de administrador y operador, sesión, sin acceso |
| `paneles` | Paneles: estado de las salas |
| `salas` | Crear, editar y listar salas |
| `operadores` | Operadores e invitaciones |
| `agenda` | Calendario, charlas, glosario por charla, términos sugeridos, transcripción y exportar |
| `sesion-en-vivo` | Control de la sala: fuente, idiomas, velocidad, traductor, "Evaluar", modo desatendido |
| `pantalla-escenario` | Pantalla del escenario a pantalla completa |
| `subtitulos-stream` | Subtítulos para vMix/OBS: estilo por sala y página transparente |
| `produccion` | Salidas fijas para vMix/OBS y selector de qué sala sale al aire (opcional) |
| `monitoreo` | Monitoreo, acciones a distancia, modo caos |
| `ajustes` | Avisos por Discord, operación desatendida, consumo, calidad, acceso, instancia |
| `audiencia` | Elegir sala e idioma y ver los subtítulos en el celular |
