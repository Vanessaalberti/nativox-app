import type { EventoCompleto } from "@compartido/contratos";
import { CargaConReintento } from "@navegador/interfaz/sistema-diseno";
import { useAjustes } from "../hooks/useAjustes";
import { SeccionConsumo } from "./SeccionConsumo";
import { SeccionCuenta } from "./SeccionCuenta";
import { SeccionGeneral } from "./SeccionGeneral";
import { SeccionInstancia } from "./SeccionInstancia";
import { SeccionOperacion } from "./SeccionOperacion";

// La pestaña "Ajustes": el evento, cómo se cuidan las salas, el consumo de IA, los subtítulos, tu
// cuenta, dónde corre la instancia y eliminar el evento.
export function PanelDeAjustes({ evento, email }: { evento: EventoCompleto; email: string }) {
  const ajustes = useAjustes();
  const { carga } = ajustes;

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
    <div className="grid max-w-[1100px] gap-6">
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
  );
}
