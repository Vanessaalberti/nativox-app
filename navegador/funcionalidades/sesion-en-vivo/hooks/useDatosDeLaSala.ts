import { useEffect, useState } from "react";
import type { Charla, Sala } from "@compartido/contratos";
import { leerSala, listarCharlas } from "@navegador/modulos/cliente-instancia";

export type DatosDeLaSala =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; sala: Sala; charlaAhora: Charla | null };

const dosDigitos = (numero: number) => String(numero).padStart(2, "0");

// La charla que está en su horario ahora mismo (hora de esta computadora), si hay una.
function charlaDeAhora(charlas: readonly Charla[], ahora = new Date()): Charla | null {
  const fecha = `${String(ahora.getFullYear())}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}`;
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  return (
    charlas.find(
      (charla) => charla.fecha === fecha && charla.inicioMin <= minutos && minutos < charla.finMin,
    ) ?? null
  );
}

// La sala de la sesión en vivo (su nombre, sus idiomas) y la charla que toca ahora, para arrancar
// con su idioma y su glosario.
export function useDatosDeLaSala(salaId: string): DatosDeLaSala {
  const [datos, setDatos] = useState<DatosDeLaSala>({ fase: "cargando" });

  useEffect(() => {
    void Promise.all([leerSala(salaId), listarCharlas(salaId)]).then(([sala, charlas]) => {
      if (!sala.ok) setDatos({ fase: "error", motivo: sala.motivo });
      else if (!charlas.ok) setDatos({ fase: "error", motivo: charlas.motivo });
      else setDatos({ fase: "lista", sala: sala.valor, charlaAhora: charlaDeAhora(charlas.valor) });
    });
  }, [salaId]);

  return datos;
}
