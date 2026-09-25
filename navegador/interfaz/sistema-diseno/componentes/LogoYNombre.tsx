import { useId, useState } from "react";
import { achicarLogo } from "../logo";
import { Campo } from "./Campo";

// El nombre del evento y su logo (opcional): reemplazan el genérico en el panel y en la audiencia.
export function LogoYNombre({
  nombre,
  alCambiarNombre,
  logo,
  alCambiarLogo,
  ayuda,
}: {
  nombre: string;
  alCambiarNombre: (nombre: string) => void;
  logo: string | null;
  alCambiarLogo: (logo: string | null) => void;
  ayuda: string;
}) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);

  const elegir = async (archivo: File | undefined) => {
    if (!archivo) return;
    const respuesta = await achicarLogo(archivo);
    if (!respuesta.ok) {
      setError(respuesta.motivo);
      return;
    }
    setError(null);
    alCambiarLogo(respuesta.valor);
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
        Logo y nombre del evento
      </legend>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-2">
          <label
            htmlFor={id}
            className="flex size-20 cursor-pointer items-center justify-center border-[1.5px] border-dashed border-ink/40 bg-canvas font-mono text-[10px] tracking-widest text-ink/60 uppercase hover:border-ink"
          >
            {logo ? (
              <img src={logo} alt="Logo del evento" className="size-full object-contain" />
            ) : (
              "+ Logo"
            )}
          </label>
          <input
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(evento) => void elegir(evento.target.files?.[0])}
          />
          {logo && (
            <button
              type="button"
              onClick={() => alCambiarLogo(null)}
              className="font-mono text-[10px] tracking-widest text-ink/60 uppercase underline hover:text-ink"
            >
              Eliminar foto
            </button>
          )}
        </div>
        <div className="flex-1">
          <Campo
            etiqueta="Nombre"
            valor={nombre}
            alCambiar={alCambiarNombre}
            placeholder="Ej: DevConf Latam 2026"
            acento="verde"
            ayuda={ayuda}
          />
        </div>
      </div>
      {error !== null && (
        <p role="alert" className="font-mono text-xs text-[#b8241f]">
          {error}
        </p>
      )}
    </fieldset>
  );
}
