# Pruebas

| Qué | Cómo | Dónde |
| --- | --- | --- |
| Funciones puras (glosario, cortes, exportar subtítulos, métricas, contratos) | Unitarias con Vitest y casos reales ("Workers Day de AI" → "Workers AI", "CI y CD" → "CI/CD") | Junto al módulo (`*.test.ts`) |
| Calidad de transcripción y traducción | WER y términos del glosario contra `muestras/`, con umbral | `calidad.yml` |
| Autorización por sala | Un operador no ve salas ajenas ni secretos | `servidor/api` |
| Links de acción de un solo uso | Vencen, no se reusan y solo sirven para su sala y su acción | `servidor/modulos/links-de-accion` |
| Autorreparación | Cada falla simulada (audio, modelo, red) sube por los tres pasos en orden | `navegador/modulos/autorreparacion` |
| Reparto a la audiencia | Una línea publicada una vez llega a N espectadores en el idioma que elige cada uno | `servidor/objetos-durables/sala` |
| Camino crítico | Playwright: crear evento → sala → audio de `muestras/` → la audiencia recibe subtítulos | `pruebas/punta-a-punta` |

**Reglas:** una prueba que falla se arregla en el código, no en lo esperado (salvo que el comportamiento esperado haya cambiado, y se explica en el commit). La cobertura no es una meta: una prueba tiene que poder fallar si el comportamiento está mal.
