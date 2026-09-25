import * as v from "valibot";

export const MAXIMO_DE_PERSONAS_POR_PEDIDO = 50;

const esquemaIdDeSala = v.pipe(v.string(), v.regex(/^[0-9a-f]{12}$/));

export const esquemaDatosDeOperador = v.object({
  nombre: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Poné el nombre de la persona."),
    v.maxLength(60, "El nombre es demasiado largo."),
  ),
  // Las salas que va a operar; puede quedar vacío y asignarse después.
  salaIds: v.pipe(v.array(esquemaIdDeSala), v.maxLength(200)),
});

export const esquemaCrearOperadores = v.object({
  personas: v.pipe(
    v.array(esquemaDatosDeOperador),
    v.minLength(1),
    v.maxLength(MAXIMO_DE_PERSONAS_POR_PEDIDO),
  ),
});

const esquemaOperador = v.object({
  id: v.number(),
  nombre: v.string(),
  salaIds: v.array(v.string()),
  // "invitado" hasta que la persona entra por primera vez.
  estado: v.picklist(["invitado", "activo"]),
  ultimoIngreso: v.nullable(v.number()),
});

export const esquemaListaDeOperadores = v.object({
  ok: v.literal(true),
  operadores: v.array(esquemaOperador),
});

export const esquemaUnOperador = v.object({ ok: v.literal(true), operador: esquemaOperador });

// Los códigos viajan una sola vez, al crear a la persona o al pedir uno nuevo.
export const esquemaOperadoresConCodigo = v.object({
  ok: v.literal(true),
  operadores: v.array(v.object({ ...esquemaOperador.entries, codigo: v.string() })),
});

export const esquemaCodigoNuevo = v.object({ ok: v.literal(true), codigo: v.string() });

export type DatosDeOperador = v.InferOutput<typeof esquemaDatosDeOperador>;
export type Operador = v.InferOutput<typeof esquemaOperador>;
export type OperadorConCodigo = v.InferOutput<
  typeof esquemaOperadoresConCodigo
>["operadores"][number];
