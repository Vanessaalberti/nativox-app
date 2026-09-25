import * as v from "valibot";
import { esquemaIdioma } from "./idiomas";

const segundos = v.pipe(v.number(), v.minValue(0));

export const esquemaTraducciones = v.partial(
  v.strictObject({ es: v.string(), en: v.string(), pt: v.string() }),
);

// Una línea sale una sola vez con el original y todas las traducciones de la sala; la misma
// línea se actualiza por `id` (provisoria → confirmada, corrección) y nunca se duplica.
export const esquemaLinea = v.pipe(
  v.object({
    tipo: v.literal("linea"),
    id: v.pipe(v.string(), v.nonEmpty()),
    original: v.string(),
    traducciones: esquemaTraducciones,
    provisoria: v.boolean(),
    inicio: segundos,
    fin: segundos,
  }),
  v.check((linea) => linea.fin >= linea.inicio, "fin no puede ser anterior a inicio"),
);

export const esquemaSenal = v.object({
  tipo: v.literal("senal"),
  estado: v.picklist(["en-vivo", "detenida", "reparando"]),
  nivelAudio: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
  latenciaMs: v.pipe(v.number(), v.minValue(0)),
});

export const esquemaComando = v.object({
  tipo: v.literal("comando"),
  id: v.pipe(v.string(), v.nonEmpty()),
  accion: v.picklist(["reiniciar", "pasar-a-la-nube", "silenciar-avisos"]),
});

export const esquemaAgenda = v.object({
  tipo: v.literal("agenda"),
  momento: v.picklist(["empieza", "termina"]),
  charlaId: v.pipe(v.string(), v.nonEmpty()),
  titulo: v.string(),
  idioma: esquemaIdioma,
});

// Lo que la sala le cuenta a quien la monitorea: quién está conectado y la última señal del equipo.
export const esquemaEstadoSala = v.object({
  tipo: v.literal("estado"),
  // Computadoras publicando (0 o 1: un solo dueño por sala) y personas mirando.
  publicando: v.pipe(v.number(), v.integer(), v.minValue(0)),
  espectadores: v.pipe(v.number(), v.integer(), v.minValue(0)),
  senal: v.nullable(esquemaSenal),
  // Cuándo llegó esa señal (milisegundos desde 1970); null si todavía no llegó ninguna.
  senalEn: v.nullable(v.number()),
});

// Cómo se conecta cada quien a la sala: quien publica (la computadora de la sala), quien mira y
// quien monitorea. El servidor decide el rol según la sesión: el navegador no lo elige.
export const ROLES_DE_SALA = ["publicador", "espectador", "monitor"] as const;

export const esquemaMensajeSala = v.variant("tipo", [
  esquemaLinea,
  esquemaSenal,
  esquemaComando,
  esquemaAgenda,
  esquemaEstadoSala,
]);

export type RolDeSala = (typeof ROLES_DE_SALA)[number];
export type EstadoSala = v.InferOutput<typeof esquemaEstadoSala>;
export type Linea = v.InferOutput<typeof esquemaLinea>;
export type Senal = v.InferOutput<typeof esquemaSenal>;
export type Comando = v.InferOutput<typeof esquemaComando>;
export type AvisoAgenda = v.InferOutput<typeof esquemaAgenda>;
export type MensajeSala = v.InferOutput<typeof esquemaMensajeSala>;
