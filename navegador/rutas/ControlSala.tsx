import { useCallback, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { GuardaDeSesion } from "@navegador/funcionalidades/acceso";
import { PantallaEscenario } from "@navegador/funcionalidades/pantalla-escenario";
import {
  SesionEnVivo,
  charlaDeAhora,
  type CharlaEnCurso,
  type EleccionDeCharla,
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
  return (
    <GuardaDeSesion>
      {(rol) => (
        <ControlDeUnaSala salaId={id} volverA={rol === "operador" ? "/operador" : "/panel/salas"} />
      )}
    </GuardaDeSesion>
  );
}

function ControlDeUnaSala({ salaId, volverA }: { salaId: string; volverA: string }) {
  const datos = useDatosDeLaSala(salaId);
  const [parametros] = useSearchParams();
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
  const { charlaAhora, charlas, sala } = datos;
  // Desde el calendario se llega con una charla elegida: la sesión arranca con la suya.
  const pedida = charlas.find((charla) => charla.id === parametros.get("charla")) ?? null;
  const inicial = pedida ?? charlaAhora;
  return (
    <SesionDeLaSala
      sala={sala}
      charlas={charlas}
      glosarioInicial={inicial?.glosario ?? ""}
      idiomaInicial={inicial?.idioma ?? sala.idiomaOriginal}
      charlaInicial={pedida?.id ?? "agenda"}
      volverA={volverA}
    />
  );
}

type DatosListos = Extract<DatosDeLaSala, { fase: "lista" }>;
type SalaDeLaSesion = DatosListos["sala"];
type Charla = DatosListos["charlas"][number];
type Idioma = SalaDeLaSesion["idiomaOriginal"];

function SesionDeLaSala({
  sala,
  charlas,
  glosarioInicial,
  idiomaInicial,
  charlaInicial,
  volverA,
}: {
  sala: SalaDeLaSesion;
  charlas: Charla[];
  glosarioInicial: string;
  idiomaInicial: Idioma;
  charlaInicial: EleccionDeCharla;
  volverA: string;
}) {
  const [eleccionDeCharla, setEleccionDeCharla] = useState<EleccionDeCharla>(charlaInicial);
  const elegida =
    eleccionDeCharla === "agenda"
      ? charlaDeAhora(charlas)
      : eleccionDeCharla === "ninguna"
        ? null
        : (charlas.find((candidata) => candidata.id === eleccionDeCharla) ?? null);
  const charla: CharlaEnCurso | null = elegida
    ? { id: elegida.id, titulo: elegida.titulo, idioma: elegida.idioma ?? sala.idiomaOriginal }
    : null;
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
          original: idiomaInicial,
          destino: sala.idiomasDestino.filter((idioma) => idioma !== idiomaInicial),
          glosario: glosarioInicial,
        }}
        nombreSala={sala.nombre}
        charlas={charlas}
        eleccionDeCharla={eleccionDeCharla}
        alElegirCharla={setEleccionDeCharla}
        volverA={volverA}
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
