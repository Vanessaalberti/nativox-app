import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ingresar, recuperar } from "@navegador/modulos/cliente-instancia";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Aviso, Boton, CajaCopiable, Campo } from "@navegador/interfaz/sistema-diseno";

type Pantalla =
  { paso: "ingresar" } | { paso: "recuperar" } | { paso: "codigo-nuevo"; codigo: string };

// /entrada/admin: ingresar con email y contraseña, recuperar el acceso con el código guardado al
// crear el evento y, tras recuperar, mostrar el código nuevo (el anterior ya no sirve).
export function EntradaAdministrador() {
  const [pantalla, setPantalla] = useState<Pantalla>({ paso: "ingresar" });

  return (
    <MarcoDeEntrada ancho="angosto" centrado={false}>
      <span className="block font-mono text-[11px] tracking-widest text-naranja uppercase">
        Acceso de administrador
      </span>
      {pantalla.paso === "ingresar" && (
        <FormularioDeIngreso alOlvidar={() => setPantalla({ paso: "recuperar" })} />
      )}
      {pantalla.paso === "recuperar" && (
        <FormularioDeRecuperacion
          alVolver={() => setPantalla({ paso: "ingresar" })}
          alRecuperar={(codigo) => setPantalla({ paso: "codigo-nuevo", codigo })}
        />
      )}
      {pantalla.paso === "codigo-nuevo" && <CodigoNuevo codigo={pantalla.codigo} />}
    </MarcoDeEntrada>
  );
}

const TITULO =
  "mt-3 mb-4 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase";

// Los formularios comparten esto: manda el pedido, muestra el error y bloquea el botón mientras espera.
function useEnvio() {
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const enviar = async (accion: () => Promise<string | null>) => {
    setEnviando(true);
    setError(null);
    const motivo = await accion();
    setEnviando(false);
    setError(motivo);
  };
  return { error, enviando, enviar };
}

function FormularioDeIngreso({ alOlvidar }: { alOlvidar: () => void }) {
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const { error, enviando, enviar } = useEnvio();

  return (
    <>
      <Link
        to="/entrada"
        className="mt-6 block font-mono text-[11px] tracking-widest text-ink/50 uppercase hover:text-ink"
      >
        ← Volver
      </Link>
      <h1 className={TITULO}>Iniciá sesión como admin</h1>
      <p className="mb-10 text-base text-ink/80">
        Entrá con el email y la contraseña que creaste al armar el evento.
      </p>
      <form
        className="flex flex-col gap-6"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar(async () => {
            const respuesta = await ingresar({ email, contrasena });
            if (!respuesta.ok) return respuesta.motivo;
            void navegar("/", { replace: true });
            return null;
          });
        }}
      >
        <Campo
          etiqueta="Email"
          tipo="email"
          valor={email}
          alCambiar={setEmail}
          placeholder="vos@tuevento.com"
          autoComplete="email"
        />
        <Campo
          etiqueta="Contraseña"
          tipo="password"
          valor={contrasena}
          alCambiar={setContrasena}
          autoComplete="current-password"
        />
        {error !== null && <Aviso tipo="error">{error}</Aviso>}
        <Boton type="submit" disabled={enviando || email === "" || contrasena === ""}>
          Entrar <span aria-hidden>→</span>
        </Boton>
        <button
          type="button"
          onClick={alOlvidar}
          className="self-start font-mono text-xs tracking-widest text-ink/60 uppercase underline hover:text-ink"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </>
  );
}

function FormularioDeRecuperacion({
  alVolver,
  alRecuperar,
}: {
  alVolver: () => void;
  alRecuperar: (codigo: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");
  const { error, enviando, enviar } = useEnvio();

  return (
    <>
      <h1 className={TITULO}>Recuperá tu acceso</h1>
      <p className="mb-10 text-base text-ink/80">
        Usá el código de recuperación que guardaste al crear el evento (está en el archivo
        nativox-acceso.txt si lo descargaste).
      </p>
      <form
        className="flex flex-col gap-6"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar(async () => {
            const respuesta = await recuperar({ email, codigo, contrasenaNueva });
            if (!respuesta.ok) return respuesta.motivo;
            alRecuperar(respuesta.valor.codigo);
            return null;
          });
        }}
      >
        <Campo
          etiqueta="Email"
          tipo="email"
          valor={email}
          alCambiar={setEmail}
          placeholder="vos@tuevento.com"
          autoComplete="email"
        />
        <Campo
          etiqueta="Código de recuperación"
          valor={codigo}
          alCambiar={setCodigo}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autoComplete="off"
        />
        <Campo
          etiqueta="Nueva contraseña"
          tipo="password"
          valor={contrasenaNueva}
          alCambiar={setContrasenaNueva}
          placeholder="Mínimo 12 caracteres"
          autoComplete="new-password"
        />
        {error !== null && <Aviso tipo="error">{error}</Aviso>}
        <Boton
          type="submit"
          disabled={enviando || email === "" || codigo === "" || contrasenaNueva === ""}
        >
          Cambiar contraseña <span aria-hidden>→</span>
        </Boton>
        <button
          type="button"
          onClick={alVolver}
          className="self-start font-mono text-xs tracking-widest text-ink/60 uppercase underline hover:text-ink"
        >
          ← Volver al inicio de sesión
        </button>
      </form>
    </>
  );
}

function CodigoNuevo({ codigo }: { codigo: string }) {
  return (
    <>
      <h1 className={TITULO}>Contraseña actualizada</h1>
      <p className="mb-8 text-base text-ink/80">
        El código que usaste ya no sirve. Este es tu código de recuperación nuevo — guardalo igual
        que el anterior.
      </p>
      <div className="mb-8">
        <CajaCopiable
          valor={codigo}
          grande
          descarga={{
            nombre: "nativox-acceso.txt",
            contenido: `NATIVOX — acceso de administrador\n\nCódigo de recuperación: ${codigo}\n\nGuardá este archivo en un lugar seguro. El código solo sirve si olvidás tu contraseña.\n`,
          }}
        />
      </div>
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-3 border-[3px] border-[#b8241f] bg-naranja px-6 py-3.5 font-mono text-sm font-bold tracking-widest uppercase hover:bg-[#e67b00]"
      >
        Ir a mi panel <span aria-hidden>→</span>
      </Link>
    </>
  );
}
