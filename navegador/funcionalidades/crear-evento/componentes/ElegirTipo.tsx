import { Link } from "react-router";
import type { TipoDeEvento } from "@compartido/contratos";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Aviso } from "@navegador/interfaz/sistema-diseno";

const ROLES = [
  {
    nombre: "Administrador",
    texto:
      "Configura el evento y las salas, invita operadores y les asigna salas, monitorea todo, controla el consumo y los topes, y elimina el evento al terminar.",
  },
  {
    nombre: "Operador",
    texto:
      "Maneja sus salas en vivo: elige la fuente de audio, inicia y pausa la transcripción, corrige el glosario, y copia el link para OBS y el QR para la audiencia.",
  },
];

const OPCIONES: {
  tipo: TipoDeEvento;
  numero: string;
  titulo: string;
  subtitulo: string;
  texto: string;
  ventajas: string[];
}[] = [
  {
    tipo: "todo-en-uno",
    numero: "01 · Todo en uno",
    titulo: "Administrás\ny operás vos",
    subtitulo: "Una cuenta con los dos roles",
    texto: "Ideal para eventos chicos o si una sola persona maneja todas las salas.",
    ventajas: [
      "Un solo panel: salas, calendario, monitoreo y transmisión en vivo",
      "Sin invitaciones ni permisos que gestionar",
      "Podés operar varias salas desde la misma computadora",
    ],
  },
  {
    tipo: "roles-separados",
    numero: "02 · Equipo",
    titulo: "Roles\nseparados",
    subtitulo: "Vos administrás, tu equipo opera",
    texto:
      "Ideal para eventos con muchas salas u operadores. Cada operador entra con su propio código y solo ve sus salas.",
    ventajas: [
      "Panel de administración y panel propio para cada operador",
      "Códigos de invitación y permisos por sala",
      "Monitoreo de todas las salas y de quién controla cada una",
    ],
  },
];

// Paso 1 de 3: ¿una persona hace todo o hay un equipo? La instalación es la misma.
export function ElegirTipo() {
  return (
    <MarcoDeEntrada>
      <Link
        to="/"
        className="mb-6 font-mono text-[11px] tracking-widest text-ink/50 uppercase hover:text-ink"
      >
        ← Volver
      </Link>
      <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
        Crear evento — Paso 1 de 3
      </span>
      <h1 className="mt-3 mb-5 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase md:text-6xl">
        ¿Quién administra
        <br />y quién opera?
      </h1>
      <p className="mb-10 max-w-[640px] text-lg text-ink/80">
        Todo evento tiene dos roles. Pueden estar en una misma persona o repartidos en un equipo —
        la instalación es la misma en los dos casos.
      </p>

      <div className="mb-10 grid w-full max-w-[900px] gap-4 text-left md:grid-cols-2">
        {ROLES.map((rol) => (
          <div key={rol.nombre} className="border-[1.5px] border-ink/25 bg-canvas px-5 py-4">
            <span className="font-mono text-[11px] tracking-widest text-ink/50 uppercase">Rol</span>
            <p className="mt-1 mb-3 font-display text-2xl leading-none uppercase">{rol.nombre}</p>
            <p className="text-sm leading-relaxed text-ink/70">{rol.texto}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid w-full max-w-[900px] gap-6 md:grid-cols-2 md:gap-8">
        {OPCIONES.map((opcion) => (
          <Link
            key={opcion.tipo}
            to={`/crear-evento/cuenta?tipo=${opcion.tipo}`}
            className="group flex flex-col items-start border-[1.5px] border-ink/30 bg-canvas p-8 text-left transition-colors hover:border-ink"
          >
            <span className="mb-6 font-mono text-[11px] tracking-widest text-naranja uppercase">
              {opcion.numero}
            </span>
            <span className="mb-2 font-display text-4xl leading-[0.95] whitespace-pre-line uppercase">
              {opcion.titulo}
            </span>
            <span className="mb-4 font-mono text-[11px] tracking-widest text-ink/50 uppercase">
              {opcion.subtitulo}
            </span>
            <span className="mb-6 text-sm text-ink/70">{opcion.texto}</span>
            <ul className="mb-8 flex flex-col gap-2 text-sm text-ink/80">
              {opcion.ventajas.map((ventaja) => (
                <li key={ventaja}>✓ {ventaja}</li>
              ))}
            </ul>
            <span className="mt-auto flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-naranja uppercase">
              Empezar{" "}
              <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                →
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="max-w-[900px] text-left">
        <Aviso>
          En los dos casos: creás tu cuenta de administrador (email y contraseña), elegís cómo corre
          la IA y todo queda en tu propia instancia de Cloudflare. No hace falta ninguna API key:
          tus datos nunca pasan por servidores de terceros.
        </Aviso>
      </div>
    </MarcoDeEntrada>
  );
}
