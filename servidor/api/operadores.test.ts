import { describe, expect, it } from "vitest";
import type { Operador, OperadorConCodigo, Sala } from "@compartido/contratos";
import { ingresarOperador } from "./acceso";
import { listarCharlas } from "./agenda";
import { pedido, usarCuentaConSalas } from "./contexto-de-prueba";
import { responderEstado } from "./evento";
import {
  actualizarOperador,
  borrarOperador,
  crearOperadores,
  listarOperadores,
  nuevoCodigo,
} from "./operadores";
import { crearSalas, leerSala, listarSalas } from "./salas";

const entorno = usarCuentaConSalas();

const auditorio = () => (entorno.salas[0] as Sala).id;
const sala2 = () => (entorno.salas[1] as Sala).id;

async function invitar(nombre: string, salaIds: string[]): Promise<OperadorConCodigo> {
  const respuesta = await crearOperadores(
    pedido("/api/operadores", { personas: [{ nombre, salaIds }] }, entorno.cookie),
    entorno.contexto,
  );
  return ((await respuesta.json()) as { operadores: OperadorConCodigo[] })
    .operadores[0] as OperadorConCodigo;
}

// Entra con el código y devuelve la cookie de esa sesión.
async function entrar(codigo: string): Promise<{ estado: number; cookie: string }> {
  const respuesta = await ingresarOperador(
    pedido("/api/acceso/operador", { codigo }),
    entorno.contexto,
  );
  return {
    estado: respuesta.status,
    cookie: (respuesta.headers.get("Set-Cookie") ?? "").split(";")[0] ?? "",
  };
}

const como = (cookie: string, ruta: string, cuerpo?: unknown, metodo = "GET") =>
  pedido(ruta, cuerpo, cookie, metodo);

