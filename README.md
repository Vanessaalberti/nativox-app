# Nativox

**Transcripción y traducción en vivo, de código abierto, para conferencias.** El audio del escenario se convierte en subtítulos en el idioma original y traducidos (español ↔ inglés ↔ portugués): en las pantallas del escenario, en el stream (vMix/OBS) y en los celulares.

> En construcción durante la Vibeathon Nerdearla 2026.

## Por qué es distinto

- **Corre en el navegador, gratis y sin internet:** Whisper large-v3 turbo + Bergamot en la placa de video de tu computadora (WebGPU). Sin API keys. El costo no crece con la cantidad de salas. Si preferís no usar tu computadora, hay un modo en la nube (Workers AI) que se elige por sala.
- **"Evaluar esta computadora":** un clic mide el equipo y elige el modelo, la velocidad y el traductor.
- **Salas con poca atención:** guardan lo que se transcribe en la charla que toca según la agenda, vuelven a abrir solas la entrada de audio si se corta y avisan por **Discord con un botón para reiniciar la sala desde el celular**, sin entrar por escritorio remoto.
- **Glosario técnico en tres capas:** guía a Whisper, corrige la transcripción y se protege al traducir.
- **Deploy de un clic** en tu propia cuenta de Cloudflare.

## Deploy

Botón "Deploy to Cloudflare": crea el Worker, la base D1, los Durable Objects y la conexión con Workers AI. No pide secretos.

### Cuando termina: activá tu dirección (un paso a mano)

Cloudflare crea el Worker pero **no le enciende la dirección pública**, así que al terminar el deploy todavía no hay a dónde entrar. Hacé esto una vez:

1. En Cloudflare abrí *Workers y Pages* → tu Worker (se llama `nativox` salvo que hayas elegido otro nombre).
2. Entrá a **Settings → Domains & Routes** (arriba, *Dominios y rutas*) y activá **workers.dev** (*Enable*).
3. Tu dirección queda así: `https://<nombre-del-worker>.<tu-subdominio>.workers.dev`. El subdominio es el nombre de tu cuenta de Cloudflare y no se puede evitar con `workers.dev`; para una dirección sin tu usuario hace falta un dominio propio. La primera vez, Cloudflare puede pedirte que elijas ese subdominio.
4. **Abrila enseguida y creá el evento:** la primera persona que completa el asistente queda como dueña de la instancia. No dejes la dirección abierta sin usar.
5. **Para que aparezca en tu repositorio de GitHub:** en la página del repositorio, el engranaje junto a *About* → *Website* → pegá tu dirección. Cloudflare no lo completa solo.

## Requisitos

- Una cuenta de **Cloudflare** y una de **GitHub**. Nada más para desplegar y usar la instancia.

### Solo si transcribís en local (opcional)

Con el modo local, la transcripción corre en el navegador de la computadora que la use; no importa cuántas salas atienda cada una (ver *Cómo escalar*). Esa computadora necesita:

- **Chrome o Edge 124 o posterior**, con **WebGPU** (una placa de video compatible).
- **Memoria y disco:** unos 8 GB de RAM (con 4 GB o menos conviene cerrar todo lo demás) y ~1 GB libre para el modelo de Whisper, que se baja una sola vez y queda guardado. TranslateGemma, el traductor opcional de más calidad, pide ~2 a 3 GB más y una placa con margen.
- **Entrada de audio:** la salida de la consola de sonido o un micrófono. Para probar alcanza con un archivo, un link a un video o el audio de otra pestaña.

No hace falta saber si tu computadora alcanza: **"Evaluar esta computadora"** (en el asistente y en la pantalla de control) la mide en unos segundos y te dice qué nivel de velocidad usar, o si conviene la nube. Con el modo en la nube no hace falta WebGPU ni una placa: alcanza con un navegador.

## Cómo escalar

Hay dos modos de transcribir y se elige **por sala**, en la pantalla de control.

| | Local (por defecto) | En la nube (Workers AI, opcional) |
| --- | --- | --- |
| **Dónde corre** | En la placa de video de la computadora que abre la sala | En Cloudflare (Whisper large-v3 turbo) |
| **Costo** | $0 | ~$0,037 por hora de sala, con una cuota gratis diaria (~3 h) |
| **Qué limita** | La potencia de la computadora | Los pedidos por minuto de tu cuenta y tu presupuesto |
| **Cómo se ve** | Texto provisorio mientras se habla (según el nivel de velocidad) | Por frases de 4 a 8 s: el texto aparece al cerrarse cada frase |

**En local, escalás con la computadora.** Una computadora puede atender una sala o varias, cada una en su propia pestaña: depende de qué tan rápido resuelve cada pasada de Whisper y de cuánta memoria de video tiene, porque hoy cada pestaña carga su propia copia del modelo (~0,8 GB). Como regla, cuántas salas entran ≈ largo de una frase (~6 s) ÷ lo que tarda una pasada. Una placa que hace la pasada en ~1 s alcanza para varias salas en frases completas; una de ~3 s, para una o dos. Es una estimación: "Evaluar esta computadora" te da tu número real de una sala. Para más salas, sumá computadoras: el costo sigue en $0.

**En la nube, escalás con el presupuesto.** Cada sala transcripta en la nube cuesta ~$0,037 por hora, así que el gasto es *horas de sala × $0,037* (una sala en vivo 8 h por día durante 3 días ≈ $0,89). Un evento con 10 salas, 8 h por día y 2 días son 160 horas de sala ≈ $5,92. Cloudflare descuenta primero la cuota gratis diaria de Workers AI, así que lo real suele ser menos. Cada sala manda una frase cada 4 a 8 s, y el límite de la cuenta (720 pedidos por minuto) alcanza para unas 60 salas a la vez. Podés dejarla apagada y activarla solo para las salas que la necesiten (Ajustes → Consumo).

**Los espectadores no suman costo de IA**: cada sala genera sus subtítulos una sola vez y el servidor los reparte; quien mira solo recibe texto. Los detalles y las fuentes están en `documentacion/escalado-y-costos.md`.

## Desarrollo

Necesitás Node 22 o posterior.

```bash
npm install
npm run dev
```

`npm run dev` levanta la app y el Worker en `http://localhost:5173`, **sin internet y sin cuenta de Cloudflare** (D1 y los Durable Objects corren en local; Workers AI se prueba en la versión desplegada).

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | App + Worker en local, con recarga en caliente |
| `npm run revisar` | Formato · lint (incluye límites de import) · tipos · pruebas · dead code (`knip`) · duplicación (`jscpd`). Lo corre el CI |
| `npm run probar` | Solo las pruebas (Vitest) |
| `npm run construir` | Build de producción en `dist/` |
| `npm run formatear` | Aplica el formato de Prettier |
| `npm run tipos` | Regenera `servidor/plataforma/env.d.ts` con `wrangler types` (después de tocar `wrangler.jsonc`) |
| `npm run build` | Lo mismo que `construir`, con el nombre que Cloudflare detecta solo en el botón de deploy (build command) |
| `npm run deploy` | Aplica las migraciones de D1 y despliega (deploy command del botón; necesita haber hecho el build antes) |
| `npm run publicar` | Para hacerlo a mano desde tu computadora: construye y después corre `deploy` |

Reglas y convenciones: `documentacion/convenciones.md` y `documentacion/guardas-ia.md`.

## Contribuir

¿Encontraste un error o tenés una idea? Abrí un issue o un pull request.

## Licencia

MIT — ver `LICENSE`.
