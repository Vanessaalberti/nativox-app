# Migraciones de D1

Única fuente de verdad del esquema. Las aplica el script `deploy` (el botón de Cloudflare las corre solo). Una migración no se edita una vez aplicada: se agrega otra.

| Migración prevista | Tablas |
| --- | --- |
| `0001_evento_y_cuentas.sql` | evento, administrador, sesiones, intentos de ingreso, código de recuperación |
| `0002_salas.sql` | salas con su idioma original y los idiomas destino. **Hecha** |
| `0003_agenda_y_glosario.sql` | charlas (horario, idioma, resumen, oradores) y su glosario. **Hecha** (el glosario del evento y las correcciones, después) |
| `0004_operadores.sql` | operadores (códigos de invitación hasheados) y sala_operador |
| `0005_transcripciones.sql` | segmentos con marcas de tiempo reales y sus traducciones |
| `0006_operacion.sql` | canal de avisos (webhook como secreto), links de acción de un solo uso, registro de acciones, equipos de reserva |
| `0007_consumo.sql` | consumo estimado de IA y topes |
| `0008_produccion.sql` | salidas de producción (nombre, estilo, sala al aire) y changelog |
