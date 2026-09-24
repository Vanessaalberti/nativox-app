# codificador-opus ♻

**Qué hace:** Codifica PCM a Opus de 24 kbps en contenedor Ogg con `AudioEncoder` de WebCodecs y un armador de páginas Ogg propio.

**Qué NO hace:** Mandar el audio a ningún lado.

## API pública (solo desde `index.ts`)

- `estaDisponible(): boolean`
- `aOggOpus(pcm, { tasaBits }): Promise<Uint8Array>`

## Dependencias

- **Puede importar:** nada.
- **Lo usan:** motor de nube de `transcripcion`.

## Archivos previstos

- `codificador.ts` · `armador-ogg.ts` · `index.ts`

## Pruebas

Encabezados Ogg válidos; ~14 KB por fragmento de ~5 s a 24 kbps.

## Referencia

Documento de decisiones → "Formato del audio a la nube" (Opus contra WAV: 1,6 s contra 3,7 s).
