import { useEffect, useRef, useState } from "react";
import type { Idioma } from "@compartido/contratos";
import {
  conectarSala,
  type ConexionSala,
  type EstadoDeConexion,
} from "@navegador/modulos/cliente-sala";
import type { SesionEnVivo } from "./useSesionEnVivo";

const CADA_CUANTO_SE_AVISA_MS = 5000;

// Publica en la sala lo que produce la sesión en vivo: cada línea (solo si cambió desde la última
// vez que se mandó) y una señal cada 5 segundos, con la que el monitoreo sabe que la computadora
// sigue viva. También recibe los comandos del monitoreo (por ahora, "reiniciar").
// La charla que está en su horario (si hay una): al empezar la sesión se le avisa a la sala que
// "empieza" y al terminar, que "termina", y desde ahí la sala guarda lo que se transcribe como de
// esa charla.
export interface CharlaEnCurso {
  id: string;
  titulo: string;
  idioma: Idioma;
}

export function usePublicacion(
  salaId: string,
  sesion: SesionEnVivo,
  charla: CharlaEnCurso | null = null,
) {
  const [conexion, setConexion] = useState<EstadoDeConexion>("conectando");
  const [comando, setComando] = useState<string | null>(null);
  const enviarRef = useRef<ConexionSala | null>(null);
  const mandadas = useRef(new Map<string, string>());
  const nivel = sesion.nivelDeAudio;
  // Una prueba se ve y se mide en esta pantalla, pero no se publica ni se guarda.
  const prueba = sesion.configuracion?.prueba ?? false;
  const ultima = useRef({ fase: sesion.estado.fase, retrasoMs: 0, prueba: false });

  useEffect(() => {
    const sala = conectarSala({
      salaId,
      rol: "publicador",
      alCambiarConexion: setConexion,
      alMensaje: (mensaje) => {
        if (mensaje.tipo !== "comando") return;
        if (mensaje.accion === "reiniciar") window.location.reload();
        else
          setComando(`Comando recibido: ${mensaje.accion}. Todavía no se puede hacer desde acá.`);
      },
    });
    enviarRef.current = sala;
    return () => {
      sala.cerrar();
      enviarRef.current = null;
    };
  }, [salaId]);

  // Las líneas se mandan al cambiar (provisoria → confirmada → traducida), sin repetir las iguales.
  useEffect(() => {
    if (prueba) return;
    for (const linea of sesion.lineas) {
      const texto = JSON.stringify(linea);
      if (mandadas.current.get(linea.id) === texto) continue;
      mandadas.current.set(linea.id, texto);
      enviarRef.current?.enviar(linea);
    }
  }, [sesion.lineas, prueba]);

  useEffect(() => {
    const ultimaMedicion = sesion.mediciones.at(-1);
    ultima.current = {
      fase: sesion.estado.fase,
      retrasoMs: ultimaMedicion ? Math.round(ultimaMedicion.retrasoTraduccionSegundos * 1000) : 0,
      prueba,
    };
  }, [sesion.estado.fase, sesion.mediciones, prueba]);

  // La sesión pasa a "en vivo" → empieza la charla; deja de estarlo → termina.
  const enVivo = sesion.estado.fase === "en-vivo";
  const avisada = useRef(false);
  useEffect(() => {
    if (!charla || prueba) return;
    if (enVivo && !avisada.current) {
      avisada.current = true;
      enviarRef.current?.enviar({
        tipo: "agenda",
        momento: "empieza",
        charlaId: charla.id,
        titulo: charla.titulo,
        idioma: charla.idioma,
      });
    } else if (!enVivo && avisada.current) {
      avisada.current = false;
      enviarRef.current?.enviar({
        tipo: "agenda",
        momento: "termina",
        charlaId: charla.id,
        titulo: charla.titulo,
        idioma: charla.idioma,
      });
    }
  }, [enVivo, charla, prueba]);

  useEffect(() => {
    const avisar = () => {
      const pico = nivel.current;
      nivel.current = 0;
      enviarRef.current?.enviar({
        tipo: "senal",
        estado:
          ultima.current.fase === "en-vivo" && !ultima.current.prueba ? "en-vivo" : "detenida",
        nivelAudio: pico,
        latenciaMs: ultima.current.retrasoMs,
      });
    };
    avisar();
    const intervalo = setInterval(avisar, CADA_CUANTO_SE_AVISA_MS);
    return () => clearInterval(intervalo);
  }, [salaId]);

  return { conexion, comando };
}
