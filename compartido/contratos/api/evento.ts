import * as v from "valibot";

export const TIPOS_DE_EVENTO = ["todo-en-uno", "roles-separados"] as const;
export const esquemaTipoDeEvento = v.picklist(TIPOS_DE_EVENTO);
export type TipoDeEvento = v.InferOutput<typeof esquemaTipoDeEvento>;

// El logo viaja como imagen chica en una data URL (la app la achica antes de enviarla).
export const LARGO_MAXIMO_DE_LOGO = 150_000;
const esquemaLogo = v.pipe(
  v.string(),
  v.maxLength(LARGO_MAXIMO_DE_LOGO, "El logo es demasiado pesado."),
  v.regex(
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/,
    "El logo no es una imagen válida.",
  ),
);

const esquemaFecha = v.pipe(v.string(), v.isoDate("La fecha no es válida."));

export const LIMITES_DE_ESTIMACION = {
  salas: { minimo: 1, maximo: 60 },
  horas: { minimo: 1, maximo: 16 },
  dias: { minimo: 1, maximo: 14 },
} as const;

const entero = (limites: { minimo: number; maximo: number }) =>
  v.pipe(v.number(), v.integer(), v.minValue(limites.minimo), v.maxValue(limites.maximo));

export const esquemaDatosEvento = v.pipe(
  v.object({
    tipo: esquemaTipoDeEvento,
    nombre: v.pipe(v.string(), v.trim(), v.minLength(1, "Poné un nombre."), v.maxLength(80)),
    logo: v.optional(v.nullable(esquemaLogo)),
    fechaInicio: v.optional(v.nullable(esquemaFecha)),
    fechaFin: v.optional(v.nullable(esquemaFecha)),
    salasSimultaneas: entero(LIMITES_DE_ESTIMACION.salas),
    horasPorDia: entero(LIMITES_DE_ESTIMACION.horas),
    dias: entero(LIMITES_DE_ESTIMACION.dias),
    nubeComoRespaldo: v.boolean(),
  }),
  v.forward(
    v.check(
      (evento) => !evento.fechaInicio || !evento.fechaFin || evento.fechaInicio <= evento.fechaFin,
      "La fecha de fin no puede ser anterior a la de inicio.",
    ),
    ["fechaFin"],
  ),
);

export type DatosEvento = v.InferOutput<typeof esquemaDatosEvento>;

// Lo que ve la pantalla de arranque sin haber iniciado sesión: nada sensible.
export const esquemaEstadoDeLaInstancia = v.object({
  ok: v.literal(true),
  hayAdministrador: v.boolean(),
  hayEvento: v.boolean(),
  // Quién es la persona que pregunta (null si no hay sesión válida).
  sesion: v.nullable(v.object({ rol: v.picklist(["administrador", "operador"]) })),
  evento: v.nullable(v.object({ nombre: v.string(), logo: v.nullable(v.string()) })),
});

export type EstadoDeLaInstancia = v.InferOutput<typeof esquemaEstadoDeLaInstancia>;

export const esquemaEventoCompleto = v.object({
  ok: v.literal(true),
  evento: v.object({
    tipo: esquemaTipoDeEvento,
    nombre: v.string(),
    logo: v.nullable(v.string()),
    fechaInicio: v.nullable(v.string()),
    fechaFin: v.nullable(v.string()),
    salasSimultaneas: v.number(),
    horasPorDia: v.number(),
    dias: v.number(),
    nubeComoRespaldo: v.boolean(),
  }),
  email: v.string(),
});

export type EventoCompleto = v.InferOutput<typeof esquemaEventoCompleto>["evento"];
