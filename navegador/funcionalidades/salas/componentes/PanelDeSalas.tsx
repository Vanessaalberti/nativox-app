import { useState } from "react";
import type { Sala } from "@compartido/contratos";
import {
  Boton,
  CargaConReintento,
  EnlaceDeAccion,
  EstadoVacio,
  TarjetaDeLista,
} from "@navegador/interfaz/sistema-diseno";
import { useSalas } from "../hooks/useSalas";
import { describirIdiomas } from "../idiomas";
import { ModalAnadirSala } from "./ModalAnadirSala";
import { ModalEditarSala } from "./ModalEditarSala";

// La pestaña "Salas" del panel: las salas del evento, con sus idiomas y sus charlas, y los accesos
// al calendario y a la sesión en vivo de cada una.
export function PanelDeSalas() {
  const { carga, recargar, crear, editar, eliminar } = useSalas();
  const [anadiendo, setAnadiendo] = useState(false);
  const [editada, setEditada] = useState<Sala | null>(null);

  if (carga.fase !== "lista") {
    return (
      <CargaConReintento
        carga={carga}
        textoCargando="Cargando salas…"
        alReintentar={() => void recargar()}
      />
    );
  }

  const { salas } = carga;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[560px] text-base text-ink/80">
          Creá las salas de tu evento — desde acá las administrás y las operás en vivo.
        </p>
        <Boton onClick={() => setAnadiendo(true)}>+ Añadir sala</Boton>
      </div>

      {salas.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no armaste ninguna sala"
          texto="Creá la primera (o varias de una) para empezar a transmitir."
        >
          <Boton onClick={() => setAnadiendo(true)}>+ Nueva sala</Boton>
        </EstadoVacio>
      ) : (
        <ul className="flex flex-col gap-3">
          {salas.map((sala) => (
            <TarjetaDeLista
              key={sala.id}
              titulo={sala.nombre}
              detalle={`${describirIdiomas(sala.idiomaOriginal, sala.idiomasDestino)} · ${String(sala.charlas)} ${sala.charlas === 1 ? "charla" : "charlas"}`}
            >
              <EnlaceDeAccion a={`/sala/${sala.id}/calendario`}>Calendario</EnlaceDeAccion>
              <EnlaceDeAccion a={`/sala/${sala.id}/control`}>Abrir en vivo</EnlaceDeAccion>
              <EnlaceDeAccion alClic={() => setEditada(sala)}>Editar</EnlaceDeAccion>
            </TarjetaDeLista>
          ))}
        </ul>
      )}

      {anadiendo && (
        <ModalAnadirSala
          cantidadActual={salas.length}
          alCrear={crear}
          alCerrar={() => setAnadiendo(false)}
        />
      )}
      {editada && (
        <ModalEditarSala
          sala={editada}
          alGuardar={(datos) => editar(editada.id, datos)}
          alEliminar={() => eliminar(editada.id)}
          alCerrar={() => setEditada(null)}
        />
      )}
    </div>
  );
}
