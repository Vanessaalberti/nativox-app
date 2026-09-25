import { beforeEach, describe, expect, it } from "vitest";
import type { Charla, Sala } from "@compartido/contratos";
import { actualizarCharla, borrarCharla, crearCharla, listarCharlas } from "./agenda";
import { abrirCuenta, crearContextoDePrueba, pedido } from "./contexto-de-prueba";
import { actualizarSala, borrarSala, crearSalas, leerSala, listarSalas } from "./salas";

const SALA = { nombre: "Auditorio", idiomaOriginal: "es", idiomasDestino: ["en", "pt"] };
const CHARLA = {
  titulo: "Kubernetes en producción",
  resumen: "Cómo operamos clusters en AWS.",
  oradores: "Ana Pérez",
  fecha: "2026-10-05",
  inicioMin: 9 * 60,
  finMin: 10 * 60,
};

let contexto = crearContextoDePrueba();
let cookie = "";

beforeEach(async () => {
  contexto = crearContextoDePrueba();
  ({ cookie } = await abrirCuenta(contexto));
});

const enviar = (ruta: string, cuerpo?: unknown, metodo = "POST", conSesion = true) =>
  pedido(ruta, cuerpo, conSesion ? cookie : undefined, metodo);

async function nuevaSala(datos: unknown = SALA): Promise<Sala> {
  const respuesta = await crearSalas(enviar("/api/salas", { salas: [datos] }), contexto);
  return ((await respuesta.json()) as { salas: Sala[] }).salas[0] as Sala;
}

async function nuevaCharla(salaId: string, datos: unknown = CHARLA): Promise<Response> {
  return crearCharla(enviar(`/api/salas/${salaId}/charlas`, datos), contexto, salaId);
}

describe("salas", () => {
  it("crea una sala o varias de una, con sus idiomas, y las lista en orden", async () => {
    const respuesta = await crearSalas(
      enviar("/api/salas", {
        salas: [SALA, { nombre: "Sala 2", idiomaOriginal: "en", idiomasDestino: [] }],
      }),
      contexto,
    );
    const lista = (await (
      await listarSalas(enviar("/api/salas", undefined, "GET"), contexto)
    ).json()) as {
      salas: Sala[];
    };

    expect(respuesta.status).toBe(201);
    expect(lista.salas.map((sala) => sala.nombre)).toEqual(["Auditorio", "Sala 2"]);
    expect(lista.salas[0]).toMatchObject({
      idiomaOriginal: "es",
      idiomasDestino: ["en", "pt"],
      charlas: 0,
    });
  });

  it("valida el nombre y los idiomas: nada se crea si una sala del lote está mal", async () => {
    const invalidos = [
      { salas: [] },
      { salas: [{ ...SALA, nombre: "  " }] },
      { salas: [{ ...SALA, idiomasDestino: ["es"] }] },
      { salas: [{ ...SALA, idiomasDestino: ["en", "en"] }] },
      { salas: [SALA, { ...SALA, idiomaOriginal: "fr" }] },
    ];

    for (const cuerpo of invalidos) {
      expect((await crearSalas(enviar("/api/salas", cuerpo), contexto)).status).toBe(400);
    }
    expect(await contexto.agenda.listarSalas()).toEqual([]);
  });

  it("solo el administrador con sesión las ve o las cambia", async () => {
    const sala = await nuevaSala();

    const respuestas = await Promise.all([
      listarSalas(enviar("/api/salas", undefined, "GET", false), contexto),
      crearSalas(enviar("/api/salas", { salas: [SALA] }, "POST", false), contexto),
      actualizarSala(enviar(`/api/salas/${sala.id}`, SALA, "PUT", false), contexto, sala.id),
      borrarSala(enviar(`/api/salas/${sala.id}`, undefined, "DELETE", false), contexto, sala.id),
    ]);

    expect(respuestas.map((respuesta) => respuesta.status)).toEqual([401, 401, 401, 401]);
    expect(await contexto.agenda.listarSalas()).toHaveLength(1);
  });

  it("cambia el nombre y los idiomas; una sala inexistente da 404", async () => {
    const sala = await nuevaSala();
    const cambiada = await actualizarSala(
      enviar(
        `/api/salas/${sala.id}`,
        { nombre: "Escenario", idiomaOriginal: "en", idiomasDestino: ["es"] },
        "PUT",
      ),
      contexto,
      sala.id,
    );
    const inexistente = await leerSala(
      enviar("/api/salas/aaaaaaaaaaaa", undefined, "GET"),
      contexto,
      "aaaaaaaaaaaa",
    );

    expect(await cambiada.json()).toMatchObject({
      sala: { nombre: "Escenario", idiomaOriginal: "en", idiomasDestino: ["es"] },
    });
    expect(inexistente.status).toBe(404);
  });

  it("borrar una sala borra también sus charlas", async () => {
    const sala = await nuevaSala();
    await nuevaCharla(sala.id);

    const respuesta = await borrarSala(
      enviar(`/api/salas/${sala.id}`, undefined, "DELETE"),
      contexto,
      sala.id,
    );

    expect(respuesta.status).toBe(200);
    expect(await contexto.agenda.listarSalas()).toEqual([]);
    expect(await contexto.agenda.listarCharlas(sala.id)).toEqual([]);
  });
});

