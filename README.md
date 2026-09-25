# Nativox

**Transcripción y traducción en vivo, de código abierto, para conferencias.** El audio del escenario se convierte en subtítulos en el idioma original y traducidos (español ↔ inglés ↔ portugués): en las pantallas del escenario, en el stream (vMix/OBS) y en los celulares.

> En construcción durante la Vibeathon Nerdearla 2026. Las secciones marcadas *(a completar)* se completan en el build.

## Por qué es distinto

- **Corre en el navegador, gratis y sin internet:** Whisper large-v3 turbo + Bergamot en la computadora de cada sala (WebGPU). Sin API keys. El costo no crece con la cantidad de salas.
- **"Evaluar esta computadora":** un clic mide el equipo y elige el modelo, la velocidad y el traductor.
- **Salas sin nadie al lado:** arrancan y paran con la agenda, se reparan solas y avisan por **Discord con un botón para reiniciar la sala desde el celular**. Nadie tiene que estar al lado de la computadora ni entrar por escritorio remoto.
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

## Requisitos *(a completar)*

- Una cuenta de Cloudflare y una de GitHub o GitLab.
- Para el modo local: Chrome 124 o posterior con WebGPU en la computadora de cada sala.

## Cómo escalar *(a completar)*

Una computadora por sala corre en local (gratis). Las salas que una computadora no llega a cubrir pasan solas a Workers AI (~$0,037 por hora de sala). Ver `documentacion/escalado-y-costos.md`.

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
