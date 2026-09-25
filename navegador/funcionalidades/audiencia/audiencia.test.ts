import { describe, expect, it } from "vitest";
import type { CharlaPublica, SalaPublica } from "@compartido/contratos";
import { charlaDeAhora, charlasParaMostrar, estadoDeSala, fechaDeHoy } from "./estado";

const charla = (id: string, fecha: string, inicioMin: number, finMin: number): CharlaPublica => ({
  id,
  titulo: id,
  resumen: "",
  oradores: "",
  fecha,
  inicioMin,
  finMin,
  idioma: null,
});

const sala = (charlas: CharlaPublica[], enVivo = false): SalaPublica => ({
  id: "aaaaaaaaaaaa",
  nombre: "Auditorio",
  idiomaOriginal: "es",
  idiomasDestino: ["en"],
  enVivo,
  charlas,
});

const ahora = new Date(2026, 9, 5, 10, 30);

describe("audiencia", () => {
  it("la fecha de hoy es la local", () => {
    expect(fechaDeHoy(new Date(2026, 9, 5, 23, 59))).toBe("2026-10-05");
  });

  it("una sala está en vivo si la computadora manda subtítulos, y si no, según le queden charlas hoy", () => {
    expect(estadoDeSala(sala([], true), ahora)).toBe("en-vivo");
    expect(estadoDeSala(sala([charla("a", "2026-10-05", 660, 720)]), ahora)).toBe("proximamente");
    expect(estadoDeSala(sala([charla("a", "2026-10-05", 540, 600)]), ahora)).toBe("inactiva");
    expect(estadoDeSala(sala([charla("a", "2026-10-06", 540, 600)]), ahora)).toBe("inactiva");
  });

  it("muestra las charlas de hoy; sin ninguna, las del próximo día con charlas", () => {
    const charlas = [
      charla("a", "2026-10-05", 540, 600),
      charla("b", "2026-10-07", 540, 600),
      charla("c", "2026-10-07", 700, 760),
    ];

    expect(charlasParaMostrar(charlas, ahora).charlas.map((c) => c.id)).toEqual(["a"]);
    expect(charlasParaMostrar(charlas.slice(1), ahora)).toMatchObject({ fecha: "2026-10-07" });
    expect(charlasParaMostrar([], ahora).charlas).toEqual([]);
  });

  it("encuentra la charla que toca ahora", () => {
    const enCurso = sala([
      charla("a", "2026-10-05", 600, 660),
      charla("b", "2026-10-05", 700, 760),
    ]);

    expect(charlaDeAhora(enCurso, ahora)?.id).toBe("a");
    expect(charlaDeAhora(enCurso, new Date(2026, 9, 5, 13, 0))).toBeNull();
  });
});