describe("agenda", () => {
  it("crea charlas y las lista ordenadas por día y hora", async () => {
    const sala = await nuevaSala();
    await nuevaCharla(sala.id, { ...CHARLA, titulo: "Tarde", inicioMin: 900, finMin: 960 });
    await nuevaCharla(sala.id, { ...CHARLA, titulo: "Mañana" });

    const lista = (await (
      await listarCharlas(
        enviar(`/api/salas/${sala.id}/charlas`, undefined, "GET"),
        contexto,
        sala.id,
      )
    ).json()) as { charlas: Charla[] };

    expect(lista.charlas.map((charla) => charla.titulo)).toEqual(["Mañana", "Tarde"]);
    expect(lista.charlas[0]).toMatchObject({ idioma: null, glosario: "", salaId: sala.id });
    expect((await contexto.agenda.leerSala(sala.id))?.charlas).toBe(2);
  });

  it("no deja dos charlas a la vez en la misma sala, pero sí una justo después de otra", async () => {
    const sala = await nuevaSala();
    await nuevaCharla(sala.id);

    const pisada = await nuevaCharla(sala.id, {
      ...CHARLA,
      titulo: "Otra",
      inicioMin: 9 * 60 + 30,
      finMin: 11 * 60,
    });
    const pegada = await nuevaCharla(sala.id, {
      ...CHARLA,
      titulo: "Siguiente",
      inicioMin: 10 * 60,
      finMin: 11 * 60,
    });
    const otroDia = await nuevaCharla(sala.id, { ...CHARLA, fecha: "2026-10-06" });
    const otraSala = await nuevaCharla((await nuevaSala({ ...SALA, nombre: "Sala 2" })).id);

    expect(pisada.status).toBe(409);
    expect(await pisada.json()).toMatchObject({
      error: { mensaje: "Se superpone con «Kubernetes en producción» (09:00–10:00) en esta sala." },
    });
    expect([pegada.status, otroDia.status, otraSala.status]).toEqual([201, 201, 201]);
  });

  it("valida el título, la fecha y el horario", async () => {
    const sala = await nuevaSala();
    const invalidas = [
      { ...CHARLA, titulo: " " },
      { ...CHARLA, fecha: "5/10/2026" },
      { ...CHARLA, inicioMin: 600, finMin: 600 },
      { ...CHARLA, inicioMin: 600, finMin: 540 },
      { ...CHARLA, finMin: 1441 },
      { ...CHARLA, idioma: "fr" },
    ];

    for (const invalida of invalidas) {
      expect((await nuevaCharla(sala.id, invalida)).status).toBe(400);
    }
  });

  it("edita una charla sin pisarse consigo misma, y guarda su glosario", async () => {
    const sala = await nuevaSala();
    const creada = ((await (await nuevaCharla(sala.id)).json()) as { charla: Charla }).charla;

    const respuesta = await actualizarCharla(
      enviar(
        `/api/charlas/${creada.id}`,
        {
          ...CHARLA,
          finMin: 10 * 60 + 30,
          glosario: "Kubernetes\nNerdearla ~ ner de arla",
          idioma: "en",
        },
        "PUT",
      ),
      contexto,
      creada.id,
    );

    expect(await respuesta.json()).toMatchObject({
      charla: { finMin: 630, idioma: "en", glosario: "Kubernetes\nNerdearla ~ ner de arla" },
    });
  });

  it("una charla inexistente o una sala inexistente dan 404", async () => {
    const sala = await nuevaSala();

    const charla = await actualizarCharla(
      enviar("/api/charlas/bbbbbbbbbbbb", CHARLA, "PUT"),
      contexto,
      "bbbbbbbbbbbb",
    );
    const borrar = await borrarCharla(
      enviar("/api/charlas/bbbbbbbbbbbb", undefined, "DELETE"),
      contexto,
      "bbbbbbbbbbbb",
    );
    const enSalaInexistente = await nuevaCharla("cccccccccccc");

    expect([charla.status, borrar.status, enSalaInexistente.status]).toEqual([404, 404, 404]);
    expect(sala.charlas).toBe(0);
  });

  it("borra una charla", async () => {
    const sala = await nuevaSala();
    const creada = ((await (await nuevaCharla(sala.id)).json()) as { charla: Charla }).charla;

    const respuesta = await borrarCharla(
      enviar(`/api/charlas/${creada.id}`, undefined, "DELETE"),
      contexto,
      creada.id,
    );

    expect(respuesta.status).toBe(200);
    expect(await contexto.agenda.listarCharlas(sala.id)).toEqual([]);
  });
});
