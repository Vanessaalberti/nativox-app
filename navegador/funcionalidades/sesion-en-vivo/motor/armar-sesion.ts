import type { Idioma, Linea, Resultado } from "@compartido/contratos";
import { leerGlosario } from "@compartido/glosario";
import { abrirArchivo, abrirEntrada, type Captura } from "@navegador/modulos/captura-audio";
import { crearCortador } from "@navegador/modulos/cortador-audio";
import {
  crearFlujoSubtitulos,
  type FlujoSubtitulos,
  type Medicion,
} from "@navegador/modulos/flujo-subtitulos";
import {
  borrarSuperposicion,
  crearAcuerdoLocal,
  crearWhisperLocal,
  transcribirSinAlucinaciones,
} from "@navegador/modulos/transcripcion";
import {
  crearCola,
  traducirConContexto,
  ultimoTramoSinCerrar,
} from "@navegador/modulos/traduccion";
import type { ModelosListos } from "./preparar-modelos";

type Fuente =
  { tipo: "entrada"; idDispositivo: string | null } | { tipo: "archivo"; archivo: File };

export interface ConfiguracionSesion {
  fuente: Fuente;
  idiomaOriginal: Idioma;
  idiomasDestino: Idioma[];
  glosario: string;
  // Texto provisorio mientras se habla (transcripción en vivo de verdad).
  textoEnVivo: boolean;
}

export interface EventosSesion {
  alCambiarLinea: (linea: Linea) => void;
  alMedir: (medicion: Medicion) => void;
  alFallar: (motivo: string) => void;
  alTerminarCaptura: (motivo: string) => void;
}

export interface SesionArmada {
  captura: Captura;
  flujo: FlujoSubtitulos;
}

const PASADA_PROVISORIA_MS = 1000;

export async function armarSesion(
  { modelos, traductor }: ModelosListos,
  configuracion: ConfiguracionSesion,
  eventos: EventosSesion,
): Promise<Resultado<SesionArmada>> {
  const glosario = leerGlosario(configuracion.glosario);
  const transcriptor = crearWhisperLocal(modelos);
  const cola = crearCola();

  const flujo = crearFlujoSubtitulos({
    idSesion: String(Date.now()),
    idiomaOriginal: configuracion.idiomaOriginal,
    idiomasDestino: configuracion.idiomasDestino,
    glosario,
    pasadaProvisoriaCadaMs: configuracion.textoEnVivo ? PASADA_PROVISORIA_MS : 0,
    cortador: crearCortador({ minimoSegundos: 1.5 }),
    transcribir: (audio, opciones) => transcribirSinAlucinaciones(transcriptor, audio, opciones),
    quitarRepetido: borrarSuperposicion,
    crearAcuerdo: crearAcuerdoLocal,
    traducir: ({ texto, anterior, de, a }) =>
      cola(() =>
        traducirConContexto(traductor, {
          texto,
          contexto: ultimoTramoSinCerrar(anterior),
          glosario,
          de,
          a,
        }),
      ),
    ahoraMs: () => performance.now(),
    alCambiarLinea: eventos.alCambiarLinea,
    alMedir: eventos.alMedir,
    alFallar: eventos.alFallar,
  });

  const opcionesCaptura = {
    alRecibir: (bloque: Float32Array) => flujo.agregarAudio(bloque),
    alTerminar: eventos.alTerminarCaptura,
  };
  const captura =
    configuracion.fuente.tipo === "archivo"
      ? await abrirArchivo(configuracion.fuente.archivo, opcionesCaptura)
      : await abrirEntrada(configuracion.fuente.idDispositivo, opcionesCaptura);
  if (!captura.ok) return captura;
  return { ok: true, valor: { captura: captura.valor, flujo } };
}
