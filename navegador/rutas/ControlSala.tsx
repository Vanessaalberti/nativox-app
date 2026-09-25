import { useCallback, useState } from "react";
import { useParams } from "react-router";
import { GuardaDeSesion } from "@navegador/funcionalidades/acceso";
import { PantallaEscenario } from "@navegador/funcionalidades/pantalla-escenario";
import {
  SesionEnVivo,
  type CharlaEnCurso,
  type DatosDeLaSala,
  useDatosDeLaSala,
  usePreferencias,
  usePublicacion,
  useSesionEnVivo,
} from "@navegador/funcionalidades/sesion-en-vivo";

// /sala/:id/control — la sesión en vivo de una sala. Publica lo que se transcribe en la sala (la
// audiencia, vMix/OBS y el monitoreo lo reciben) y, arriba, abre la pantalla del escenario.
export function ControlSala() {
  const { id = "" } = useParams();
  return <GuardaDeSesion>{() => <ControlDeUnaSala salaId={id} />}</GuardaDeSesion>;
}

function ControlDeUnaSala({ salaId }: { salaId: string }) {
  const datos = useDatosDeLaSala(salaId);
  if (datos.fase === "cargando") {
    return (
      <main className="grilla-fondo grid min-h-screen place-items-center font-mono text-sm">
        <p role="status">Abriendo la sala…</p>
      </main>
    );
  }
  if (datos.fase === "error") {
    return (
      <main className="grilla-fondo grid min-h-screen place-items-center px-5 font-mono text-sm">
        <p role="alert" className="text-[#b8241f]">
          {datos.motivo}
        </p>
      </main>
    );
  }
  const { charlaAhora, sala } = datos;
  return (
    <SesionDeLaSala
      sala={sala}
      glosarioInicial={charlaAhora?.glosario ?? ""}
      charla={
        charlaAhora
          ? {
              id: charlaAhora.id,
              titulo: charlaAhora.titulo,
              idioma: charlaAhora.idioma ?? sala.idiomaOriginal,
            }
          : null
      }
    />
  );
}

type SalaDeLaSesion = Extract<DatosDeLaSala, { fase: "lista" }>["sala"];

function SesionDeLaSala({
  sala,
  glosarioInicial,
  charla,
}: {
  sala: SalaDeLaSesion;
  glosarioInicial: string;
  charla: CharlaEnCurso | null;
}) {
  const preferencias = usePreferencias();
  const sesion = useSesionEnVivo({ autorreparar: preferencias?.autorreparacion ?? false });
  const { conexion, comando } = usePublicacion(sala.id, sesion, charla);
  const [conEscenario, setConEscenario] = useState(false);
  const cerrarEscenario = useCallback(() => setConEscenario(false), []);

  return (
    <>
      <SesionEnVivo
        salaId={sala.id}
        conexion={conexion}
        comando={comando}
        inicial={{
          original: sala.idiomaOriginal,
          destino: sala.idiomasDestino,
          glosario: glosarioInicial,
        }}
        nombreSala={sala.nombre}
        sesion={sesion}
        alAbrirEscenario={() => setConEscenario(true)}
      />
      {conEscenario && (
        <PantallaEscenario
          lineas={sesion.lineas}
          idiomaOriginal={sesion.idiomas.original}
          idiomasDestino={sesion.idiomas.destino}
          enVivo={sesion.estado.fase === "en-vivo"}
          alSalir={cerrarEscenario}
        />
      )}
    </>
  );
}
