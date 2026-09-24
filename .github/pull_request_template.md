## Qué cambia y por qué

<!-- Una o dos oraciones. Enlazá el issue o la sección del documento de decisiones. -->

## Cómo lo probé

<!-- Comandos y pasos en el navegador. Si algo no se pudo probar, decilo. -->

## Lista de control

- [ ] `npm run revisar` en verde (lint, tipos, pruebas, código muerto, duplicación)
- [ ] Busqué si ya existía algo parecido antes de crear código nuevo
- [ ] No agregué dependencias (o están aprobadas en `documentacion/herramientas.md`)
- [ ] No debilité ninguna prueba; si cambió lo esperado, lo explico arriba
- [ ] Sin `catch` vacíos, sin `any`, sin código comentado, sin `console.log`
- [ ] Respeté los límites de import y no toqué archivos fuera del alcance
- [ ] Sin secretos en el código ni en los logs
- [ ] Todo en español (textos, comentarios, identificadores)
- [ ] Actualicé el README de la carpeta si cambió su API
