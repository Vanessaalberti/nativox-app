import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { LARGO_MINIMO_DE_CONTRASENA } from "@compartido/contratos";
import { crearCuenta } from "@navegador/modulos/cliente-instancia";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Aviso, Boton, Campo } from "@navegador/interfaz/sistema-diseno";
import { leerTipo } from "../tipo";
import { GuardaTuAcceso } from "./GuardaTuAcceso";

const NOMBRES_DE_TIPO = { "todo-en-uno": "Todo en uno", "roles-separados": "Roles separados" };

function pistaDeContrasena(contrasena: string): { texto: string; color: string } {
  if (contrasena === "") {
    return {
      texto: `Mínimo ${String(LARGO_MINIMO_DE_CONTRASENA)} caracteres. Una frase larga es más segura que una palabra con símbolos.`,
      color: "text-ink/60",
    };
  }
  if (contrasena.length < LARGO_MINIMO_DE_CONTRASENA) {
    return {
      texto: `Faltan ${String(LARGO_MINIMO_DE_CONTRASENA - contrasena.length)} caracteres.`,
      color: "text-naranja",
    };
  }
  return { texto: "✓ Largo suficiente.", color: "text-[#2f8a70]" };
}

// Paso 2 de 3: la cuenta del administrador. Al crearla se muestra "Guardá tu acceso".
export function CrearCuenta() {
  const [parametros] = useSearchParams();
  const tipo = leerTipo(parametros.get("tipo"));
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [creada, setCreada] = useState<{ email: string; codigo: string } | null>(null);

  const pista = pistaDeContrasena(contrasena);
  const enviar = async () => {
    if (contrasena !== repetida) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setEnviando(true);
    setError(null);
    const respuesta = await crearCuenta({ email, contrasena });
    setEnviando(false);
    if (!respuesta.ok) {
      setError(respuesta.motivo);
      return;
    }
    setCreada({ email: email.trim().toLowerCase(), codigo: respuesta.valor.codigo });
  };

  if (creada) {
    return <GuardaTuAcceso tipo={tipo} email={creada.email} codigo={creada.codigo} />;
  }

  return (
    <MarcoDeEntrada ancho="angosto" centrado={false}>
      <Link
        to="/crear-evento"
        className="mb-6 font-mono text-[11px] tracking-widest text-ink/50 uppercase hover:text-ink"
      >
        ← Volver
      </Link>
      <span className="block font-mono text-[11px] tracking-widest text-verde uppercase">
        {NOMBRES_DE_TIPO[tipo]} — Paso 2 de 3
      </span>
      <h1 className="mt-3 mb-4 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase">
        Tu cuenta de
        <br />
        administrador
      </h1>
      <p className="mb-10 text-base text-ink/80">
        Con esta cuenta entrás al panel de tu evento desde cualquier dispositivo. Protege la
        configuración: nadie más puede entrar sin ella, aunque tenga el link de tu instancia.
      </p>
      <form
        className="flex flex-col gap-6"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar();
        }}
      >
        <Campo
          etiqueta="Email"
          tipo="email"
          valor={email}
          alCambiar={setEmail}
          placeholder="vos@tuevento.com"
          autoComplete="email"
          acento="verde"
        />
        <Campo
          etiqueta="Contraseña"
          tipo="password"
          valor={contrasena}
          alCambiar={setContrasena}
          placeholder={`Mínimo ${String(LARGO_MINIMO_DE_CONTRASENA)} caracteres`}
          autoComplete="new-password"
          acento="verde"
          ayuda={<span className={pista.color}>{pista.texto}</span>}
        />
        <Campo
          etiqueta="Repetí la contraseña"
          tipo="password"
          valor={repetida}
          alCambiar={setRepetida}
          autoComplete="new-password"
          acento="verde"
        />
        {error !== null && <Aviso tipo="error">{error}</Aviso>}
        <Aviso>
          Tu cuenta vive solo en tu instancia de Cloudflare — no en servidores de terceros. La
          contraseña se guarda cifrada; nadie puede leerla, ni siquiera desde el panel de
          Cloudflare.
        </Aviso>
        <Boton
          type="submit"
          variante="acento"
          disabled={enviando || email === "" || contrasena === "" || repetida === ""}
        >
          Crear cuenta <span aria-hidden>→</span>
        </Boton>
      </form>
    </MarcoDeEntrada>
  );
}
