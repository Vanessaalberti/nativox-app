import { useEffect, useState } from "react";
import { NOMBRES_DE_IDIOMA, type EstadoDeLaInstancia, type Sala } from "@compartido/contratos";
import { leerEstado, listarSalas } from "@navegador/modulos/cliente-instancia";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { EstadoVacio, TarjetaDeLista, EnlaceDeAccion } from "@navegador/interfaz/sistema-diseno";
import { EncabezadoDelPanel, PanelEnCarga } from "./EncabezadoDelPanel";

type Carga =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; salas: Sala[]; evento: EstadoDeLaInstancia["evento"] };

// /operador: las salas que le asignó el administrador a quien entró con un código.
export function PanelDelOperador() {
  const [carga, setCarga] = useState<Carga>({ fase: "cargando" });

  useEffect(() => {
    void Promise.all([listarSalas(), leerEstado()]).then(([salas, estado]) => {
      if (!salas.ok) setCarga({ fase: "error", motivo: salas.motivo });
      else
        setCarga({
          fase: "lista",
          salas: salas.valor,
          evento: estado.ok ? estado.valor.evento : null,
        });
    });
  }, []);

  if (carga.fase !== "lista") return <PanelEnCarga carga={carga} />;

  return (
    <MarcoDeEntrada evento={carga.evento} centrado={false} ancho="ancho">
      <EncabezadoDelPanel etiqueta="Panel de operador" titulo="Tus salas" />

      {carga.salas.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no tenés salas asignadas"
          texto="Cuando el administrador te asigne una sala, la vas a ver acá."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {carga.salas.map((sala) => (
            <TarjetaDeLista
              key={sala.id}
              titulo={sala.nombre}
              detalle={`${NOMBRES_DE_IDIOMA[sala.idiomaOriginal]}${sala.idiomasDestino.length > 0 ? ` → ${sala.idiomasDestino.map((idioma) => NOMBRES_DE_IDIOMA[idioma]).join(", ")}` : ""} · ${String(sala.charlas)} ${sala.charlas === 1 ? "charla" : "charlas"}`}
            >
              <EnlaceDeAccion a={`/sala/${sala.id}/calendario`}>Calendario</EnlaceDeAccion>
              <EnlaceDeAccion a={`/sala/${sala.id}/control`}>Abrir en vivo</EnlaceDeAccion>
            </TarjetaDeLista>
          ))}
        </ul>
      )}
    </MarcoDeEntrada>
  );
}
