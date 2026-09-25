import { describe, expect, it } from "vitest";
import { AJUSTES_POR_DEFECTO } from "@compartido/contratos";
import {
  avisoDeAccion,
  avisoDeCharla,
  avisoRecuperada,
  avisoSinSenal,
  debeAvisar,
  estaSilenciado,
  evaluarSenal,
} from "./index";

const AHORA = 1_000_000;

describe("evaluarSenal", () => {
  const base = { senalEn: AHORA - 5000, ahora: AHORA, enAlerta: false, hubo: true };

  it("con señal reciente no hace nada", () => {
    expect(evaluarSenal(base)).toBe("nada");
  });

  it("avisa una sola vez cuando la señal se corta hace más de 30 s", () => {
    const callada = { ...base, senalEn: AHORA - 31_000 };

    expect(evaluarSenal(callada)).toBe("avisar-caida");
    expect(evaluarSenal({ ...callada, enAlerta: true })).toBe("nada");
  });

  it("avisa cuando vuelve la señal después de una caída", () => {
    expect(evaluarSenal({ ...base, enAlerta: true })).toBe("avisar-recuperacion");
  });

  it("no avisa de una sala que nunca arrancó", () => {
    expect(evaluarSenal({ ...base, senalEn: null, hubo: false })).toBe("nada");
    expect(evaluarSenal({ ...base, senalEn: AHORA - 60_000, hubo: false })).toBe("nada");
  });
});

describe("qué se avisa", () => {
  it("lo que no se pudo reparar se avisa siempre; las charlas, si se eligió", () => {
    const sinCharlas = { ...AJUSTES_POR_DEFECTO.avisar, charlas: false };

    expect(debeAvisar("sin-senal", sinCharlas)).toBe(true);
    expect(debeAvisar("recuperada", sinCharlas)).toBe(true);
    expect(debeAvisar("charla", sinCharlas)).toBe(false);
    expect(debeAvisar("charla", AJUSTES_POR_DEFECTO.avisar)).toBe(true);
  });

  it("silenciar apaga los avisos hasta la hora indicada", () => {
    expect(estaSilenciado(AHORA + 1, AHORA)).toBe(true);
    expect(estaSilenciado(AHORA, AHORA)).toBe(false);
    expect(estaSilenciado(null, AHORA)).toBe(false);
  });
});

describe("mensajes", () => {
  it("el de sin señal trae los dos links y su vigencia", () => {
    const texto = avisoSinSenal({
      sala: "Sala 2",
      segundos: 31.4,
      reiniciar: "https://x.test/accion/a",
      silenciar: "https://x.test/accion/b",
    });

    expect(texto).toContain("🔴 Sala 2 — no da señal hace 31 s.");
    expect(texto).toContain("https://x.test/accion/a");
    expect(texto).toContain("https://x.test/accion/b");
    expect(texto).toContain("15 min");
  });

  it("los demás", () => {
    expect(avisoRecuperada({ sala: "Sala 2", segundos: 42 })).toBe(
      "🟢 Sala 2 — volvió a dar señal después de 42 s.",
    );
    expect(
      avisoDeCharla({
        sala: "Auditorio",
        titulo: "Kubernetes",
        momento: "empieza",
        terminosDelGlosario: 14,
      }),
    ).toBe("🟢 Auditorio — empezó «Kubernetes» · glosario cargado: 14 términos");
    expect(avisoDeCharla({ sala: "Auditorio", titulo: "Kubernetes", momento: "termina" })).toBe(
      "🟢 Auditorio — terminó «Kubernetes»",
    );
    expect(avisoDeAccion({ sala: "Sala 2", accion: "reiniciar" })).toContain("reiniciar la sala");
  });
});
