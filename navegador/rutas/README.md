# rutas — una página por ruta

Páginas finas: arman componentes de `funcionalidades/`. Sin lógica.

| Maqueta (`maquetado/`) | Ruta | Funcionalidad |
| --- | --- | --- |
| `landing-crear-evento.html` | `/` | `crear-evento` |
| `crear-evento-tipo.html` · `-cuenta` · `-keys` | `/crear-evento/*` | `crear-evento` |
| `entrada-*.html` | `/entrada/*` | `acceso` |
| `panel-admin.html` · `panel-solo.html` · `panel-operador.html` | `/panel/*` | `paneles`, `salas`, `operadores`, `produccion`, `ajustes` |
| `sala-detalle.html` | `/sala/:id/calendario` | `agenda` |
| `sesion-operador.html` | `/sala/:id/control` | `sesion-en-vivo`, `pantalla-escenario`, `subtitulos-stream` |
| `monitoreo-sala.html` | `/sala/:id/monitoreo` | `monitoreo` |
| — | `/sala/:id/transmision` | `subtitulos-stream` (página transparente de una sala para vMix/OBS) |
| pestaña Producción de `panel-solo.html` / `panel-admin.html` | `/panel/produccion` | `produccion` |
| — | `/produccion/salida-:n` | `produccion` (página transparente de una salida: muestra la sala que esté al aire) |
| `vista-audiencia.html` · `charla.html` | `/audiencia` · `/sala/:id/pantalla` | `audiencia` |
| — | `/accion/:token` | `ajustes` (confirmación de un link de acción de Discord) |
| `sin-acceso.html` | `/sin-acceso` | `acceso` |