describe("invitar", () => {
  it("crea a la persona con sus salas y un código NTVX-XXXX-XXXX-XXXX que viaja una sola vez", async () => {
    const persona = await invitar("Juli", [auditorio()]);

    expect(persona.codigo).toMatch(/^NTVX-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(persona).toMatchObject({ nombre: "Juli", salaIds: [auditorio()], estado: "invitado" });
    const lista = (await (
      await listarOperadores(como(entorno.cookie, "/api/operadores"), entorno.contexto)
    ).json()) as { operadores: Operador[] };
    expect(JSON.stringify(lista)).not.toContain(persona.codigo);
    expect(lista.operadores).toHaveLength(1);
  });

  it("invita a varias personas de una, cada una con su código", async () => {
    const respuesta = await crearOperadores(
      pedido(
        "/api/operadores",
        {
          personas: [
            { nombre: "Ana", salaIds: [] },
            { nombre: "Beto", salaIds: [sala2()] },
          ],
        },
        entorno.cookie,
      ),
      entorno.contexto,
    );
    const { operadores } = (await respuesta.json()) as { operadores: OperadorConCodigo[] };

    expect(respuesta.status).toBe(201);
    expect(new Set(operadores.map((persona) => persona.codigo)).size).toBe(2);
  });

  it("rechaza salas que no existen, nombres vacíos y a quien no es administrador", async () => {
    const inexistente = await crearOperadores(
      pedido(
        "/api/operadores",
        { personas: [{ nombre: "Ana", salaIds: ["aaaaaaaaaaaa"] }] },
        entorno.cookie,
      ),
      entorno.contexto,
    );
    const sinNombre = await crearOperadores(
      pedido("/api/operadores", { personas: [{ nombre: " ", salaIds: [] }] }, entorno.cookie),
      entorno.contexto,
    );
    const persona = await invitar("Juli", []);
    const { cookie } = await entrar(persona.codigo);
    const comoOperador = await listarOperadores(como(cookie, "/api/operadores"), entorno.contexto);

    expect([inexistente.status, sinNombre.status, comoOperador.status]).toEqual([400, 400, 403]);
  });
});

describe("ingresar con el código", () => {
  it("entra sin importar mayúsculas, guiones ni el prefijo, y pasa a Activo", async () => {
    const persona = await invitar("Juli", [auditorio()]);
    const sinFormato = persona.codigo.replace("NTVX-", "").replaceAll("-", "").toLowerCase();

    const { estado, cookie } = await entrar(sinFormato);
    const sesion = (await (
      await responderEstado(como(cookie, "/api/estado"), entorno.contexto)
    ).json()) as { sesion: { rol: string } };
    const lista = (await (
      await listarOperadores(como(entorno.cookie, "/api/operadores"), entorno.contexto)
    ).json()) as { operadores: Operador[] };

    expect(estado).toBe(200);
    expect(sesion.sesion.rol).toBe("operador");
    expect(lista.operadores[0]?.estado).toBe("activo");
  });

  it("un código incorrecto se rechaza y, tras 8 intentos desde un mismo origen, se frena", async () => {
    const persona = await invitar("Juli", []);

    for (let i = 0; i < 8; i += 1) expect((await entrar("NTVX-AAAA-BBBB-CCCC")).estado).toBe(401);
    const bloqueado = await entrar(persona.codigo);
    entorno.contexto.reloj += 16 * 60 * 1000;
    const despues = await entrar(persona.codigo);

    expect(bloqueado.estado).toBe(429);
    expect(despues.estado).toBe(200);
  });
});

describe("lo que ve un operador", () => {
  it("solo sus salas: no ve las otras ni sus charlas", async () => {
    const persona = await invitar("Juli", [auditorio()]);
    const { cookie } = await entrar(persona.codigo);

    const lista = (await (
      await listarSalas(como(cookie, "/api/salas"), entorno.contexto)
    ).json()) as {
      salas: Sala[];
    };
    const propia = await leerSala(
      como(cookie, `/api/salas/${auditorio()}`),
      entorno.contexto,
      auditorio(),
    );
    const ajena = await leerSala(como(cookie, `/api/salas/${sala2()}`), entorno.contexto, sala2());
    const charlasAjenas = await listarCharlas(
      como(cookie, `/api/salas/${sala2()}/charlas`),
      entorno.contexto,
      sala2(),
    );

    expect(lista.salas.map((sala) => sala.nombre)).toEqual(["Auditorio"]);
    expect([propia.status, ajena.status, charlasAjenas.status]).toEqual([200, 403, 403]);
  });

  it("no puede crear salas ni cambiar nada", async () => {
    const persona = await invitar("Juli", [auditorio()]);
    const { cookie } = await entrar(persona.codigo);

    const crear = await crearSalas(
      como(
        cookie,
        "/api/salas",
        { salas: [{ nombre: "X", idiomaOriginal: "es", idiomasDestino: [] }] },
        "POST",
      ),
      entorno.contexto,
    );

    expect(crear.status).toBe(403);
    expect(await entorno.contexto.agenda.listarSalas()).toHaveLength(2);
  });

  it("si el administrador le cambia las salas, lo nota en el próximo pedido", async () => {
    const persona = await invitar("Juli", [auditorio()]);
    const { cookie } = await entrar(persona.codigo);

    await actualizarOperador(
      como(
        entorno.cookie,
        `/api/operadores/${String(persona.id)}`,
        { nombre: "Juli R.", salaIds: [sala2()] },
        "PUT",
      ),
      entorno.contexto,
      String(persona.id),
    );
    const lista = (await (
      await listarSalas(como(cookie, "/api/salas"), entorno.contexto)
    ).json()) as {
      salas: Sala[];
    };

    expect(lista.salas.map((sala) => sala.nombre)).toEqual(["Sala 2"]);
  });
});

describe("revocar", () => {
  it("un código nuevo deja sin efecto el anterior y cierra la sesión abierta", async () => {
    const persona = await invitar("Juli", [auditorio()]);
    const { cookie } = await entrar(persona.codigo);

    const respuesta = await nuevoCodigo(
      como(entorno.cookie, `/api/operadores/${String(persona.id)}/codigo`, {}, "POST"),
      entorno.contexto,
      String(persona.id),
    );
    const { codigo } = (await respuesta.json()) as { codigo: string };

    expect((await entrar(persona.codigo)).estado).toBe(401);
    expect((await listarSalas(como(cookie, "/api/salas"), entorno.contexto)).status).toBe(401);
    expect((await entrar(codigo)).estado).toBe(200);
  });

  it("eliminar a la persona le quita el acceso al instante", async () => {
    const persona = await invitar("Juli", [auditorio()]);
    const { cookie } = await entrar(persona.codigo);

    const respuesta = await borrarOperador(
      como(entorno.cookie, `/api/operadores/${String(persona.id)}`, undefined, "DELETE"),
      entorno.contexto,
      String(persona.id),
    );

    expect(respuesta.status).toBe(200);
    expect((await listarSalas(como(cookie, "/api/salas"), entorno.contexto)).status).toBe(401);
    expect((await entrar(persona.codigo)).estado).toBe(401);
  });

  it("una persona que no existe da 404", async () => {
    const respuestas = await Promise.all([
      nuevoCodigo(
        como(entorno.cookie, "/api/operadores/99/codigo", {}, "POST"),
        entorno.contexto,
        "99",
      ),
      borrarOperador(
        como(entorno.cookie, "/api/operadores/99", undefined, "DELETE"),
        entorno.contexto,
        "99",
      ),
      actualizarOperador(
        como(entorno.cookie, "/api/operadores/99", { nombre: "X", salaIds: [] }, "PUT"),
        entorno.contexto,
        "99",
      ),
    ]);

    expect(respuestas.map((respuesta) => respuesta.status)).toEqual([404, 404, 404]);
  });
});
