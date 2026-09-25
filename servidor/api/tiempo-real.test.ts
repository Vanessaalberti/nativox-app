import { describe, expect, it } from "vitest";
import type { Audiencia, Sala } from "@compartido/contratos";
import {
  renovarEnlaceDeAudiencia,
  responderAudiencia,
  responderEnlaceDeAudiencia,
} from "./audiencia";
import { pedido, usarCuentaConSalas } from "./contexto-de-prueba";
import { crearCharla } from "./agenda";
import { abrirSala } from "./tiempo-real";

const entorno = usarCuentaConSalas();

const auditorio = () => (entorno.salas[0] as Sala).id;
const sala2 = () => (entorno.salas[1] as Sala).id;

function socket(salaId: string, rol: string, cookie?: string, conUpgrade = true): Request {
  const encabezados = new Headers();
  if (conUpgrade) encabezados.set("Upgrade", "websocket");
  if (cookie) encabezados.set("Cookie", cookie);
  return new Request(`https://nativox.test/api/salas/${salaId}/ws?rol=${rol}`, {
    headers: encabezados,
  });
}

describe("abrir el WebSocket de una sala", () => {
  it("cualquiera puede mirar sin cuenta, y la sala recibe el rol que decidió el servidor", async () => {
    const respuesta = await abrirSala(
      socket(auditorio(), "espectador"),
      entorno.contexto,
      auditorio(),
    );

    expect(respuesta.status).toBe(200);
    expect(entorno.contexto.tiempoReal.conexiones).toEqual([
      { salaId: auditorio(), rol: "espectador" },
    ]);
  });

  it("un encabezado de rol puesto por el navegador no cuenta: se pisa con el del servidor", async () => {
    const intento = new Request(`https://nativox.test/api/salas/${auditorio()}/ws?rol=espectador`, {
      headers: { Upgrade: "websocket", "X-Nativox-Rol": "publicador" },
    });

    await abrirSala(intento, entorno.contexto, auditorio());

    expect(entorno.contexto.tiempoReal.conexiones[0]?.rol).toBe("espectador");
  });

  it("publicar y monitorear piden sesión", async () => {
    const publicar = await abrirSala(
      socket(auditorio(), "publicador"),
      entorno.contexto,
      auditorio(),
    );
    const monitorear = await abrirSala(
      socket(auditorio(), "monitor"),
      entorno.contexto,
      auditorio(),
    );

    expect([publicar.status, monitorear.status]).toEqual([401, 401]);
    expect(entorno.contexto.tiempoReal.conexiones).toEqual([]);
  });

  it("el administrador publica y monitorea cualquier sala", async () => {
    const publicar = await abrirSala(
      socket(sala2(), "publicador", entorno.cookie),
      entorno.contexto,
      sala2(),
    );
    const monitorear = await abrirSala(
      socket(sala2(), "monitor", entorno.cookie),
      entorno.contexto,
      sala2(),
    );

    expect([publicar.status, monitorear.status]).toEqual([200, 200]);
  });

  it("un operador solo publica en sus salas", async () => {
    const cookie = await entorno.cookieDeOperador([auditorio()]);

    const propia = await abrirSala(
      socket(auditorio(), "publicador", cookie),
      entorno.contexto,
      auditorio(),
    );
    const ajena = await abrirSala(socket(sala2(), "publicador", cookie), entorno.contexto, sala2());

    expect([propia.status, ajena.status]).toEqual([200, 403]);
  });

  it("rechaza lo que no es un WebSocket, un rol inventado y una sala inexistente", async () => {
    const sinUpgrade = await abrirSala(
      socket(auditorio(), "espectador", undefined, false),
      entorno.contexto,
      auditorio(),
    );
    const rolInventado = await abrirSala(
      socket(auditorio(), "dueno"),
      entorno.contexto,
      auditorio(),
    );
    const inexistente = await abrirSala(
      socket("aaaaaaaaaaaa", "espectador"),
      entorno.contexto,
      "aaaaaaaaaaaa",
    );

    expect([sinUpgrade.status, rolInventado.status, inexistente.status]).toEqual([426, 400, 404]);
  });
});

describe("audiencia", () => {
  it("lista las salas con su agenda y si están en vivo, sin glosarios", async () => {
    await crearCharla(
      pedido(
        `/api/salas/${auditorio()}/charlas`,
        {
          titulo: "Keynote",
          fecha: "2026-10-05",
          inicioMin: 600,
          finMin: 660,
          glosario: "secreto interno",
        },
        entorno.cookie,
      ),
      entorno.contexto,
      auditorio(),
    );
    entorno.contexto.tiempoReal.enVivo.add(auditorio());

    const enlace = await responderEnlaceDeAudiencia(
      pedido("/api/audiencia/enlace", undefined, entorno.cookie, "GET"),
      entorno.contexto,
    );
    const { token } = (await enlace.json()) as { token: string };
    const respuesta = await responderAudiencia(
      pedido(`/api/audiencia?t=${token}`, undefined, undefined, "GET"),
      entorno.contexto,
    );
    const cuerpo = (await respuesta.json()) as Audiencia;

    expect(cuerpo.salas.map((sala) => [sala.nombre, sala.enVivo])).toEqual([
      ["Auditorio", true],
      ["Sala 2", false],
    ]);
    expect(cuerpo.salas[0]?.charlas[0]).toMatchObject({ titulo: "Keynote", inicioMin: 600 });
    expect(JSON.stringify(cuerpo)).not.toContain("secreto interno");
  });

  it("sin el link no se ve nada, y uno nuevo deja sin efecto el anterior", async () => {
    const pedirEnlace = async (metodo: "GET" | "POST") => {
      const funcion = metodo === "GET" ? responderEnlaceDeAudiencia : renovarEnlaceDeAudiencia;
      const respuesta = await funcion(
        pedido("/api/audiencia/enlace", undefined, entorno.cookie, metodo),
        entorno.contexto,
      );
      return ((await respuesta.json()) as { token: string }).token;
    };
    const ver = (consulta: string) =>
      responderAudiencia(
        pedido(`/api/audiencia${consulta}`, undefined, undefined, "GET"),
        entorno.contexto,
      );
    const viejo = await pedirEnlace("GET");
    const nuevo = await pedirEnlace("POST");

    const estados = [
      (await ver("")).status,
      (await ver("?t=inventado")).status,
      (await ver(`?t=${viejo}`)).status,
      (await ver(`?t=${nuevo}`)).status,
    ];
    const sinSesion = await responderEnlaceDeAudiencia(
      pedido("/api/audiencia/enlace", undefined, undefined, "GET"),
      entorno.contexto,
    );

    expect([...estados, sinSesion.status]).toEqual([404, 404, 404, 200, 401]);
    expect(nuevo).not.toBe(viejo);
  });
});
