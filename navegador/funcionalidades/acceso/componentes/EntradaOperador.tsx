import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ingresarComoOperador } from "@navegador/modulos/cliente-instancia";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Aviso, Boton, Campo } from "@navegador/interfaz/sistema-diseno";

// /entrada/operador: entra con el código de invitación que le mandó el administrador.
export function EntradaOperador() {
  const navegar = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    setError(null);
    const respuesta = await ingresarComoOperador(codigo);
    setEnviando(false);
    if (!respuesta.ok) {
      setError(respuesta.motivo);
      return;
    }
    void navegar("/", { replace: true });
  };

  return (
    <MarcoDeEntrada ancho="angosto" centrado={false}>
      <Link
        to="/entrada"
        className="mb-6 font-mono text-[11px] tracking-widest text-ink/50 uppercase hover:text-ink"
      >
        ← Volver
      </Link>
      <span className="block font-mono text-[11px] tracking-widest text-naranja uppercase">
        Acceso de operador
      </span>
      <h1 className="mt-3 mb-4 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase">
        Ingresá tu código
      </h1>
      <p className="mb-10 text-base text-ink/80">
        Tu administrador te lo mandó por WhatsApp, Slack o donde use tu equipo. Te lleva directo a
        las salas que te asignaron.
      </p>
      <form
        className="flex flex-col gap-6"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar();
        }}
      >
        <Campo
          etiqueta="Código de invitación"
          valor={codigo}
          alCambiar={setCodigo}
          placeholder="NTVX-XXXX-XXXX-XXXX"
          autoComplete="one-time-code"
        />
        {error !== null && <Aviso tipo="error">{error}</Aviso>}
        <Aviso>
          Este código solo te da acceso a tus salas asignadas — nunca a las keys ni a la
          configuración de la organización. Tu admin puede revocarlo cuando quiera.
        </Aviso>
        <Boton type="submit" disabled={enviando || codigo.trim() === ""}>
          Entrar <span aria-hidden>→</span>
        </Boton>
      </form>
    </MarcoDeEntrada>
  );
}
