import { useCallback, useRef, useState } from "react";
import type { Idioma, Linea } from "@compartido/contratos";
import type { Medicion } from "@navegador/modulos/flujo-subtitulos";
import type { VarianteWhisper } from "@navegador/modulos/modelos-compartidos";
import { armarSesion, type ConfiguracionSesion, type SesionArmada } from "../motor/armar-sesion";
import { prepararModelos, type AvanceDescarga } from "../motor/preparar-modelos";

export type EstadoSesion =
  | { fase: "inactiva" }
  | { fase: "preparando"; avance: AvanceDescarga }
  | { fase: "en-vivo" }
  | { fase: "terminando" }
  | { fase: "error"; motivo: string };

const MEDICIONES_GUARDADAS = 50;
const AVISOS_GUARDADOS = 5;

// La reparación automática: si la entrada de audio se corta, se vuelve a abrir hasta 3 veces, con
// esperas cada vez más largas. Si no se logra, se avisa (y el monitoreo lo ve como sala sin señal).
const ESPERAS_DE_REPARACION_MS = [2000, 5000, 10_000];

export function useSesionEnVivo({ autorreparar = false }: { autorreparar?: boolean } = {}) {
  const [estado, setEstado] = useState<EstadoSesion>({ fase: "inactiva" });
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [variante, setVariante] = useState<VarianteWhisper | null>(null);
  const [idiomas, setIdiomas] = useState<{ original: Idioma; destino: readonly Idioma[] }>({
    original: "es",
    destino: ["en", "pt"],
  });
  const sesion = useRef<SesionArmada | null>(null);
  // El pico de volumen desde la última vez que se leyó: se guarda en una referencia y no en el
  // estado para no redibujar la pantalla con cada bloque de audio.
  const nivelDeAudio = useRef(0);
  // Para reparar: con qué se había arrancado y cuántos reintentos se hicieron; `pedidoDeParar`
  // cancela la reparación si quien opera apretó "Detener".
  const ultimaConfiguracion = useRef<ConfiguracionSesion | null>(null);
  const reintentos = useRef(0);
  const pedidoDeParar = useRef(false);

  const avisar = useCallback((motivo: string) => {
    setAvisos((anteriores) => [...anteriores, motivo].slice(-AVISOS_GUARDADOS));
  }, []);

  // Una línea se actualiza en su lugar (por id): provisoria → confirmada → traducida.
  const actualizarLinea = useCallback((linea: Linea) => {
    setLineas((anteriores) => {
      const indice = anteriores.findIndex((existente) => existente.id === linea.id);
      if (indice === -1) return [...anteriores, linea];
      return anteriores.map((existente, i) => (i === indice ? linea : existente));
    });
  }, []);

  const terminar = useCallback(async () => {
    const actual = sesion.current;
    if (!actual) return;
    sesion.current = null;
    actual.captura.detener();
    setEstado({ fase: "terminando" });
    await actual.flujo.terminar();
    setEstado({ fase: "inactiva" });
  }, []);

  // Se declara antes de `iniciar` y se completa después: la reparación vuelve a llamar a `iniciar`.
  const repararRef = useRef<(motivo: string) => void>(() => undefined);

  const iniciar = useCallback(
    async (configuracion: ConfiguracionSesion, esReintento = false) => {
      if (!esReintento) {
        reintentos.current = 0;
        pedidoDeParar.current = false;
      }
      ultimaConfiguracion.current = configuracion;
      setAvisos((anteriores) => (esReintento ? anteriores : []));
      setIdiomas({ original: configuracion.idiomaOriginal, destino: configuracion.idiomasDestino });
      setEstado({
        fase: "preparando",
        avance: { detalle: "Revisando la placa de video", proporcion: null },
      });
      const modelos = await prepararModelos(
        { de: configuracion.idiomaOriginal, a: configuracion.idiomasDestino },
        (avance) => setEstado({ fase: "preparando", avance }),
      );
      if (!modelos.ok) {
        setEstado({ fase: "error", motivo: modelos.motivo });
        return;
      }
      setVariante(modelos.valor.variante);

      const armada = await armarSesion(modelos.valor, configuracion, {
        alCambiarLinea: actualizarLinea,
        alMedir: (medicion) =>
          setMediciones((anteriores) => [...anteriores, medicion].slice(-MEDICIONES_GUARDADAS)),
        alFallar: avisar,
        alNivel: (nivel) => {
          nivelDeAudio.current = Math.max(nivelDeAudio.current, nivel);
        },
        alTerminarCaptura: (motivo) => {
          avisar(motivo);
          void terminar().then(() => repararRef.current(motivo));
        },
      });
      if (!armada.ok) {
        setEstado({ fase: "error", motivo: armada.motivo });
        return;
      }
      sesion.current = armada.valor;
      setEstado({ fase: "en-vivo" });
      // Si estaba reparando y volvió, se puede volver a reparar la próxima vez.
      if (esReintento) reintentos.current = 0;
    },
    [actualizarLinea, avisar, terminar],
  );

  // Cuando la entrada de audio se corta sola (y no porque alguien apretó "Detener"), con la
  // reparación automática prendida se vuelve a abrir. Un archivo que termina no es una falla.
  repararRef.current = () => {
    const configuracion = ultimaConfiguracion.current;
    if (!autorreparar || pedidoDeParar.current || configuracion?.fuente.tipo !== "entrada") return;
    const espera = ESPERAS_DE_REPARACION_MS[reintentos.current];
    if (espera === undefined) {
      avisar("No se pudo reparar solo: revisá la entrada de audio de esta computadora.");
      return;
    }
    reintentos.current += 1;
    avisar(
      `Reparación automática: reintento ${String(reintentos.current)} de ${String(ESPERAS_DE_REPARACION_MS.length)}…`,
    );
    setTimeout(() => {
      if (!pedidoDeParar.current) void iniciar(configuracion, true);
    }, espera);
  };

  // "Detener" de quien opera: además de parar, cancela cualquier reparación pendiente.
  const detener = useCallback(async () => {
    pedidoDeParar.current = true;
    await terminar();
  }, [terminar]);

  const limpiar = useCallback(() => {
    setLineas([]);
    setMediciones([]);
  }, []);

  return {
    estado,
    lineas,
    mediciones,
    avisos,
    variante,
    idiomas,
    nivelDeAudio,
    iniciar: (configuracion: ConfiguracionSesion) => iniciar(configuracion),
    detener,
    limpiar,
  };
}

export type SesionEnVivo = ReturnType<typeof useSesionEnVivo>;
