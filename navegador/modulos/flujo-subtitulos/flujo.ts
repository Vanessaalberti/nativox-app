import type { Linea } from "@compartido/contratos";
import { armarPromptWhisper, corregirTranscripcion } from "@compartido/glosario";
import { corregirLimite } from "./correccion-de-limite";
import { crearMinimoAdaptativo } from "./minimo-adaptativo";
import type { FragmentoDeAudio, OpcionesFlujo } from "./tipos";

export interface FlujoSubtitulos {
  agregarAudio(bloque: Float32Array): void;
  // Corta lo que quedó, termina de transcribir y traducir, y resuelve cuando no queda nada.
  terminar(): Promise<void>;
  // Alguien corrigió a mano una línea ya confirmada: se avisa como cualquier otro cambio, el
  // texto corregido pasa a ser el contexto de las frases que siguen y lo escrito a mano no se
  // pisa después. Si cambió el original, las traducciones que no se corrigieron se rehacen.
  corregirLinea(id: string, cambios: CorreccionDeLinea): boolean;
}

export interface CorreccionDeLinea {
  original: string;
  traducciones: Linea["traducciones"];
}

const FRECUENCIA = 16_000;
// Menos de 0,8 s de voz no alcanza para que la pasada provisoria diga algo útil.
const AUDIO_MINIMO_PROVISORIO = 0.8 * FRECUENCIA;

