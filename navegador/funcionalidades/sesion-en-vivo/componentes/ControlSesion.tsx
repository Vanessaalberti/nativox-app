import { useEffect, useState, type SyntheticEvent } from "react";
import { IDIOMAS, esquemaIdioma, validar, type Charla, type Idioma } from "@compartido/contratos";
import { listarFuentes, type FuenteAudio } from "@navegador/modulos/captura-audio";
import { Seleccion } from "@navegador/interfaz/sistema-diseno";
import { charlaDeAhora } from "../hooks/useDatosDeLaSala";
import type { ConfiguracionSesion } from "../motor/armar-sesion";
import { MotorDeLaSesion, type EleccionDelMotor } from "./MotorDeLaSesion";

export const NOMBRES_DE_IDIOMA: Record<Idioma, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

const etiqueta = "font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60";
const campo =
  "w-full rounded-sm border-[1.5px] border-ink/25 bg-canvas px-3 py-2 font-mono text-sm";

type TipoDeFuente = "entrada" | "pestana" | "enlace" | "archivo";

const OPCIONES_DE_FUENTE: { valor: TipoDeFuente; texto: string }[] = [
  { valor: "entrada", texto: "Entrada de audio de este equipo (cable de la consola o micrófono)" },
  { valor: "pestana", texto: "Pestaña o ventana (el audio de otro programa o sitio)" },
  { valor: "enlace", texto: "Link de un video o audio" },
  { valor: "archivo", texto: "Archivo de audio (prueba)" },
];

// A qué charla de la agenda se le guarda lo que se transcribe: la que toca ahora según el horario,
// una en particular (para transcribir una charla fuera de su horario) o ninguna.
export type EleccionDeCharla = "agenda" | "ninguna" | (string & {});

export interface PropiedadesControl {
  ocupada: boolean;
  // Con qué idiomas y qué glosario arranca el formulario (los de la sala y la charla de ahora).
  inicial?: { original: Idioma; destino: Idioma[]; glosario: string };
  charlas: readonly Charla[];
  eleccionDeCharla: EleccionDeCharla;
  alElegirCharla: (eleccion: EleccionDeCharla) => void;
  alIniciar: (configuracion: ConfiguracionSesion) => void;
}

const comoTexto = (charla: Charla) =>
  `${charla.fecha} · ${String(Math.floor(charla.inicioMin / 60)).padStart(2, "0")}:${String(charla.inicioMin % 60).padStart(2, "0")} · ${charla.titulo}`;

