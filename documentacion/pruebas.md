# Pruebas

| Qué | Cómo | Dónde |
| --- | --- | --- |
| Funciones puras (glosario, cortes, exportar subtítulos, métricas, contratos) | Unitarias con Vitest y casos reales ("Workers Day de AI" → "Workers AI", "CI y CD" → "CI/CD") | Junto al módulo (`*.test.ts`) |
| Autorización por sala | Un operador no ve salas ajenas ni secretos | `servidor/api` |
| Links de acción de un solo uso | Vencen, no se reusan y solo sirven para su sala y su acción | `servidor/api/operacion.test.ts` |
| Audiencia y transcripción en la nube | El link de la audiencia se puede renovar; la nube pide sesión, está apagada por defecto y rechaza audio largo o roto | `servidor/api/tiempo-real.test.ts`, `servidor/api/transcribir.test.ts` |
| Reparto a la audiencia | Una línea publicada una vez llega a N espectadores en el idioma que elige cada uno | `servidor/objetos-durables/sala` |

**Reglas:** una prueba que falla se arregla en el código, no en lo esperado (salvo que el comportamiento esperado haya cambiado, y se explica en el commit). La cobertura no es una meta: una prueba tiene que poder fallar si el comportamiento está mal.
