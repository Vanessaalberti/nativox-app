import { useState } from "react";
import { Link } from "react-router";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Aviso, Boton } from "@navegador/interfaz/sistema-diseno";
import { useMonitoreo } from "../hooks/useMonitoreo";

const ESCENARIOS = [
  {
    id: "modelo",
    texto: "Se traba el modelo (hay audio, no sale texto)",
    eventos: [
      ["🟡", "Sin texto hace 10 s con audio entrando."],
      ["🟡", "Reparación automática: se reinició el modelo desde el disco y volvió en 6 s."],
    ],
    discord: "🟡 Sala — no salía texto hace 10 s. Se reinició el modelo sola y volvió en 6 s ✓",
  },
  {
    id: "internet",
    texto: "Se corta internet",
    eventos: [
      ["🔴", "Sin conexión con la sala."],
      ["🟢", "Se reconectó y se enviaron las líneas pendientes."],
    ],
    discord: "🟡 Sala — se cortó internet. Se reconectó sola y no se perdió ninguna línea ✓",
  },
  {
    id: "cable",
    texto: "Se desconecta el cable de la consola",
    eventos: [["🔴", "La entrada de audio dejó de dar señal."]],
    discord: "🔴 Sala — no da señal de audio hace 30 s. No se pudo reparar sola.",
  },
  {
    id: "apagada",
    texto: "Se apaga la computadora",
    eventos: [["🔴", "La computadora de la sala dejó de responder."]],
    discord: "🔴 Sala — no da señal hace 30 s y no pudo repararse sola.",
  },
] as const;

const tarjeta = "border-[1.5px] border-ink/25 bg-canvas p-5";
const subtitulo = "font-mono text-[10px] font-bold tracking-widest text-ink/60 uppercase";

const hora = (fecha: Date) =>
  fecha.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// /sala/:id/monitoreo — cómo va la sala en vivo: si la computadora está conectada, cuánto hace de
