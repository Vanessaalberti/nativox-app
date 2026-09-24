# Migraciones de D1

Única fuente de verdad del esquema. Las aplica el script `deploy` (el botón de Cloudflare las corre solo). Una migración no se edita una vez aplicada: se agrega otra.

| Migración prevista | Tablas |
| --- | --- |
| `0001_evento_y_cuentas.sql` | evento, administrador, sesiones, intentos de ingreso, código de recuperación |
| `0002_salas_y_operadores.sql` | salas, operadores (códigos de invitación hasheados), sala_operador |
| `0003_agenda_y_glosario.sql` | charlas (horario, idioma, resumen, oradores), glosario por charla y del evento, términos sugeridos, correcciones |
| `0004_transcripciones.sql` | segmentos con marcas de tiempo reales y sus traducciones |
| `0005_operacion.sql` | canal de avisos (webhook como secreto), links de acción de un solo uso, registro de acciones, equipos de reserva |
| `0006_consumo.sql` | consumo estimado de IA y topes |
| `0007_produccion.sql` | salidas de producción (nombre, estilo, sala al aire) y registro de cambios |
