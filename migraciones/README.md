# Migraciones de D1

Única fuente de verdad del esquema. Las aplica el script `deploy` (el botón de Cloudflare las corre solo). Una migración no se edita una vez aplicada: se agrega otra.

| Migración prevista | Tablas |
| --- | --- |
| `0001_evento_y_cuentas.sql` | evento, administrador, sesiones, intentos de ingreso, código de recuperación |
| `0002_salas.sql` | salas con su idioma original y los idiomas destino. **Hecha** |
| `0003_agenda_y_glosario.sql` | charlas (horario, idioma, resumen, oradores) y su glosario. **Hecha** (el glosario del evento y las correcciones, después) |
| `0004_operadores.sql` | operadores (códigos de invitación hasheados) y sala_operador. **Hecha** |
| `0006_ajustes.sql` | ajustes del administrador y el webhook de avisos (secreto). **Hecha** |
| `0007_operacion.sql` | segmentos transcriptos de cada charla, links de acción de un solo uso y registro de qué estuvo al aire. **Hecha** |
| `0008_consumo.sql` | consumo estimado de IA y topes |
| `0005_produccion.sql` | estilo de cada sala y salidas de producción (nombre, estilo, sala al aire). **Hecha** |