export function ControlSesion({
  ocupada,
  inicial,
  charlas,
  eleccionDeCharla,
  alElegirCharla,
  alIniciar,
}: PropiedadesControl) {
  const [fuentes, setFuentes] = useState<FuenteAudio[]>([]);
  const [tipoFuente, setTipoFuente] = useState<TipoDeFuente>("entrada");
  const [direccion, setDireccion] = useState("");
  const [idDispositivo, setIdDispositivo] = useState<string>("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [idiomaOriginal, setIdiomaOriginal] = useState<Idioma>(inicial?.original ?? "es");
  const [idiomasDestino, setIdiomasDestino] = useState<Idioma[]>(inicial?.destino ?? ["en", "pt"]);
  const [glosario, setGlosario] = useState(inicial?.glosario ?? "");
  const [motor, setMotor] = useState<EleccionDelMotor>({
    nivel: 2,
    traductor: "bergamot",
    donde: "local",
  });

  useEffect(() => {
    listarFuentes().then(setFuentes, () => setFuentes([]));
  }, []);

  const cambiarOriginal = (valor: string) => {
    const leido = validar(esquemaIdioma, valor);
    if (!leido.ok) return;
    setIdiomaOriginal(leido.valor);
    setIdiomasDestino(IDIOMAS.filter((idioma) => idioma !== leido.valor));
  };

  const alternarDestino = (idioma: Idioma) => {
    setIdiomasDestino((actuales) =>
      actuales.includes(idioma) ? actuales.filter((a) => a !== idioma) : [...actuales, idioma],
    );
  };

  // Al elegir una charla, el glosario y el idioma pasan a ser los de esa charla.
  const elegirCharla = (eleccion: EleccionDeCharla) => {
    alElegirCharla(eleccion);
    const charla =
      eleccion === "agenda"
        ? charlaDeAhora(charlas)
        : (charlas.find((candidata) => candidata.id === eleccion) ?? null);
    if (!charla) return;
    setGlosario(charla.glosario);
    if (charla.idioma) cambiarOriginal(charla.idioma);
  };

  const faltaLaFuente =
    (tipoFuente === "archivo" && !archivo) || (tipoFuente === "enlace" && direccion.trim() === "");

  const fuenteElegida = (): ConfiguracionSesion["fuente"] => {
    if (tipoFuente === "archivo" && archivo) return { tipo: "archivo", archivo };
    if (tipoFuente === "enlace") return { tipo: "enlace", direccion: direccion.trim() };
    if (tipoFuente === "pestana") return { tipo: "pestana" };
    return { tipo: "entrada", idDispositivo: idDispositivo || null };
  };

  const iniciar = (prueba: boolean) => {
    if (faltaLaFuente) return;
    alIniciar({
      fuente: fuenteElegida(),
      idiomaOriginal,
      idiomasDestino,
      glosario,
      nivel: motor.nivel,
      traductor: motor.traductor,
      donde: motor.donde,
      prueba,
    });
  };

  const enviar = (evento: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    evento.preventDefault();
    iniciar(false);
  };

  return (
    <form
      onSubmit={enviar}
      className="grid gap-5 border-[1.5px] border-ink/15 bg-canvas p-5 md:grid-cols-2"
    >
      <label className="flex flex-col gap-1.5 md:col-span-2">
        <span className={etiqueta}>Charla (lo que se transcribe se guarda en ella)</span>
        <select
          value={eleccionDeCharla}
          onChange={(evento) => elegirCharla(evento.target.value)}
          className={campo}
          disabled={ocupada}
        >
          <option value="agenda">Según la agenda: la que toca ahora</option>
          {charlas.map((charla) => (
            <option key={charla.id} value={charla.id}>
              {comoTexto(charla)}
            </option>
          ))}
          <option value="ninguna">Ninguna: no se guarda en una charla</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={etiqueta}>Fuente de audio</span>
        <select
          value={tipoFuente}
          onChange={(evento) =>
            setTipoFuente(
              OPCIONES_DE_FUENTE.find((opcion) => opcion.valor === evento.target.value)?.valor ??
                "entrada",
            )
          }
          className={campo}
          disabled={ocupada}
        >
          {OPCIONES_DE_FUENTE.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ))}
        </select>
      </label>
      {tipoFuente === "entrada" ? (
        <label className="flex flex-col gap-1.5">
          <span className={etiqueta}>Dispositivo</span>
          <select
            value={idDispositivo}
            onChange={(evento) => setIdDispositivo(evento.target.value)}
            className={campo}
            disabled={ocupada}
          >
            <option value="">El predeterminado del equipo</option>
            {fuentes.map((fuente) => (
              <option key={fuente.id} value={fuente.id}>
                {fuente.nombre}
              </option>
            ))}
          </select>
        </label>
      ) : tipoFuente === "pestana" ? (
        <p className="self-end font-mono text-[11px] text-ink/60">
          Al iniciar, el navegador te pide elegir la pestaña o ventana: tildá «Compartir audio».
          Sirve para un video de YouTube, una transmisión o una llamada abiertos en este equipo.
        </p>
      ) : tipoFuente === "enlace" ? (
        <label className="flex flex-col gap-1.5">
          <span className={etiqueta}>Link del video o audio (directo: .mp4, .webm, .mp3…)</span>
          <input
            type="url"
            value={direccion}
            onChange={(evento) => setDireccion(evento.target.value)}
            placeholder="https://…/video.mp4"
            className={campo}
            disabled={ocupada}
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className={etiqueta}>Archivo (suena en tiempo real, sin parlantes)</span>
          <input
            type="file"
            accept="audio/*"
            onChange={(evento) => setArchivo(evento.target.files?.[0] ?? null)}
            className={campo}
            disabled={ocupada}
          />
        </label>
      )}
      <fieldset className="flex flex-col gap-1.5" disabled={ocupada}>
        <Seleccion
          etiqueta="Idioma original"
          valor={idiomaOriginal}
          alCambiar={cambiarOriginal}
          opciones={IDIOMAS.map((idioma) => ({ valor: idioma, texto: NOMBRES_DE_IDIOMA[idioma] }))}
        />
      </fieldset>
      <fieldset className="flex flex-col gap-1.5" disabled={ocupada}>
        <legend className={etiqueta}>Traducir a</legend>
        <div className="flex gap-4 pt-2">
          {IDIOMAS.filter((idioma) => idioma !== idiomaOriginal).map((idioma) => (
            <label key={idioma} className="flex items-center gap-2 font-mono text-sm">
              <input
                type="checkbox"
                checked={idiomasDestino.includes(idioma)}
                onChange={() => alternarDestino(idioma)}
                className="accent-naranja"
              />
              {NOMBRES_DE_IDIOMA[idioma]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5 md:col-span-2">
        <span className={etiqueta}>
          Glosario (uno por renglón: término ~ variantes =&gt; en: traducción | pt: traducção)
        </span>
        <textarea
          value={glosario}
          onChange={(evento) => setGlosario(evento.target.value)}
          rows={4}
          placeholder={
            "Nerdearla ~ ner de arla\nKubernetes\nrama main => en: main branch | pt: branch main"
          }
          className={`${campo} font-mono`}
          disabled={ocupada}
        />
      </label>
      <MotorDeLaSesion eleccion={motor} ocupada={ocupada} alCambiar={setMotor} />
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={ocupada || faltaLaFuente}
          className="rounded-sm bg-naranja px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-ink shadow-sm hover:bg-ink hover:text-canvas disabled:cursor-not-allowed disabled:opacity-40"
        >
          ● Iniciar sesión
        </button>
        <button
          type="button"
          disabled={ocupada || faltaLaFuente}
          onClick={() => iniciar(true)}
          className="rounded-sm border-[1.5px] border-ink px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest hover:bg-ink hover:text-canvas disabled:cursor-not-allowed disabled:opacity-40"
        >
          Probar (no se publica ni se guarda)
        </button>
      </div>
    </form>
  );
}
