import { useState } from "react";
import { Link } from "react-router";
import { NOMBRES_DE_IDIOMA, type SalaPublica } from "@compartido/contratos";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { CargaConReintento, EstadoVacio, Modal } from "@navegador/interfaz/sistema-diseno";
import { useAudiencia } from "../hooks/useAudiencia";
import { charlasParaMostrar, estadoDeSala, rango, type EstadoDeSala } from "../estado";

const ESTILO_DE_ESTADO: Record<EstadoDeSala, { texto: string; clases: string }> = {
  "en-vivo": { texto: "En vivo", clases: "bg-verde/25" },
  proximamente: { texto: "Próximamente", clases: "bg-naranja/25" },
  inactiva: { texto: "Inactiva", clases: "bg-ink/10 text-ink/60" },
};

function Estado({ estado }: { estado: EstadoDeSala }) {
  const { texto, clases } = ESTILO_DE_ESTADO[estado];
  return (
    <span
      className={`px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase ${clases}`}
    >
      {texto}
    </span>
  );
}

// /a/:token — "Elegí tu sala": quien tiene el link del administrador entra sin cuenta y ve la
// agenda de cada sala para sumarse a una charla con transcripción o traducción en vivo.
export function ListaDeSalasPublicas({ token }: { token: string }) {
  const { carga, recargar } = useAudiencia(token);
  const [abierta, setAbierta] = useState<string | null>(null);

  if (carga.fase !== "lista") {
    return (
      <MarcoDeEntrada>
        <CargaConReintento
          carga={carga}
          textoCargando="Buscando las salas…"
          alReintentar={() => void recargar()}
        />
      </MarcoDeEntrada>
    );
  }

  const { audiencia } = carga;
  const ahora = new Date();
  const sala = audiencia.salas.find((candidata) => candidata.id === abierta) ?? null;

  return (
    <MarcoDeEntrada evento={audiencia.evento} ancho="ancho" centrado={false}>
      <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
        {audiencia.evento?.nombre ?? "Evento en vivo"}
      </span>
      <h1 className="mt-2 mb-4 font-display text-6xl leading-[0.95] font-extrabold tracking-tight uppercase">
        Elegí tu sala
      </h1>
      <p className="mb-10 max-w-[760px] text-lg text-ink/80">
        Tocá una sala para ver su agenda y sumarte a una charla con transcripción o traducción en
        vivo, en el idioma que prefieras.
      </p>

      {audiencia.salas.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hay salas"
          texto="Cuando el evento tenga salas, las vas a ver acá."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {audiencia.salas.map((candidata) => {
            const { charlas } = charlasParaMostrar(candidata.charlas, ahora);
            return (
              <li key={candidata.id}>
                <button
                  type="button"
                  onClick={() => setAbierta(candidata.id)}
                  className="flex w-full flex-col gap-3 border-[1.5px] border-ink/30 bg-canvas p-5 text-left transition-colors hover:border-ink"
                >
                  <span className="flex items-start justify-between">
                    <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">
                      Sala
                    </span>
                    <Estado estado={estadoDeSala(candidata, ahora)} />
                  </span>
                  <span className="font-display text-3xl leading-none uppercase">
                    {candidata.nombre}
                  </span>
                  <span className="text-xs text-ink/60">
                    {charlas.length} {charlas.length === 1 ? "actividad" : "actividades"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {sala && (
        <ModalDeSala sala={sala} ahora={ahora} token={token} alCerrar={() => setAbierta(null)} />
      )}
    </MarcoDeEntrada>
  );
}

function ModalDeSala({
  sala,
  ahora,
  token,
  alCerrar,
}: {
  sala: SalaPublica;
  ahora: Date;
  token: string;
  alCerrar: () => void;
}) {
  const { charlas } = charlasParaMostrar(sala.charlas, ahora);
  const idiomas = [sala.idiomaOriginal, ...sala.idiomasDestino];

  return (
    <Modal etiqueta="Sala" titulo={sala.nombre} alCerrar={alCerrar}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <Estado estado={estadoDeSala(sala, ahora)} />
          {idiomas.map((idioma) => (
            <span
              key={idioma}
              className="border-[1.5px] border-ink/30 px-2 py-1 font-mono text-[10px] font-bold tracking-widest uppercase"
            >
              {idioma}
            </span>
          ))}
        </div>
        {sala.enVivo && (
          <Link
            to={`/sala/${sala.id}/pantalla?t=${token}`}
            className="border-[3px] border-[#b8241f] bg-naranja px-5 py-3 text-center font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#e67b00]"
          >
            Ver la transcripción en vivo →
          </Link>
        )}
        <p className="font-mono text-[11px] tracking-widest text-ink/60 uppercase">
          Agenda · elegí una charla para sumarte
        </p>
        {charlas.length === 0 ? (
          <p className="text-sm text-ink/70">Esta sala todavía no tiene actividades.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {charlas.map((charla) => (
              <li
                key={charla.id}
                className="flex items-center justify-between gap-4 border-[1.5px] border-ink/25 px-5 py-4"
              >
                <div>
                  <p className="mb-1 font-mono text-[11px] tracking-widest text-ink/50 uppercase">
                    {rango(charla)}
                    {charla.idioma && ` · ${NOMBRES_DE_IDIOMA[charla.idioma]}`}
                  </p>
                  <p className="font-display text-xl leading-none uppercase">{charla.titulo}</p>
                </div>
                <Link
                  to={`/sala/${sala.id}/pantalla?charla=${charla.id}&t=${token}`}
                  className="shrink-0 font-mono text-xs font-bold tracking-widest text-naranja uppercase hover:underline"
                >
                  Acceder →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
