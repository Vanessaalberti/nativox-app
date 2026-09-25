import type { Idioma, Linea, Resultado } from "@compartido/contratos";
import { leerGlosario } from "@compartido/glosario";
import {
  abrirArchivo,
  abrirEnlace,
  abrirEntrada,
  abrirPestana,
  type Captura,
  type OpcionesCaptura,
} from "@navegador/modulos/captura-audio";
import { pasadaProvisoriaDelNivel, type Nivel } from "@navegador/modulos/evaluar-equipo";
import { crearCortador } from "@navegador/modulos/cortador-audio";
import {
  crearFlujoSubtitulos,
  type FlujoSubtitulos,
  type Medicion,
} from "@navegador/modulos/flujo-subtitulos";
import { transcribirEnLaNube } from "@navegador/modulos/cliente-instancia";
import {
  borrarSuperposicion,
  crearAcuerdoLocal,
  crearWhisperLocal,
  crearWhisperNube,
  transcribirSinAlucinaciones,
} from "@navegador/modulos/transcripcion";
import {
  crearCola,
  traducirConContexto,
  ultimoTramoSinCerrar,
} from "@navegador/modulos/traduccion";
import type { DondeSeTranscribe, ElegirTraductor, ModelosListos } from "./preparar-modelos";

type Fuente =
  | { tipo: "entrada"; idDispositivo: string | null }
  | { tipo: "pestana" }
  | { tipo: "enlace"; direccion: string }
  | { tipo: "archivo"; archivo: File };

export interface ConfiguracionSesion {
  fuente: Fuente;
  idiomaOriginal: Idioma;
  idiomasDestino: Idioma[];
  glosario: string;
  // La barra de velocidad: cada cuánto se muestra lo que se viene diciendo (1 = solo frases completas).
  nivel: Nivel;
  traductor: ElegirTraductor;
  // Dónde se transcribe: en esta computadora o en la nube, por frases de 4 a 8 s.
  donde: DondeSeTranscribe;
  // Una prueba: se ve y se mide acá, pero no se publica en la sala ni se guarda.
  prueba: boolean;
}

export interface EventosSesion {
  alCambiarLinea: (linea: Linea) => void;
  alMedir: (medicion: Medicion) => void;
  alFallar: (motivo: string) => void;
  alTerminarCaptura: (motivo: string) => void;
  // El volumen (0 a 1) de cada bloque de audio que entra; lo usa el monitoreo.
  alNivel?: (nivel: number) => void;
}

export interface SesionArmada {
  captura: Captura;
  flujo: FlujoSubtitulos;
  // Suma términos al glosario de la sesión que está corriendo: valen desde la próxima frase, para
  // transcribir y para proteger la traducción.
  agregarAlGlosario: (texto: string) => void;
}

// El valor más alto del bloque, de 0 a 1: alcanza para una barra de nivel.
function picoDe(bloque: Float32Array): number {
  let pico = 0;
  for (const muestra of bloque) pico = Math.max(pico, Math.abs(muestra));
  return Math.min(1, pico);
}

// Frases de 4 a 8 s: cuida el límite de pedidos y le da a Whisper el contexto que necesita. El
// mínimo es fijo (el ajuste por velocidad es del motor local).
const MINIMO_EN_LA_NUBE_SEGUNDOS = 4;
const MAXIMO_EN_LA_NUBE_SEGUNDOS = 8;

function cortadorDeLaNube() {
  const cortador = crearCortador({
    minimoSegundos: MINIMO_EN_LA_NUBE_SEGUNDOS,
    maximoSegundos: MAXIMO_EN_LA_NUBE_SEGUNDOS,
  });
  return { ...cortador, cambiarMinimo: () => undefined };
}

function abrirFuente(fuente: Fuente, opciones: OpcionesCaptura): Promise<Resultado<Captura>> {
  switch (fuente.tipo) {
    case "archivo":
      return abrirArchivo(fuente.archivo, opciones);
    case "enlace":
      return abrirEnlace(fuente.direccion, opciones);
    case "pestana":
      return abrirPestana(opciones);
    case "entrada":
      return abrirEntrada(fuente.idDispositivo, opciones);
  }
}

export async function armarSesion(
  { modelos, traductor }: ModelosListos,
  configuracion: ConfiguracionSesion,
  eventos: EventosSesion,
): Promise<Resultado<SesionArmada>> {
  const glosario = leerGlosario(configuracion.glosario);
  const enLaNube = configuracion.donde === "nube";
  if (!enLaNube && !modelos) {
    return { ok: false, motivo: "No se cargó Whisper en esta computadora." };
  }
  const transcriptor =
    enLaNube || !modelos
      ? crearWhisperNube({ transcribir: transcribirEnLaNube })
      : crearWhisperLocal(modelos);
  const cola = crearCola();

  const flujo = crearFlujoSubtitulos({
    idSesion: String(Date.now()),
    idiomaOriginal: configuracion.idiomaOriginal,
    idiomasDestino: configuracion.idiomasDestino,
    glosario,
    // Por frases enteras: la nube no hace texto provisorio (cada pasada se factura).
    pasadaProvisoriaCadaMs: enLaNube ? 0 : pasadaProvisoriaDelNivel(configuracion.nivel),
    cortador: enLaNube ? cortadorDeLaNube() : crearCortador({ minimoSegundos: 1.5 }),
    transcribir: (audio, opciones) => transcribirSinAlucinaciones(transcriptor, audio, opciones),
    // La nube ya saca el audio de contexto por el horario de cada palabra.
    quitarRepetido: enLaNube ? (_anterior, nuevo) => nuevo : borrarSuperposicion,
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
    alRecibir: (bloque: Float32Array) => {
      eventos.alNivel?.(picoDe(bloque));
      flujo.agregarAudio(bloque);
    },
    alTerminar: eventos.alTerminarCaptura,
  };
  const captura = await abrirFuente(configuracion.fuente, opcionesCaptura);
  if (!captura.ok) return captura;
  return {
    ok: true,
    valor: {
      captura: captura.valor,
      flujo,
      // El flujo y la traducción leen este mismo arreglo: lo que se le suma llega a los dos.
      agregarAlGlosario: (texto) => glosario.push(...leerGlosario(texto)),
    },
  };
}
