import { describe, expect, it } from "vitest";
import { sugerirTermino } from "./correccion";

describe("sugerirTermino", () => {
  it("una palabra mal escrita: lo correcto ~ lo que se había escrito", () => {
    expect(sugerirTermino("Usamos cloudfler para todo.", "Usamos Cloudflare para todo.")).toBe(
      "Cloudflare ~ cloudfler",
    );
  });

  it("solo toma lo que cambió, sin la puntuación de los bordes", () => {
    expect(sugerirTermino("Hablemos de pul request.", "Hablemos de pull request.")).toBe(
      "pull ~ pul",
    );
  });

  it("no sugiere nada si solo se agregó o sacó texto, o si se reescribió mucho", () => {
    expect(sugerirTermino("Hola a todos", "Hola a todos ustedes")).toBeNull();
    expect(sugerirTermino("Hola a todos", "Hola a todos")).toBeNull();
    expect(
      sugerirTermino("uno dos tres cuatro cinco", "seis siete ocho nueve diez once"),
    ).toBeNull();
  });
});