export function crearFlujoSubtitulos(o: OpcionesFlujo): FlujoSubtitulos {
  const lineas = new Map<number, Linea>();
  const acuerdo = o.crearAcuerdo();
  const minimo = crearMinimoAdaptativo((segundos) => o.cortador.cambiarMinimo(segundos));
  let inicioMs: number | null = null;
  let cadena: Promise<void> = Promise.resolve();
  let finalesPendientes = 0;
  let provisoriaEnCurso = false;
  let ultimaProvisoriaMs = Number.NEGATIVE_INFINITY;
  let siguienteNumero = 0;
  // Las líneas corregidas a mano: su original y las traducciones escritas a mano no se pisan.
  const corregidas = new Map<number, Set<string>>();

  const segundosDeCaptura = () => (o.ahoraMs() - (inicioMs ?? o.ahoraMs())) / 1000;

  const aplicar = (numero: number, linea: Linea) => {
    lineas.set(numero, linea);
    o.alCambiarLinea({ ...linea, traducciones: { ...linea.traducciones } });
  };

  const publicar = (numero: number, linea: Linea) => {
    const actual = lineas.get(numero);
    const fijas = corregidas.get(numero);
    if (!actual || !fijas) {
      aplicar(numero, linea);
      return;
    }
    // Una línea corregida a mano: lo que llegue después solo puede sumar traducciones nuevas.
    const escritas = Object.fromEntries(
      Object.entries(actual.traducciones).filter(([idioma]) => fijas.has(idioma)),
    );
    aplicar(numero, {
      ...actual,
      traducciones: { ...linea.traducciones, ...escritas },
    });
  };

  // La última línea confirmada con texto antes de `numero`: con ella se une el límite y se toma
  // el contexto de la traducción.
  const anteriorA = (numero: number) => {
    for (let n = numero - 1; n >= 0; n--) {
      const linea = lineas.get(n);
      if (linea && !linea.provisoria && linea.original !== "") return { numero: n, linea };
    }
    return null;
  };

  const textoReciente = (numero: number) => anteriorA(numero)?.linea.original ?? "";

  async function traducirLinea(numero: number) {
    const linea = lineas.get(numero);
    if (!linea) return 0;
    const inicio = o.ahoraMs();
    for (const a of o.idiomasDestino) {
      const traduccion = await o.traducir({
        texto: linea.original,
        anterior: anteriorA(numero)?.linea.original ?? "",
        de: o.idiomaOriginal,
        a,
      });
      if (!traduccion.ok) {
        o.alFallar(traduccion.motivo);
        continue;
      }
      // Se lee de nuevo: cada idioma que llega se suma a los que ya llegaron.
      const actual = lineas.get(numero) ?? linea;
      publicar(numero, {
        ...actual,
        traducciones: { ...actual.traducciones, [a]: traduccion.valor.texto },
      });
    }
    return o.ahoraMs() - inicio;
  }

  async function transcribirFinal(fragmento: FragmentoDeAudio) {
    const prompt = armarPromptWhisper(o.glosario, textoReciente(fragmento.numero));
    const resultado = await o.transcribir(fragmento.audio, {
      prompt,
      idioma: o.idiomaOriginal,
      segundosDeContexto: fragmento.segundosDeContexto,
    });
    if (!resultado.ok) {
      o.alFallar(resultado.motivo);
      return null;
    }
    minimo.registrarPasada(resultado.valor.ms);
    const sinRepetir =
      fragmento.segundosDeContexto > 0
        ? o.quitarRepetido(textoReciente(fragmento.numero), resultado.valor.texto)
        : resultado.valor.texto;
    return {
      texto: corregirTranscripcion(sinRepetir, o.glosario).texto,
      ms: resultado.valor.ms,
    };
  }

  async function procesarFragmento(fragmento: FragmentoDeAudio) {
    const transcripto = await transcribirFinal(fragmento);
    acuerdo.reiniciar();
    if (!transcripto) return;

    const anterior = anteriorA(fragmento.numero);
    const limite = anterior
      ? corregirLimite(anterior.linea.original, transcripto.texto, o.glosario)
      : { anterior: "", nuevo: transcripto.texto, cambio: false };
    if (anterior && limite.cambio) {
      publicar(anterior.numero, { ...anterior.linea, original: limite.anterior, traducciones: {} });
    }
    publicar(fragmento.numero, {
      tipo: "linea",
      id: `${o.idSesion}-${String(fragmento.numero)}`,
      original: limite.nuevo,
      traducciones: {},
      provisoria: false,
      inicio: fragmento.inicio,
      fin: fragmento.fin,
    });
    if (limite.nuevo === "") return;

    const retrasoConfirmacionSegundos = segundosDeCaptura() - fragmento.fin;
    // Primero la línea nueva (es la que el público está esperando), después la corrección.
    const traduccionMs = await traducirLinea(fragmento.numero);
    if (anterior && limite.cambio) await traducirLinea(anterior.numero);
    o.alMedir({
      numero: fragmento.numero,
      transcripcionMs: transcripto.ms,
      traduccionMs,
      retrasoConfirmacionSegundos,
      retrasoTraduccionSegundos: segundosDeCaptura() - fragmento.fin,
    });
  }

  function encolar(fragmento: FragmentoDeAudio) {
    finalesPendientes++;
    siguienteNumero = fragmento.numero + 1;
    cadena = cadena
      .then(() => procesarFragmento(fragmento))
      .catch((error: unknown) => {
        o.alFallar(
          `No se pudo procesar un fragmento: ${error instanceof Error ? error.message : String(error)}`,
        );
      })
      .finally(() => {
        finalesPendientes--;
      });
  }

  async function pasadaProvisoria() {
    const pendiente = o.cortador.pendiente();
    const numero = siguienteNumero;
    const resultado = await o.transcribir(pendiente.audio, {
      prompt: armarPromptWhisper(o.glosario, textoReciente(numero)),
      idioma: o.idiomaOriginal,
    });
    // Si mientras tanto se cortó la frase, esta pasada ya quedó vieja.
    if (!resultado.ok || finalesPendientes > 0 || numero !== siguienteNumero) return;
    const { estable, provisorio } = acuerdo.agregarPasada(resultado.valor.texto);
    publicar(numero, {
      tipo: "linea",
      id: `${o.idSesion}-${String(numero)}`,
      original: [estable, provisorio].filter(Boolean).join(" "),
      traducciones: {},
      provisoria: true,
      inicio: pendiente.inicio,
      fin: pendiente.inicio + pendiente.audio.length / FRECUENCIA,
    });
  }

  function quizasPasadaProvisoria() {
    const ahora = o.ahoraMs();
    const tocaPasada =
      o.pasadaProvisoriaCadaMs > 0 &&
      !provisoriaEnCurso &&
      finalesPendientes === 0 &&
      ahora - ultimaProvisoriaMs >= o.pasadaProvisoriaCadaMs;
    if (!tocaPasada) return;
    const pendiente = o.cortador.pendiente();
    if (!pendiente.tieneVoz || pendiente.audio.length < AUDIO_MINIMO_PROVISORIO) return;

    provisoriaEnCurso = true;
    ultimaProvisoriaMs = ahora;
    pasadaProvisoria()
      .catch((error: unknown) => {
        o.alFallar(
          `Falló la pasada provisoria: ${error instanceof Error ? error.message : String(error)}`,
        );
      })
      .finally(() => {
        provisoriaEnCurso = false;
      });
  }

  return {
    agregarAudio(bloque) {
      inicioMs ??= o.ahoraMs() - (bloque.length / FRECUENCIA) * 1000;
      for (const fragmento of o.cortador.agregar(bloque)) encolar(fragmento);
      quizasPasadaProvisoria();
    },
    corregirLinea(id, cambios) {
      const encontrada = [...lineas.entries()].find(([, linea]) => linea.id === id);
      if (!encontrada || encontrada[1].provisoria) return false;
      const [numero, actual] = encontrada;
      const cambioElOriginal = cambios.original !== actual.original;
      const anteriores = actual.traducciones as Record<string, string | undefined>;
      const escritas = Object.entries(cambios.traducciones).filter(
        (entrada): entrada is [string, string] =>
          entrada[1] !== undefined && entrada[1] !== anteriores[entrada[0]],
      );
      const fijas = corregidas.get(numero) ?? new Set<string>();
      for (const [idioma] of escritas) fijas.add(idioma);
      corregidas.set(numero, fijas);
      const conservadas = Object.entries(actual.traducciones).filter(
        ([idioma]) => !cambioElOriginal || fijas.has(idioma),
      );
      aplicar(numero, {
        ...actual,
        original: cambios.original,
        traducciones: { ...Object.fromEntries(conservadas), ...Object.fromEntries(escritas) },
      });
      if (cambioElOriginal && cambios.original.trim() !== "") {
        cadena = cadena.then(() => traducirLinea(numero).then(() => undefined));
      }
      return true;
    },
    async terminar() {
      for (const fragmento of o.cortador.terminar()) encolar(fragmento);
      await cadena;
      const provisoria = lineas.get(siguienteNumero);
      if (provisoria?.provisoria)
        publicar(siguienteNumero, { ...provisoria, original: "", provisoria: false });
    },
  };
}
