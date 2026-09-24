import { describe, expect, it } from "vitest";
import { esquemaMensajeSala, esquemaSalida, validar } from "./index";

const linea = {
  tipo: "linea",
  id: "sala-1:42",
  original: "Revisen el pull request",
  traducciones: { en: "Review the pull request", pt: "Revisem o pull request" },
  provisoria: false,
  inicio: 12.5,
  fin: 15.1,
};

describe("mensajes de la sala", () => {
  it("acepta una línea con el original y sus traducciones", () => {
    expect(validar(esquemaMensajeSala, linea)).toEqual({ ok: true, valor: linea });
  });

  it("acepta una línea provisoria todavía sin traducciones", () => {
    const provisoria = { ...linea, provisoria: true, traducciones: {} };
    expect(validar(esquemaMensajeSala, provisoria).ok).toBe(true);
  });

  it("rechaza un idioma que la sala no maneja", () => {
    const resultado = validar(esquemaMensajeSala, { ...linea, traducciones: { fr: "Revoyez" } });
    expect(resultado.ok).toBe(false);
  });

  it("rechaza una línea que termina antes de empezar", () => {
    expect(validar(esquemaMensajeSala, { ...linea, inicio: 5, fin: 4 })).toEqual({
      ok: false,
      motivo: "fin no puede ser anterior a inicio",
    });
  });

  it("dice qué campo está mal", () => {
    const resultado = validar(esquemaMensajeSala, { ...linea, id: "" });
    expect(resultado.ok).toBe(false);
    expect(resultado.ok ? "" : resultado.motivo).toContain("id");
  });

  it.each([
    { tipo: "senal", estado: "en-vivo", nivelAudio: 0.4, latenciaMs: 2900 },
    { tipo: "comando", id: "c-1", accion: "reiniciar" },
    {
      tipo: "agenda",
      momento: "empieza",
      charlaId: "ch-7",
      titulo: "Observabilidad",
      idioma: "es",
    },
  ])("acepta el mensaje $tipo", (mensaje) => {
    expect(validar(esquemaMensajeSala, mensaje)).toEqual({ ok: true, valor: mensaje });
  });

  it("rechaza un tipo de mensaje desconocido o un dato que no es objeto", () => {
    expect(validar(esquemaMensajeSala, { tipo: "borrar-todo" }).ok).toBe(false);
    expect(validar(esquemaMensajeSala, "linea").ok).toBe(false);
  });

  it("rechaza un nivel de audio fuera de 0–1", () => {
    const senal = { tipo: "senal", estado: "en-vivo", nivelAudio: 3, latenciaMs: 0 };
    expect(validar(esquemaMensajeSala, senal).ok).toBe(false);
  });
});

describe("salidas de producción", () => {
  const salida = {
    tipo: "salida",
    numero: 1,
    salaAlAire: "sala-2",
    estilo: { idioma: "en", lineas: 2, posicion: "abajo", mostrarOriginal: false, tamanoLetra: 48 },
  };

  it("acepta una salida con su sala al aire y su estilo", () => {
    expect(validar(esquemaSalida, salida)).toEqual({ ok: true, valor: salida });
  });

  it("acepta una salida sin sala al aire", () => {
    expect(validar(esquemaSalida, { ...salida, salaAlAire: null }).ok).toBe(true);
  });

  it("rechaza más de 3 líneas o una salida número 0", () => {
    expect(validar(esquemaSalida, { ...salida, estilo: { ...salida.estilo, lineas: 4 } }).ok).toBe(
      false,
    );
    expect(validar(esquemaSalida, { ...salida, numero: 0 }).ok).toBe(false);
  });
});
