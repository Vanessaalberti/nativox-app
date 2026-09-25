# pantalla-escenario

**Qué cubre:** Pantalla del escenario: subtítulos grandes a pantalla completa en la misma pestaña que captura. Las dos últimas líneas (la anterior atenuada), original chico + traducción grande, provisorio en gris con "…". Controles de idioma, "Mostrar el original" y tamaño S/M/L que aparecen al mover el mouse y se esconden a los 3 s; "Capturando" mientras la sesión está en vivo; Esc o salir de la pantalla completa la cierran. Si el navegador no deja usar pantalla completa, igual ocupa toda la ventana.

**Qué NO hace:** Depender de internet: lee las líneas locales del flujo.

**API:** `PantallaEscenario({ lineas, idiomaOriginal, idiomasDestino, enVivo, alSalir })` — `alSalir` tiene que ser estable (`useCallback`): si cambia, se vuelve a pedir la pantalla completa.

**Estructura:** `componentes/PantallaEscenario.tsx` · `hooks/useControlesQueSeEsconden.ts` · `hooks/usePantallaCompleta.ts` · `index.ts`.

**Maqueta de referencia:** `sesion-operador.html` (botón "⛶ Pantalla del escenario").
