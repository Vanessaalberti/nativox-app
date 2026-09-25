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

export function useSesionEnVivo() {
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

  const detener = useCallback(async () => {
    const actual = sesion.current;
    if (!actual) return;
    sesion.current = null;
    actual.captura.detener();
    setEstado({ fase: "terminando" });
    await actual.flujo.terminar();
    setEstado({ fase: "inactiva" });
  }, []);

  const iniciar = useCallback(
    async (configuracion: ConfiguracionSesion) => {
      setAvisos([]);
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
        alTerminarCaptura: (motivo) => {
          avisar(motivo);
          void detener();
        },
      });
      if (!armada.ok) {
        setEstado({ fase: "error", motivo: armada.motivo });
        return;
      }
      sesion.current = armada.valor;
      setEstado({ fase: "en-vivo" });
    },
    [actualizarLinea, avisar, detener],
  );

  const limpiar = useCallback(() => {
    setLineas([]);
    setMediciones([]);
  }, []);

  return { estado, lineas, mediciones, avisos, variante, idiomas, iniciar, detener, limpiar };
}

export type SesionEnVivo = ReturnType<typeof useSesionEnVivo>;
