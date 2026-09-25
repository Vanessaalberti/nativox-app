import { useEffect, useState } from "react";
import type { AccionPendiente } from "@compartido/contratos";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Aviso, Boton } from "@navegador/interfaz/sistema-diseno";
import { confirmarAccionDeAviso, verAccionDeAviso } from "@navegador/modulos/cliente-instancia";

const QUE_HACE: Record<AccionPendiente["accion"], string> = {
  reiniciar: "Reiniciar la sesión en la computadora de la sala. Vuelve sola y sigue donde estaba.",
  "pasar-a-la-nube": "Pasar la transcripción de la sala a la nube.",
  "silenciar-avisos": "Silenciar los avisos de esta sala por 30 minutos.",
};

type Estado =
  | { fase: "cargando" }
  | { fase: "lista"; pendiente: AccionPendiente }
  | { fase: "hecha"; pendiente: AccionPendiente }
  | { fase: "error"; motivo: string };

// /accion/:token — el botón de un aviso de Discord, para resolver desde el celular sin iniciar
// sesión. Abrir el link solo muestra qué va a pasar; hace falta confirmar. El link se usa una vez
// y vence a los 15 minutos.
export function PaginaDeAccion({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void verAccionDeAviso(token).then((respuesta) =>
      setEstado(
        respuesta.ok
          ? { fase: "lista", pendiente: respuesta.valor }
          : { fase: "error", motivo: respuesta.motivo },
      ),
    );
  }, [token]);

  const confirmar = async (pendiente: AccionPendiente) => {
    setEnviando(true);
    const respuesta = await confirmarAccionDeAviso(token);
    setEnviando(false);
    setEstado(
      respuesta.ok ? { fase: "hecha", pendiente } : { fase: "error", motivo: respuesta.motivo },
    );
  };

  return (
    <MarcoDeEntrada ancho="angosto">
      <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
        Acción de un aviso
      </span>
      {estado.fase === "cargando" && (
        <p role="status" className="mt-4 font-mono text-sm">
          Abriendo el link…
        </p>
      )}
      {estado.fase === "error" && (
        <>
          <h1 className="mt-3 mb-4 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase">
            No se pudo
          </h1>
          <Aviso tipo="error">{estado.motivo}</Aviso>
        </>
      )}
      {estado.fase === "lista" && (
        <>
          <h1 className="mt-3 mb-4 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase">
            {estado.pendiente.sala}
          </h1>
          <p className="mb-8 max-w-[520px] text-lg text-ink/80">
            {QUE_HACE[estado.pendiente.accion]}
          </p>
          <Boton disabled={enviando} onClick={() => void confirmar(estado.pendiente)}>
            Confirmar →
          </Boton>
          <p className="mt-6 max-w-[520px] font-mono text-[11px] text-ink/60">
            Este link se usa una sola vez y vence a los 15 minutos. El canal de avisos recibe qué se
            hizo.
          </p>
        </>
      )}
      {estado.fase === "hecha" && (
        <>
          <h1 className="mt-3 mb-4 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase">
            ✓ Listo
          </h1>
          <p className="max-w-[520px] text-lg text-ink/80">
            {estado.pendiente.sala}: {QUE_HACE[estado.pendiente.accion]}
          </p>
        </>
      )}
    </MarcoDeEntrada>
  );
}
