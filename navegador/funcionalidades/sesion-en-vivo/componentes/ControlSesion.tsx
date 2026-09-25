import { useEffect, useState, type SyntheticEvent } from "react";
import { IDIOMAS, esquemaIdioma, validar, type Idioma } from "@compartido/contratos";
import { listarFuentes, type FuenteAudio } from "@navegador/modulos/captura-audio";
import { Seleccion } from "@navegador/interfaz/sistema-diseno";
import type { ConfiguracionSesion } from "../motor/armar-sesion";

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

export interface PropiedadesControl {
  ocupada: boolean;
  // Con qué idiomas y qué glosario arranca el formulario (los de la sala y la charla de ahora).
  inicial?: { original: Idioma; destino: Idioma[]; glosario: string };
  alIniciar: (configuracion: ConfiguracionSesion) => void;
}

export function ControlSesion({ ocupada, inicial, alIniciar }: PropiedadesControl) {
  const [fuentes, setFuentes] = useState<FuenteAudio[]>([]);
  const [tipoFuente, setTipoFuente] = useState<TipoDeFuente>("entrada");
  const [direccion, setDireccion] = useState("");
  const [idDispositivo, setIdDispositivo] = useState<string>("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [idiomaOriginal, setIdiomaOriginal] = useState<Idioma>(inicial?.original ?? "es");
  const [idiomasDestino, setIdiomasDestino] = useState<Idioma[]>(inicial?.destino ?? ["en", "pt"]);
  const [glosario, setGlosario] = useState(inicial?.glosario ?? "");
  const [textoEnVivo, setTextoEnVivo] = useState(true);

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

  const faltaLaFuente =
    (tipoFuente === "archivo" && !archivo) || (tipoFuente === "enlace" && direccion.trim() === "");

  const fuenteElegida = (): ConfiguracionSesion["fuente"] => {
    if (tipoFuente === "archivo" && archivo) return { tipo: "archivo", archivo };
    if (tipoFuente === "enlace") return { tipo: "enlace", direccion: direccion.trim() };
    if (tipoFuente === "pestana") return { tipo: "pestana" };
    return { tipo: "entrada", idDispositivo: idDispositivo || null };
  };

  const enviar = (evento: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    evento.preventDefault();
    if (faltaLaFuente) return;
    alIniciar({
      fuente: fuenteElegida(),
      idiomaOriginal,
      idiomasDestino,
      glosario,
      textoEnVivo,
    });
  };

  return (
    <form
      onSubmit={enviar}
      className="grid gap-5 border-[1.5px] border-ink/15 bg-canvas p-5 md:grid-cols-2"
    >
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
      <label className="flex items-center gap-2 font-mono text-sm md:col-span-2">
        <input
          type="checkbox"
          checked={textoEnVivo}
          onChange={(evento) => setTextoEnVivo(evento.target.checked)}
          className="accent-naranja"
          disabled={ocupada}
        />
        Texto en vivo mientras se habla (gris hasta que se confirma la frase)
      </label>
      <button
        type="submit"
        disabled={ocupada || faltaLaFuente}
        className="rounded-sm bg-naranja px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-ink shadow-sm hover:bg-ink hover:text-canvas disabled:cursor-not-allowed disabled:opacity-40 md:col-span-2 md:justify-self-start"
      >
        ● Iniciar sesión
      </button>
    </form>
  );
}
