import { useState } from "react";
import { Link } from "react-router";
import type { TipoDeEvento } from "@compartido/contratos";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { CajaCopiable } from "@navegador/interfaz/sistema-diseno";

// El asistente no manda correos (una instancia sin dominio propio no puede): en vez de "verificá
// tu correo", se guardan dos cosas a mano: el link de la instancia y el código de recuperación,
// que se muestra una sola vez.
export function GuardaTuAcceso({
  tipo,
  email,
  codigo,
}: {
  tipo: TipoDeEvento;
  email: string;
  codigo: string;
}) {
  const [guardado, setGuardado] = useState(false);
  const direccion = window.location.origin;
  const correo = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Tu instancia de Nativox")}&body=${encodeURIComponent(
    `Tu evento en Nativox: ${direccion}\nEntrar como administrador: ${direccion}/entrada/admin\n\nGuardá este correo para encontrar tu instancia cuando la necesites.`,
  )}`;

  return (
    <MarcoDeEntrada ancho="angosto" centrado={false}>
      <span className="block font-mono text-[11px] tracking-widest text-verde uppercase">
        Crear evento — Paso 2 de 3
      </span>
      <h1 className="mt-3 mb-4 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase">
        Guardá tu acceso
      </h1>
      <p className="mb-8 text-base text-ink/80">
        Cuenta creada para <strong>{email}</strong>. Antes de seguir, guardá estas dos cosas — son
        las que te permiten volver a entrar.
      </p>

      <section className="mb-8">
        <h2 className="mb-3 font-mono text-[11px] font-bold tracking-widest text-verde uppercase">
          01 · El link de tu evento
        </h2>
        <CajaCopiable valor={direccion} />
        <a
          href={correo}
          className="mt-3 inline-block font-mono text-xs tracking-widest text-ink/70 uppercase underline hover:text-ink"
        >
          Enviármelo por correo ↗
        </a>
        <p className="mt-3 font-mono text-[11px] text-ink/60">
          «Enviármelo por correo» abre tu propio correo con el link ya escrito, para que te quede en
          la bandeja. Siempre lo podés encontrar también en tu panel de Cloudflare → Workers y
          Pages.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-1 font-mono text-[11px] font-bold tracking-widest text-verde uppercase">
          02 · Código de recuperación
        </h2>
        <p className="mb-3 font-mono text-[10px] tracking-widest text-naranja uppercase">
          Se muestra una sola vez
        </p>
        <CajaCopiable
          valor={codigo}
          grande
          descarga={{
            nombre: "nativox-acceso.txt",
            contenido: `NATIVOX — acceso de administrador\n\nLink del evento: ${direccion}\nEmail: ${email}\nCódigo de recuperación: ${codigo}\n\nGuardá este archivo en un lugar seguro. El código solo sirve si olvidás tu contraseña.\n`,
          }}
        />
        <p className="mt-3 font-mono text-[11px] text-ink/60">
          Si olvidás tu contraseña, este código es la única forma de volver a entrar. Por seguridad
          no va en el correo — guardalo en tu gestor de contraseñas o en el archivo descargado.
        </p>
      </section>

      <label className="mb-6 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={guardado}
          onChange={(evento) => setGuardado(evento.target.checked)}
          className="mt-1 accent-[#2f8a70]"
        />
        Ya guardé el link de mi evento y el código de recuperación.
      </label>
      {guardado ? (
        <Link
          to={`/crear-evento/evento?tipo=${tipo}`}
          className="inline-flex items-center justify-center gap-3 border-[3px] border-[#2f8a70] bg-verde px-6 py-3.5 font-mono text-sm font-bold tracking-widest uppercase hover:bg-[#3bab8a]"
        >
          Continuar: tu evento y la IA <span aria-hidden>→</span>
        </Link>
      ) : (
        <span
          aria-disabled
          className="inline-flex cursor-not-allowed items-center justify-center gap-3 border-[3px] border-ink/20 px-6 py-3.5 font-mono text-sm font-bold tracking-widest text-ink/40 uppercase"
        >
          Continuar: tu evento y la IA <span aria-hidden>→</span>
        </span>
      )}
    </MarcoDeEntrada>
  );
}
