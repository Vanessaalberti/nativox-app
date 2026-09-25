import type { EventoCompleto } from "@compartido/contratos";
import { CargaConReintento, useAlMostrarse } from "@navegador/interfaz/sistema-diseno";
import { useAjustes } from "../hooks/useAjustes";
import { SeccionConsumo } from "./SeccionConsumo";
import { SeccionCuenta } from "./SeccionCuenta";
import { SeccionGeneral } from "./SeccionGeneral";
import { SeccionInstancia } from "./SeccionInstancia";
import { SeccionOperacion } from "./SeccionOperacion";

// La pestaña "Ajustes": el evento, cómo se cuidan las salas, el consumo de IA, los subtítulos, tu
// cuenta, dónde corre la instancia y eliminar el evento.
export function PanelDeAjustes({
  evento,
  email,
  visible,
}: {
  evento: EventoCompleto;
  email: string;
  visible: boolean;
}) {
  const ajustes = useAjustes();
  const { carga } = ajustes;
  useAlMostrarse(visible, () => void ajustes.recargar());

  if (carga.fase !== "lista") {
    return (
      <CargaConReintento
        carga={carga}
        textoCargando="Cargando los ajustes…"
        alReintentar={() => void ajustes.recargar()}
      />
    );
  }

  const { ajustes: valores, webhookConfigurado } = carga.datos;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <p className="mb-8 max-w-[640px] text-sm text-ink/60">
        Datos del evento, credenciales, tu acceso y qué hacer cuando termina — todo lo que necesitás
        para configurar o cerrar tu evento.
      </p>
      <div className="flex max-w-[720px] flex-col gap-10 pb-10">
        <SeccionGeneral evento={evento} />
        <SeccionOperacion
          ajustes={valores}
          webhookConfigurado={webhookConfigurado}
          alGuardar={ajustes.guardar}
          alGuardarWebhook={ajustes.guardarElWebhook}
          alProbarWebhook={ajustes.probarElWebhook}
        />
        <SeccionConsumo ajustes={valores} alGuardar={ajustes.guardar} />
        <SeccionCuenta email={email} />
        <SeccionInstancia evento={evento} />
      </div>
    </div>
  );
}
