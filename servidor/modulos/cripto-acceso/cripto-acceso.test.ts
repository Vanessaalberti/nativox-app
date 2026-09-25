import { describe, expect, it } from "vitest";
import {
  compararEnTiempoConstante,
  generarCodigoDeInvitacion,
  generarCodigoDeRecuperacion,
  generarToken,
  hashearCodigo,
  hashearCodigoDeInvitacion,
  hashearContrasena,
  hashearToken,
  normalizarCodigo,
  verificarContrasena,
} from "./index";

describe("contraseñas", () => {
  it("verifica la correcta y rechaza la incorrecta", async () => {
    const guardado = await hashearContrasena("una frase bien larga");

    expect(await verificarContrasena("una frase bien larga", guardado)).toBe(true);
    expect(await verificarContrasena("una frase bien larga.", guardado)).toBe(false);
  });

  it("guarda con sal: la misma contraseña da hashes distintos", async () => {
    expect(await hashearContrasena("una frase bien larga")).not.toBe(
      await hashearContrasena("una frase bien larga"),
    );
  });

  it("no acepta un formato guardado roto", async () => {
    expect(await verificarContrasena("x", "")).toBe(false);
    expect(await verificarContrasena("x", "pbkdf2-sha256$100000$zz$00")).toBe(false);
    expect(await verificarContrasena("x", "md5$1$00$00")).toBe(false);
  });
});

describe("códigos", () => {
  it("el de recuperación tiene el formato XXXX-XXXX-XXXX-XXXX sin caracteres ambiguos", () => {
    const codigo = generarCodigoDeRecuperacion();

    expect(codigo).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
    expect(codigo).not.toMatch(/[01OIL]/);
  });

  it("no se repiten", () => {
    const codigos = new Set(Array.from({ length: 200 }, generarCodigoDeRecuperacion));

    expect(codigos.size).toBe(200);
  });

  it("se compara sin importar mayúsculas, guiones ni espacios", async () => {
    expect(normalizarCodigo("abcd-efgh 2345")).toBe("ABCDEFGH2345");
    expect(await hashearCodigo("abcd-efgh-2345")).toBe(await hashearCodigo("ABCDEFGH2345"));
  });

  it("el de invitación es NTVX-XXXX-XXXX-XXXX y se compara sin el prefijo ni el formato", async () => {
    const codigo = generarCodigoDeInvitacion();

    expect(codigo).toMatch(/^NTVX-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(await hashearCodigoDeInvitacion(codigo.toLowerCase())).toBe(
      await hashearCodigoDeInvitacion(codigo.replace("NTVX-", "").replaceAll("-", " ")),
    );
  });

  it("los tokens son de 256 bits y su hash no es el token", async () => {
    const token = generarToken();

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashearToken(token)).not.toBe(token);
    expect(generarToken()).not.toBe(token);
  });
});

describe("compararEnTiempoConstante", () => {
  it("distingue iguales, distintos y de distinto largo", () => {
    expect(compararEnTiempoConstante("abc", "abc")).toBe(true);
    expect(compararEnTiempoConstante("abc", "abd")).toBe(false);
    expect(compararEnTiempoConstante("abc", "abcd")).toBe(false);
  });
});
