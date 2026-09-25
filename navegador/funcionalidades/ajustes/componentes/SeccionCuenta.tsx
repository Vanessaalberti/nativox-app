import { useState } from "react";
import { LARGO_MINIMO_DE_CONTRASENA } from "@compartido/contratos";
import {
  Aviso,
  Boton,
  CajaCopiable,
  Campo,
  PieDeFormulario,
  useEnvio,
} from "@navegador/interfaz/sistema-diseno";
import {
  cambiarContrasena,
  generarCodigoDeRecuperacion,
} from "@navegador/modulos/cliente-instancia";
import { Seccion } from "./Seccion";

// Tu acceso: el email de la cuenta, cambiar la contraseña y generar un código de recuperación
// nuevo (el anterior deja de servir). La instancia no envía correos: si se olvida la contraseña,
// se recupera con ese código.
export function SeccionCuenta({ email }: { email: string }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [cambiada, setCambiada] = useState(false);
  const cambio = useEnvio();

  const [contrasenaDelCodigo, setContrasenaDelCodigo] = useState("");
  const [codigo, setCodigo] = useState<string | null>(null);
  const generacion = useEnvio();

  return (
    <Seccion
      etiqueta="Cuenta"
      titulo="Tu acceso"
      texto="La cuenta con la que entrás como administrador. Tu instancia no envía correos: si olvidás la contraseña, se recupera con el código de recuperación."
    >
      <p className="font-mono text-sm">
        <span className="text-ink/60">Email: </span>
        <strong>{email}</strong>
      </p>

      <form
        className="flex max-w-[460px] flex-col gap-4"
        onSubmit={(evento) => {
          evento.preventDefault();
          setCambiada(false);
          void cambio.enviar(async () => {
            const respuesta = await cambiarContrasena(actual, nueva);
            if (!respuesta.ok) return respuesta.motivo;
            setActual("");
            setNueva("");
            setCambiada(true);
            return null;
          });
        }}
      >
        <h3 className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
          Cambiar contraseña
        </h3>
        <Campo
          etiqueta="Contraseña actual"
          tipo="password"
          valor={actual}
          alCambiar={setActual}
          autoComplete="current-password"
        />
        <Campo
          etiqueta="Nueva contraseña"
          tipo="password"
          valor={nueva}
          alCambiar={setNueva}
          placeholder={`Mínimo ${String(LARGO_MINIMO_DE_CONTRASENA)} caracteres`}
          autoComplete="new-password"
        />
        <PieDeFormulario
          error={cambio.error}
          deshabilitado={cambio.enviando || actual === "" || nueva === ""}
        />
        {cambiada && <Aviso>Contraseña cambiada. Las otras sesiones abiertas se cerraron.</Aviso>}
      </form>

      <form
        className="flex max-w-[460px] flex-col gap-4"
        onSubmit={(evento) => {
          evento.preventDefault();
          setCodigo(null);
          void generacion.enviar(async () => {
            const respuesta = await generarCodigoDeRecuperacion(contrasenaDelCodigo);
            if (!respuesta.ok) return respuesta.motivo;
            setContrasenaDelCodigo("");
            setCodigo(respuesta.valor);
            return null;
          });
        }}
      >
        <h3 className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
          Código de recuperación
        </h3>
        <p className="font-mono text-sm tracking-widest text-ink/60">••••-••••-••••-••••</p>
        {codigo === null ? (
          <>
            <Campo
              etiqueta="Tu contraseña, para generar uno nuevo"
              tipo="password"
              valor={contrasenaDelCodigo}
              alCambiar={setContrasenaDelCodigo}
              autoComplete="current-password"
            />
            {generacion.error !== null && <Aviso tipo="error">{generacion.error}</Aviso>}
            <div>
              <Boton
                type="submit"
                variante="secundario"
                disabled={generacion.enviando || contrasenaDelCodigo === ""}
              >
                Generar uno nuevo
              </Boton>
            </div>
          </>
        ) : (
          <>
            <Aviso>El código anterior dejó de servir. Guardá este — no se vuelve a mostrar.</Aviso>
            <CajaCopiable
              valor={codigo}
              grande
              descarga={{
                nombre: "nativox-acceso.txt",
                contenido: `NATIVOX — acceso de administrador\n\nEmail: ${email}\nCódigo de recuperación: ${codigo}\n\nGuardá este archivo en un lugar seguro. El código solo sirve si olvidás tu contraseña.\n`,
              }}
            />
          </>
        )}
      </form>
    </Seccion>
  );
}
