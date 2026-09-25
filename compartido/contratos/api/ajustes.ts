import * as v from "valibot";

// Lo que el administrador decide en "Ajustes". El webhook de avisos NO está acá: es un secreto que
// solo lee el servidor y nunca vuelve al navegador.
export const esquemaAjustes = v.object({
  // Qué se avisa al canal (lo que no se pudo reparar solo se avisa siempre).
  avisar: v.object({
    reparadoSolo: v.boolean(),
    charlas: v.boolean(),
    resumenDelDia: v.boolean(),
  }),
  operacion: v.object({
    autorreparacion: v.boolean(),
    arranqueConAgenda: v.boolean(),
    equipoDeReserva: v.boolean(),
  }),
  consumo: v.object({
    // Nativox no puede leer el plan de Cloudflare: lo indica el administrador.
    workersPaid: v.boolean(),
    topeMensualUsd: v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100_000))),
    avisarAl80: v.boolean(),
    avisarAl95: v.boolean(),
    avisarCambioDeMotor: v.boolean(),
    notificacionDelNavegador: v.boolean(),
  }),
  subtitulos: v.object({
    corregirLineaAnterior: v.boolean(),
  }),
  // Transcripción en la nube como respaldo (Workers AI): vive en el evento, se cambia desde acá.
  nubeComoRespaldo: v.boolean(),
});

export const AJUSTES_POR_DEFECTO: Ajustes = {
  avisar: { reparadoSolo: true, charlas: true, resumenDelDia: false },
  operacion: { autorreparacion: true, arranqueConAgenda: true, equipoDeReserva: false },
  consumo: {
    workersPaid: false,
    topeMensualUsd: null,
    avisarAl80: true,
    avisarAl95: true,
    avisarCambioDeMotor: true,
    notificacionDelNavegador: false,
  },
  subtitulos: { corregirLineaAnterior: true },
  nubeComoRespaldo: false,
};

export const esquemaRespuestaAjustes = v.object({
  ok: v.literal(true),
  ajustes: esquemaAjustes,
  // Si hay un webhook guardado; la dirección nunca se devuelve.
  webhookConfigurado: v.boolean(),
});

// La dirección del webhook, o null para borrarlo. Solo Discord, Slack o Google Chat.
export const esquemaWebhook = v.object({
  url: v.nullable(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(500),
      v.url("Pegá la dirección completa del webhook."),
    ),
  ),
});

export const esquemaActualizarEvento = v.object({
  nombre: v.pipe(v.string(), v.trim(), v.minLength(1, "Poné un nombre."), v.maxLength(80)),
  logo: v.nullable(v.string()),
  fechaInicio: v.nullable(v.pipe(v.string(), v.isoDate("La fecha no es válida."))),
  fechaFin: v.nullable(v.pipe(v.string(), v.isoDate("La fecha no es válida."))),
});

export const esquemaCambiarContrasena = v.object({
  actual: v.pipe(v.string(), v.maxLength(200)),
  nueva: v.pipe(
    v.string(),
    v.minLength(12, "La contraseña nueva tiene que tener al menos 12 caracteres."),
    v.maxLength(200),
  ),
});

export const esquemaConContrasena = v.object({ contrasena: v.pipe(v.string(), v.maxLength(200)) });

export const esquemaEliminarEvento = v.object({ nombre: v.string() });

export type Ajustes = v.InferOutput<typeof esquemaAjustes>;
export type ActualizarEvento = v.InferOutput<typeof esquemaActualizarEvento>;

// Las preferencias que aplica la computadora de la sala (las ve también el operador).
export const esquemaPreferenciasDeSesion = v.object({
  ok: v.literal(true),
  autorreparacion: v.boolean(),
  arranqueConAgenda: v.boolean(),
  corregirLineaAnterior: v.boolean(),
});

export type PreferenciasDeSesion = v.InferOutput<typeof esquemaPreferenciasDeSesion>;
