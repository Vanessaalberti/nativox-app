import { useEffect, useRef, useState } from "react";
import type { Sala } from "@compartido/contratos";
import { leerSala } from "@navegador/modulos/cliente-instancia";
import { useSala } from "@navegador/modulos/cliente-sala";

export interface EventoDelRegistro {
  hora: Date;
  // 🟢 bien · 🟡 se resolvió solo · 🔴 falla · ↻ acción · ▶ agenda · ⚙ simulado
  icono: string;
  texto: string;
}

const SEGUNDOS_SIN_SENAL_PARA_AVISAR = 30;
const LATENCIAS_GUARDADAS = 20;
const EVENTOS_GUARDADOS = 100;

// El monitoreo de una sala: conecta como monitor y arma, con lo que va llegando, el estado (en vivo
// o no), cuánto hace de la última señal, la latencia promedio y el registro de eventos.
export function useMonitoreo(salaId: string) {
  const datos = useSala(salaId, "monitor");
  const [sala, setSala] = useState<Sala | null>(null);
  const [registro, setRegistro] = useState<EventoDelRegistro[]>([]);
  const [latencias, setLatencias] = useState<number[]>([]);
  const [ahora, setAhora] = useState(() => Date.now());
  const anterior = useRef({ publicando: 0, estadoDeSenal: "", avisoDeSilencio: false });

  const anotar = (icono: string, texto: string) =>
    setRegistro((actual) =>
      [{ hora: new Date(), icono, texto }, ...actual].slice(0, EVENTOS_GUARDADOS),
    );

  useEffect(() => {
    void leerSala(salaId).then((respuesta) => setSala(respuesta.ok ? respuesta.valor : null));
  }, [salaId]);

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const { estado } = datos;
  useEffect(() => {
    if (!estado) return;
    const previo = anterior.current;
    if (estado.publicando > 0 && previo.publicando === 0) {
      anotar("🟢", "La computadora de la sala se conectó.");
    } else if (estado.publicando === 0 && previo.publicando > 0) {
      anotar("🔴", "La computadora de la sala se desconectó.");
    }
    const estadoDeSenal = estado.senal?.estado ?? "";
    if (estadoDeSenal !== "" && estadoDeSenal !== previo.estadoDeSenal) {
      anotar(estadoDeSenal === "en-vivo" ? "🟢" : "🟡", `La sala pasó a «${estadoDeSenal}».`);
    }
    if (estado.senal) {
      const latencia = estado.senal.latenciaMs;
      setLatencias((actuales) => [...actuales, latencia].slice(-LATENCIAS_GUARDADAS));
    }
    anterior.current = { ...previo, publicando: estado.publicando, estadoDeSenal };
    previo.avisoDeSilencio = false;
    // `anotar` solo agrega al registro: no hace falta como dependencia.
  }, [estado]);

  const { agenda } = datos;
  useEffect(() => {
    if (agenda) {
      anotar("▶", `${agenda.momento === "empieza" ? "Empezó" : "Terminó"} «${agenda.titulo}».`);
    }
  }, [agenda]);

  const segundosSinSenal = estado?.senalEn
    ? Math.max(0, Math.round((ahora - estado.senalEn) / 1000))
    : null;
  const sinSenal =
    estado !== null &&
    estado.publicando > 0 &&
    segundosSinSenal !== null &&
    segundosSinSenal > SEGUNDOS_SIN_SENAL_PARA_AVISAR;

  // Una sala que estaba dando señal y se calló: se anota una sola vez por corte.
  useEffect(() => {
    if (sinSenal && !anterior.current.avisoDeSilencio) {
      anterior.current.avisoDeSilencio = true;
      anotar("🔴", `No da señal hace ${String(SEGUNDOS_SIN_SENAL_PARA_AVISAR)} s.`);
    }
  }, [sinSenal]);

  const enVivo =
    estado !== null && estado.publicando > 0 && !sinSenal && estado.senal?.estado === "en-vivo";
  const latenciaPromedioMs = latencias.length
    ? Math.round(latencias.reduce((suma, valor) => suma + valor, 0) / latencias.length)
    : 0;

  return {
    sala,
    conexion: datos.conexion,
    estado,
    lineas: datos.lineas,
    registro,
    anotar,
    enviar: datos.enviar,
    segundosSinSenal,
    sinSenal,
    enVivo,
    latenciaPromedioMs,
    errores: registro.filter((evento) => evento.icono === "🔴").length,
  };
}
