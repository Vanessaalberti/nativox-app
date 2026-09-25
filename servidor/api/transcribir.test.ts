import { describe, expect, it } from "vitest";
import { wavDeSilencio } from "@servidor/modulos/audio-wav";
import { usarCuentaConSalas } from "./contexto-de-prueba";
import { crearEvento } from "./evento";
import { transcribir } from "./transcribir";

const entorno = usarCuentaConSalas();

function pedirTranscripcion(
  cookie: string | undefined,
  audio: Uint8Array<ArrayBuffer>,
  consulta = "?idioma=es",
) {
  const encabezados = new Headers({ "Content-Type": "audio/wav" });
  if (cookie) encabezados.set("Cookie", cookie);
  encabezados.set("X-Nativox-Prompt", encodeURIComponent("Nerdearla"));
  return transcribir(
    new Request(`https://x/api/transcribir${consulta}`, {
      method: "POST",
      headers: encabezados,
      body: audio,
    }),
    entorno.contexto,
  );
}

const EVENTO = {
  tipo: "roles-separados",
  nombre: "DevConf Latam 2026",
  salasSimultaneas: 2,
  horasPorDia: 8,
  dias: 1,
};

const conNube = (activa: boolean) =>
  crearEvento(
    entorno.comoAdmin("/api/evento", { ...EVENTO, nubeComoRespaldo: activa }),
    entorno.contexto,
  );

describe("transcribir en la nube", () => {
  it("transcribe una frase de la sesión y le pasa el glosario como prompt", async () => {
    await conNube(true);

    const respuesta = await pedirTranscripcion(entorno.cookie, wavDeSilencio(6));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject({ ok: true, texto: "hola a todos" });
    expect(entorno.contexto.transcriptor.pedidos).toEqual([
      { idioma: "es", prompt: "Nerdearla", bytes: wavDeSilencio(6).length },
    ]);
  });

  it("sin sesión no", async () => {
    await conNube(true);

    const respuesta = await pedirTranscripcion(undefined, wavDeSilencio(6));

    expect(respuesta.status).toBe(401);
    expect(entorno.contexto.transcriptor.pedidos).toEqual([]);
  });

  it("con la transcripción en la nube apagada tampoco: consume la cuota de la cuenta", async () => {
    await conNube(false);

    const respuesta = await pedirTranscripcion(entorno.cookie, wavDeSilencio(6));

    expect(respuesta.status).toBe(403);
    expect(entorno.contexto.transcriptor.pedidos).toEqual([]);
  });

  it("rechaza el audio largo o roto y el idioma inventado antes de gastar un pedido", async () => {
    await conNube(true);
    const largo = await pedirTranscripcion(entorno.cookie, wavDeSilencio(20));
    const roto = await pedirTranscripcion(entorno.cookie, new Uint8Array(100));
    const idioma = await pedirTranscripcion(entorno.cookie, wavDeSilencio(5), "?idioma=xx");

    expect([largo.status, roto.status, idioma.status]).toEqual([400, 400, 400]);
    expect(entorno.contexto.transcriptor.pedidos).toEqual([]);
  });

  it("si el modelo falla, lo dice sin mostrar el detalle", async () => {
    await conNube(true);
    entorno.contexto.transcriptor.falla = true;

    const respuesta = await pedirTranscripcion(entorno.cookie, wavDeSilencio(6));

    expect(respuesta.status).toBe(502);
    expect(JSON.stringify(await respuesta.json())).not.toContain("no contestó");
  });
});
