import { describe, expect, it } from "vitest";
import { crearWhisperNube } from "./index";
import { aWav, sinElContexto } from "./motores/whisper-nube";

const respuesta = {
  ok: true as const,
  texto: " uno dos tres cuatro",
  palabras: [
    { palabra: " uno", inicio: 0, fin: 0.5 },
    { palabra: " dos", inicio: 0.6, fin: 1.1 },
    { palabra: " tres", inicio: 1.6, fin: 2.1 },
    { palabra: " cuatro", inicio: 2.2, fin: 2.8 },
  ],
};

describe("whisper en la nube", () => {
  it("arma un WAV de 16 bits, mono, a 16 kHz", () => {
    const wav = aWav(new Float32Array([0, 1, -1]));
    const vista = new DataView(wav.buffer);

    expect(String.fromCharCode(...wav.subarray(0, 4))).toBe("RIFF");
    expect(vista.getUint32(24, true)).toBe(16_000);
    expect(vista.getUint16(34, true)).toBe(16);
    expect(wav.length).toBe(44 + 6);
    expect(vista.getInt16(46, true)).toBe(0x7fff);
    expect(vista.getInt16(48, true)).toBe(-0x8000);
  });

  it("saca las palabras que caen en el tramo de contexto, por su horario", () => {
    expect(sinElContexto(respuesta, 0)).toBe(" uno dos tres cuatro");
    expect(sinElContexto(respuesta, 1.5)).toBe("tres cuatro");
  });

  it("transcribe con el servicio, le pasa el prompt y devuelve el texto sin el contexto", async () => {
    const pedidos: string[] = [];
    const motor = crearWhisperNube({
      transcribir: (_wav, idioma, prompt) => {
        pedidos.push(`${idioma}:${prompt}`);
        return Promise.resolve({ ok: true, valor: respuesta });
      },
    });

    const resultado = await motor.transcribir(new Float32Array(16_000), {
      prompt: "Nerdearla",
      idioma: "es",
      segundosDeContexto: 1.5,
    });

    expect(pedidos).toEqual(["es:Nerdearla"]);
    expect(resultado).toMatchObject({ ok: true, valor: { texto: "tres cuatro" } });
    expect(motor.info).toMatchObject({ local: false, vadPropio: true });
  });

  it("pasa el motivo si el servidor falla y rechaza un idioma que no conoce", async () => {
    const motor = crearWhisperNube({
      transcribir: () => Promise.resolve({ ok: false, motivo: "no respondió" }),
    });

    expect(await motor.transcribir(new Float32Array(10), { prompt: "", idioma: "es" })).toEqual({
      ok: false,
      motivo: "no respondió",
    });
    expect((await motor.transcribir(new Float32Array(10), { prompt: "", idioma: "xx" })).ok).toBe(
      false,
    );
  });
});
