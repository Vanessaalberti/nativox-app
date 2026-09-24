# interfaz ♻

| Carpeta | Qué es |
| --- | --- |
| `sistema-diseno/` | Sistema de diseño "Rumbo Vox": tokens, preset de Tailwind y componentes base (Boton, Etiqueta, EstadoPill, Modal, Campo…) |
| `subtitulos/` | Componentes de subtítulos: una línea (original + traducción, provisorio en gris) y una vista de N líneas. Los usan la pantalla del escenario, vMix/OBS y la audiencia |

Sin lógica de negocio: si un componente necesita saber qué es una "sala", va en `funcionalidades/`.
