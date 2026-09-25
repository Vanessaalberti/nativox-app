# interfaz ♻

| Carpeta             | Qué es                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sistema-diseno/`   | Sistema de diseño "Rumbo Vox": tokens, preset de Tailwind y componentes base (Boton, Etiqueta, EstadoPill, Modal, Campo…)                                             |
| `marco-de-entrada/` | El marco de las pantallas de entrada: barra con la marca, contenido sobre la grilla y pie                                                                             |
| `subtitulos/`       | Componentes de subtítulos: una línea (original + traducción, provisorio en gris) y una vista de N líneas. Los usan la pantalla del escenario, vMix/OBS y la audiencia |

Sin lógica de negocio: si un componente necesita saber qué es una "sala", va en `funcionalidades/`.
