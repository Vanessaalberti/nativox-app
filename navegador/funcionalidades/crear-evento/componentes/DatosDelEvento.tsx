import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { TIPOS_DE_EVENTO, type TipoDeEvento } from "@compartido/contratos";
import { crearEvento } from "@navegador/modulos/cliente-instancia";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Aviso, Boton, Campo } from "@navegador/interfaz/sistema-diseno";
import type { Duracion } from "../estimador";
import { leerTipo } from "../tipo";
import { EstimadorDeCosto } from "./EstimadorDeCosto";
import { EvaluarComputadora } from "./EvaluarComputadora";
import { LogoYNombre } from "./LogoYNombre";

const NOMBRES_DE_TIPO: Record<TipoDeEvento, string> = {
  "todo-en-uno": "Todo en uno",
  "roles-separados": "Roles separados",
};

const AYUDA_DEL_NOMBRE: Record<TipoDeEvento, string> = {
  "todo-en-uno":
    "El nombre reemplaza el genérico en tu panel y en la audiencia. El logo es opcional — clickeá el recuadro para subirlo.",
  "roles-separados":
    "El nombre reemplaza el genérico en admin, operador y audiencia. El logo es opcional — clickeá el recuadro para subirlo.",
};

// Paso 3 de 3: "Tu evento y la IA". Necesita la sesión del administrador (la guarda la ruta).
export function DatosDelEvento() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const [tipo, setTipo] = useState(leerTipo(parametros.get("tipo")));
  const [nombre, setNombre] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [duracion, setDuracion] = useState<Duracion>({
    salasSimultaneas: 2,
    horasPorDia: 8,
    dias: 1,
  });
  const [nube, setNube] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    setError(null);
    const respuesta = await crearEvento({
      tipo,
      nombre,
      logo,
      fechaInicio: fechaInicio === "" ? null : fechaInicio,
      fechaFin: fechaFin === "" ? null : fechaFin,
      ...duracion,
      nubeComoRespaldo: nube,
    });
    setEnviando(false);
    if (!respuesta.ok) {
      setError(respuesta.motivo);
      return;
    }
    void navegar("/panel", { replace: true });
  };

  return (
    <MarcoDeEntrada ancho="ancho" centrado={false}>
      <span className="block font-mono text-[11px] tracking-widest text-verde uppercase">
        {NOMBRES_DE_TIPO[tipo]} — Paso 3 de 3
      </span>
      <h1 className="mt-3 mb-4 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase">
        Tu evento y la IA
      </h1>
      <p className="mb-10 max-w-[760px] text-base text-ink/80">
        Contanos cuánto dura el evento: la IA corre en la computadora de cada sala, gratis y sin
        límite. Evaluá esta computadora para ver qué velocidad le conviene. No hace falta ninguna
        API key.
      </p>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <form
          className="flex flex-col gap-8"
          onSubmit={(evento) => {
            evento.preventDefault();
            void guardar();
          }}
        >
          <fieldset className="flex flex-wrap gap-6 font-mono text-sm">
            <legend className="mb-2 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
              ¿Quién opera?
            </legend>
            {TIPOS_DE_EVENTO.map((opcion) => (
              <label key={opcion} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tipo"
                  checked={tipo === opcion}
                  onChange={() => setTipo(opcion)}
                  className="accent-[#2f8a70]"
                />
                {opcion === "todo-en-uno"
                  ? "Todo en uno (administro y opero yo)"
                  : "Roles separados (mi equipo opera)"}
              </label>
            ))}
          </fieldset>

          <LogoYNombre
            nombre={nombre}
            alCambiarNombre={setNombre}
            logo={logo}
            alCambiarLogo={setLogo}
            ayuda={AYUDA_DEL_NOMBRE[tipo]}
          />

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
              Fechas del evento (opcional)
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Campo
                etiqueta="Desde"
                tipo="date"
                valor={fechaInicio}
                alCambiar={setFechaInicio}
                acento="verde"
              />
              <Campo
                etiqueta="Hasta"
                tipo="date"
                valor={fechaFin}
                alCambiar={setFechaFin}
                acento="verde"
              />
            </div>
            <p className="font-mono text-[11px] text-ink/60">
              Para eventos de varios días. Se puede definir ahora o después — y cambiar en cualquier
              momento desde Ajustes en el panel.
            </p>
          </fieldset>

          <EstimadorDeCosto
            duracion={duracion}
            alCambiar={setDuracion}
            nubeActivada={nube}
            alCambiarNube={setNube}
          />

          {error !== null && <Aviso tipo="error">{error}</Aviso>}
          <Aviso>
            Todo corre en tu propia instancia de Cloudflare y se cobra, si corresponde, en tu cuenta
            de Cloudflare — nunca se piden datos de pago acá. No hace falta ninguna key.
          </Aviso>
          <div className="flex flex-wrap items-center gap-4">
            <Boton type="submit" variante="acento" disabled={enviando || nombre.trim() === ""}>
              {tipo === "todo-en-uno" ? "Guardar y continuar" : "Guardar y crear mi primera sala"}{" "}
              <span aria-hidden>→</span>
            </Boton>
            <Link
              to="/crear-evento"
              className="font-mono text-xs tracking-widest text-ink/60 uppercase underline hover:text-ink"
            >
              Empezar de nuevo
            </Link>
          </div>
        </form>

        <div>
          <EvaluarComputadora />
        </div>
      </div>
    </MarcoDeEntrada>
  );
}
