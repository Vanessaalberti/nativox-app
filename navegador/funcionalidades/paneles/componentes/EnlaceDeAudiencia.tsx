import { useEffect, useState } from "react";
import { leerEnlaceDeAudiencia } from "@navegador/modulos/cliente-instancia";
import { CajaCopiable } from "@navegador/interfaz/sistema-diseno";

// El link para la audiencia: lo genera el administrador y lo comparte donde quiera. No está en la
// pantalla de entrada de la instancia, así la audiencia nunca pasa por donde se entra como
// administrador u operador. Si se filtra, "Generar uno nuevo" deja sin efecto el anterior.
export function EnlaceDeAudiencia() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void leerEnlaceDeAudiencia().then((respuesta) => {
      if (respuesta.ok) setToken(respuesta.valor);
      else setError(respuesta.motivo);
    });
  }, []);

  const renovar = () => {
    if (!window.confirm("El link anterior va a dejar de funcionar. ¿Generar uno nuevo?")) return;
    void leerEnlaceDeAudiencia(true).then((respuesta) => {
      if (respuesta.ok) setToken(respuesta.valor);
      else setError(respuesta.motivo);
    });
  };

  return (
    <div className="mb-10 shrink-0 border-[1.5px] border-[#443d30] bg-canvas p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">
          Link para la audiencia
        </span>
        {token !== null && (
          <button
            type="button"
            onClick={renovar}
            className="font-mono text-[10px] font-bold tracking-widest text-ink/50 uppercase hover:text-[#b8241f]"
          >
            Generar uno nuevo
          </button>
        )}
      </div>
      {error !== null && <p className="mt-2 font-mono text-xs text-[#b8241f]">{error}</p>}
      {token !== null && (
        <div className="mt-2">
          <CajaCopiable valor={`${window.location.origin}/a/${token}`} />
        </div>
      )}
      <p className="mt-2 text-xs leading-snug text-ink/60">
        Compartilo con quien va a mirar los subtítulos: entra sin cuenta y solo ve las salas y su
        agenda. Es un link aparte: la pantalla de entrada de tu instancia no lleva a la audiencia.
      </p>
    </div>
  );
}
