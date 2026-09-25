import { useCallback, useEffect, useRef, useState } from "react";
import type { AvisoAgenda, EstadoSala, Linea, MensajeSala, RolDeSala } from "@compartido/contratos";
import { mezclarLinea } from "@compartido/lineas";
import { conectarSala, type ConexionSala, type EstadoDeConexion } from "./conexion";

export interface DatosDeLaSala {
  // Las líneas en el orden en que se dijeron; las que llegan de nuevo por id se actualizan.
  lineas: Linea[];
  conexion: EstadoDeConexion;
  // Solo para quien monitorea: quién está conectado y la última señal de la computadora de la sala.
  estado: EstadoSala | null;
  // Lo último que avisó la agenda ("empieza" / "termina" una charla), si avisó algo.
  agenda: AvisoAgenda | null;
  // Manda un mensaje a la sala (el monitoreo manda comandos a la computadora de la sala).
  enviar: (mensaje: MensajeSala) => void;
}

// Mirar una sala: se conecta, junta las líneas que llegan (el historial primero, después lo nuevo)
// y se reconecta sola. No corre ningún modelo: solo recibe texto ya generado.
export function useSala(salaId: string, rol: Exclude<RolDeSala, "publicador">): DatosDeLaSala {
  const [datos, setDatos] = useState<Omit<DatosDeLaSala, "enviar">>({
    lineas: [],
    conexion: "conectando",
    estado: null,
    agenda: null,
  });
  const conexionRef = useRef<ConexionSala | null>(null);

  useEffect(() => {
    setDatos({ lineas: [], conexion: "conectando", estado: null, agenda: null });
    const conexion = conectarSala({
      salaId,
      rol,
      alCambiarConexion: (estado) => setDatos((anterior) => ({ ...anterior, conexion: estado })),
      alMensaje: (mensaje) => {
        setDatos((anterior) => {
          if (mensaje.tipo === "linea") {
            return { ...anterior, lineas: mezclarLinea(anterior.lineas, mensaje) };
          }
          if (mensaje.tipo === "estado") return { ...anterior, estado: mensaje };
          if (mensaje.tipo === "agenda") return { ...anterior, agenda: mensaje };
          return anterior;
        });
      },
    });
    conexionRef.current = conexion;
    return () => {
      conexion.cerrar();
      conexionRef.current = null;
    };
  }, [salaId, rol]);

  const enviar = useCallback((mensaje: MensajeSala) => conexionRef.current?.enviar(mensaje), []);
  return { ...datos, enviar };
}
