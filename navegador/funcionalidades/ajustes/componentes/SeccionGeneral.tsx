import { useState } from "react";
import type { EventoCompleto } from "@compartido/contratos";
import { Campo, LogoYNombre, PieDeFormulario, useEnvio } from "@navegador/interfaz/sistema-diseno";
import { actualizarEvento } from "@navegador/modulos/cliente-instancia";
import { Seccion } from "./Seccion";

// Logo y nombre del evento y sus fechas. Al guardar se recarga la página: el nombre y el logo se ven
// en la cabecera de todo el panel.
export function SeccionGeneral({ evento }: { evento: EventoCompleto }) {
  const [nombre, setNombre] = useState(evento.nombre);
  const [logo, setLogo] = useState(evento.logo);
  const [inicio, setInicio] = useState(evento.fechaInicio ?? "");
  const [fin, setFin] = useState(evento.fechaFin ?? "");
  const { error, enviando, enviar } = useEnvio(() => window.location.reload());

  return (
    <Seccion etiqueta="General" titulo="Logo y nombre">
      <form
        className="flex max-w-[760px] flex-col gap-6"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar(async () => {
            const respuesta = await actualizarEvento({
              nombre,
              logo,
              fechaInicio: inicio === "" ? null : inicio,
              fechaFin: fin === "" ? null : fin,
            });
            return respuesta.ok ? null : respuesta.motivo;
          });
        }}
      >
        <LogoYNombre
          nombre={nombre}
          alCambiarNombre={setNombre}
          logo={logo}
          alCambiarLogo={setLogo}
          ayuda="Clickeá el recuadro para cambiar el logo."
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
            Fechas del evento
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Desde" tipo="date" valor={inicio} alCambiar={setInicio} />
            <Campo etiqueta="Hasta" tipo="date" valor={fin} alCambiar={setFin} />
          </div>
          <p className="font-mono text-[11px] text-ink/60">
            Opcional, para eventos de varios días. Se puede dejar sin definir.
          </p>
        </fieldset>
        <PieDeFormulario error={error} deshabilitado={enviando || nombre.trim() === ""} />
      </form>
    </Seccion>
  );
}
