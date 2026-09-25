import { useState } from "react";
import {
  MAXIMO_DE_PERSONAS_POR_PEDIDO,
  type DatosDeOperador,
  type OperadorConCodigo,
  type Sala,
} from "@compartido/contratos";
import { Aviso, Boton, Modal, useEnvio } from "@navegador/interfaz/sistema-diseno";
import { SelectorDeSalas } from "./SelectorDeSalas";

// "Agregar persona": una o varias (un nombre por renglón), con las salas que van a operar. Al
// terminar entrega los códigos creados para que se muestren.
export function ModalAgregarPersonas({
  salas,
  alInvitar,
  alTerminar,
  alCerrar,
}: {
  salas: readonly Sala[];
  alInvitar: (
    personas: DatosDeOperador[],
  ) => Promise<{ motivo: string } | { creados: OperadorConCodigo[] }>;
  alTerminar: (creados: OperadorConCodigo[]) => void;
  alCerrar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [salaIds, setSalaIds] = useState<string[]>([]);
  const { error, enviando, enviar } = useEnvio();

  const nombres = texto
    .split("\n")
    .map((nombre) => nombre.trim())
    .filter((nombre) => nombre !== "");

  const crear = () =>
    enviar(async () => {
      const respuesta = await alInvitar(nombres.map((nombre) => ({ nombre, salaIds })));
      if ("motivo" in respuesta) return respuesta.motivo;
      alTerminar(respuesta.creados);
      return null;
    });

  return (
    <Modal etiqueta="Equipo" titulo="Agregar personas" alCerrar={alCerrar}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(evento) => {
          evento.preventDefault();
          void crear();
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
            Nombres (uno por renglón)
          </span>
          <textarea
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            rows={5}
            placeholder={"Juli\nMarcos\nAna"}
            className="w-full border-[1.5px] border-ink/25 bg-canvas px-3 py-3 font-mono text-sm outline-none focus:border-naranja"
          />
          <span className="font-mono text-[11px] text-ink/60">
            Hasta {MAXIMO_DE_PERSONAS_POR_PEDIDO} a la vez. Cada persona recibe su propio código.
          </span>
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
            Salas que van a operar
          </legend>
          <SelectorDeSalas salas={salas} elegidas={salaIds} alCambiar={setSalaIds} />
          <span className="font-mono text-[11px] text-ink/60">
            Podés dejarlo vacío y asignarlas después.
          </span>
        </fieldset>
        {error !== null && <Aviso tipo="error">{error}</Aviso>}
        <div className="flex justify-end">
          <Boton type="submit" disabled={enviando || nombres.length === 0}>
            {nombres.length > 1 ? `Crear ${String(nombres.length)} códigos` : "Crear código"} →
          </Boton>
        </div>
      </form>
    </Modal>
  );
}
