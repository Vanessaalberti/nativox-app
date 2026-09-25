import { useParams } from "react-router";
import { GuardaDeSesion } from "@navegador/funcionalidades/acceso";
import { PaginaDeAccion } from "@navegador/funcionalidades/ajustes";
import { ListaDeSalasPublicas, PantallaDeAudiencia } from "@navegador/funcionalidades/audiencia";
import { MonitoreoDeSala } from "@navegador/funcionalidades/monitoreo";
import {
  ConfiguradorDeSala,
  PaginaTransparente,
} from "@navegador/funcionalidades/subtitulos-stream";

// /a/:token y /sala/:id/pantalla — sin cuenta: el link lo genera el administrador y lo comparte.
export function Audiencia() {
  const { token = "" } = useParams();
  return <ListaDeSalasPublicas token={token} />;
}

export function PantallaDeSala() {
  const { id = "" } = useParams();
  return <PantallaDeAudiencia salaId={id} />;
}

// /sala/:id/transmision — la página transparente de una sala para vMix/OBS (sin sesión).
export function TransmisionDeSala() {
  const { id = "" } = useParams();
  return <PaginaTransparente fuente={{ tipo: "sala", id }} />;
}

// /produccion/salida-:n — la página transparente de una salida: muestra la sala que esté al aire.
export function TransmisionDeSalida() {
  const { salida = "" } = useParams();
  const numero = Number(salida.replace(/^salida-/, ""));
  return Number.isInteger(numero) && numero > 0 ? (
    <PaginaTransparente fuente={{ tipo: "salida", numero }} />
  ) : null;
}

// /sala/:id/subtitulos y /sala/:id/monitoreo — del administrador y del operador de esa sala.
export function Subtitulos() {
  const { id = "" } = useParams();
  return (
    <GuardaDeSesion>
      {(rol) => (
        <ConfiguradorDeSala
          salaId={id}
          volverA={rol === "operador" ? "/operador" : "/panel/salas"}
        />
      )}
    </GuardaDeSesion>
  );
}

export function Monitoreo() {
  const { id = "" } = useParams();
  return (
    <GuardaDeSesion>
      {(rol) => (
        <MonitoreoDeSala salaId={id} volverA={rol === "operador" ? "/operador" : "/panel/salas"} />
      )}
    </GuardaDeSesion>
  );
}

// /accion/:token — el botón de un aviso de Discord (sin sesión: el link es el permiso).
export function AccionDeAviso() {
  const { token = "" } = useParams();
  return <PaginaDeAccion token={token} />;
}