// la última señal, la latencia, cuántas personas la miran y un registro de lo que pasó. Las
// acciones (reiniciar, pasar a la nube) las pide este panel y las ejecuta la computadora de la sala.
export function MonitoreoDeSala({ salaId, volverA }: { salaId: string; volverA: string }) {
  const monitoreo = useMonitoreo(salaId);
  const [escenario, setEscenario] = useState<string>(ESCENARIOS[0].id);
  const [simulados, setSimulados] = useState<string[]>([]);
  const { estado, sala } = monitoreo;

  const pedir = (accion: "reiniciar" | "pasar-a-la-nube" | "silenciar-avisos", texto: string) => {
    monitoreo.enviar({ tipo: "comando", id: `c-${String(Date.now())}`, accion });
    monitoreo.anotar("↻", texto);
  };

  const simular = () => {
    const elegido = ESCENARIOS.find((candidato) => candidato.id === escenario);
    if (!elegido) return;
    for (const [icono, texto] of elegido.eventos) monitoreo.anotar(icono, `${texto} (simulado)`);
    setSimulados((actuales) => [elegido.discord, ...actuales].slice(0, 5));
  };

  return (
    <MarcoDeEntrada ancho="ancho" centrado={false}>
      <Link
        to={volverA}
        className="mb-6 font-mono text-[11px] tracking-widest text-ink/50 uppercase hover:text-ink"
      >
        ← Volver
      </Link>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
            Monitoreo en vivo
          </span>
          <h1 className="mt-2 font-display text-6xl leading-[0.95] font-extrabold tracking-tight uppercase">
            {sala?.nombre ?? "Sala"}
          </h1>
        </div>
        <span
          role="status"
          className={`px-3 py-1.5 font-mono text-xs font-bold tracking-widest uppercase ${monitoreo.enVivo ? "bg-verde/30" : monitoreo.sinSenal ? "bg-[#b8241f]/20 text-[#b8241f]" : "bg-ink/10 text-ink/70"}`}
        >
          {monitoreo.enVivo ? "● En vivo" : monitoreo.sinSenal ? "Sin señal" : "Sin transmitir"}
        </span>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Latencia promedio", `${String(monitoreo.latenciaPromedioMs)} ms`],
          ["Oyentes conectados", String(estado?.espectadores ?? 0)],
          ["Sesiones en vivo", String(estado?.publicando ?? 0)],
          ["Errores (última hora)", String(monitoreo.errores)],
        ].map(([nombre, valor]) => (
          <div key={nombre} className={tarjeta}>
            <p className="font-display text-5xl leading-none">{valor}</p>
            <p className={`mt-1 ${subtitulo}`}>{nombre}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${tarjeta} flex flex-col gap-4`}>
          <h2 className={subtitulo}>Equipo de la sala</h2>
          <p className="font-display text-3xl leading-none uppercase">
            {estado && estado.publicando > 0
              ? "Computadora conectada"
              : "Sin computadora conectada"}
          </p>
          <p className="font-mono text-xs text-ink/70">
            Última señal:{" "}
            {monitoreo.segundosSinSenal === null
              ? "todavía no llegó ninguna"
              : `hace ${String(monitoreo.segundosSinSenal)} s`}
            {" · "}Conexión del monitoreo: {monitoreo.conexion}
          </p>
          <div>
            <p className={`mb-1 ${subtitulo}`}>Nivel de audio</p>
            <div className="h-2.5 w-full bg-ink/10" aria-hidden>
              <div
                className="h-full bg-verde transition-[width]"
                style={{ width: `${String(Math.round((estado?.senal?.nivelAudio ?? 0) * 100))}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Boton
              variante="secundario"
              disabled={!estado || estado.publicando === 0}
              onClick={() => pedir("reiniciar", "Se pidió reiniciar la sala.")}
            >
              ↻ Reiniciar sala
            </Boton>
            <Boton
              variante="secundario"
              disabled={!estado || estado.publicando === 0}
              onClick={() => pedir("pasar-a-la-nube", "Se pidió pasar la transcripción a la nube.")}
            >
              Pasar a la nube
            </Boton>
            <Boton
              variante="secundario"
              disabled
              title="El equipo de reserva todavía no está disponible"
            >
              ⇄ Equipo de reserva
            </Boton>
            <Boton
              variante="secundario"
              onClick={() => pedir("silenciar-avisos", "Se silenciaron los avisos por 30 minutos.")}
            >
              Silenciar avisos 30 min
            </Boton>
          </div>
          <p className="font-mono text-[11px] text-ink/60">
            «Reiniciar» recarga la sesión en la computadora de la sala y sigue donde estaba, y
            «Silenciar avisos» calla los avisos de esta sala por 30 minutos. «Pasar a la nube» y el
            equipo de reserva todavía no se pueden ejecutar: quedan anotados en el registro. Las
            mismas acciones llegan como links en los avisos del canal, para resolverlas desde el
            celular.
          </p>
        </section>

        <section className={`${tarjeta} flex flex-col gap-4`}>
          <h2 className={subtitulo}>Modo caos (demo)</h2>
          <p className="text-sm text-ink/70">
            Simulá una falla para ver cómo la registra el panel y qué llegaría a Discord. No afecta
            a la sala real.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className={subtitulo}>Qué falla</span>
            <select
              value={escenario}
              onChange={(evento) => setEscenario(evento.target.value)}
              className="border-[1.5px] border-ink/25 bg-canvas px-3 py-3 font-mono text-sm"
            >
              {ESCENARIOS.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.texto}
                </option>
              ))}
            </select>
          </label>
          <div>
            <Boton onClick={simular}>Simular</Boton>
          </div>
          <div>
            <p className={`mb-2 ${subtitulo}`}>Lo que llega a Discord</p>
            {simulados.length === 0 ? (
              <p className="font-mono text-xs text-ink/50">Todavía no simulaste nada.</p>
            ) : (
              <ul className="flex flex-col gap-1.5 font-mono text-xs">
                {simulados.map((texto, indice) => (
                  <li key={`${String(indice)}-${texto}`}>{texto}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className={`${tarjeta} mt-6`}>
        <h2 className={`mb-3 ${subtitulo}`}>Log de eventos</h2>
        {monitoreo.registro.length === 0 ? (
          <Aviso>
            Todavía no pasó nada. Cuando la computadora de la sala se conecte, lo vas a ver acá.
          </Aviso>
        ) : (
          <ol className="flex max-h-[320px] flex-col gap-1.5 overflow-y-auto font-mono text-xs">
            {monitoreo.registro.map((evento, indice) => (
              <li key={`${String(indice)}-${evento.texto}`} className="flex gap-3">
                <span className="text-ink/50">{hora(evento.hora)}</span>
                <span aria-hidden>{evento.icono}</span>
                <span>{evento.texto}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </MarcoDeEntrada>
  );
}
