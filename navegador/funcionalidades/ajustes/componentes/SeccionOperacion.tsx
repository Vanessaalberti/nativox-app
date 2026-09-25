import { useState } from "react";
import type { Ajustes } from "@compartido/contratos";
import { Aviso, Boton, Campo, Interruptor } from "@navegador/interfaz/sistema-diseno";
import { Seccion } from "./Seccion";

const AVISOS_DE_EJEMPLO = [
  "🟢 Sala Auditorio — empezó «Kubernetes en producción» · glosario cargado: 14 términos",
  "🟡 Sala 3 — no salía texto hace 10 s. Se reinició el modelo sola y volvió en 6 s ✓",
  "🔴 Sala 2 — no da señal hace 30 s y no pudo repararse sola.",
  "📊 Resumen del día — Sala 1: 7 h 52 min en vivo · 2 cortes resueltos solos · latencia media 3,1 s",
];

const LISTA_DE_CONTROL = [
  'En la BIOS: encender al volver la luz ("Restore on AC power loss").',
  "Inicio de sesión automático en el sistema y sin suspensión.",
  "Chrome abre la sala al iniciar, a pantalla completa (modo kiosco).",
  'Micrófono o entrada de audio: "Permitir siempre" para tu instancia.',
  '"Evaluar esta computadora" hecho: los modelos quedan guardados y se activan sin internet.',
  "Actualizaciones automáticas en pausa durante el evento.",
];

// "Salas sin nadie al lado": el canal de avisos (webhook), qué avisar y cómo se cuidan solas.
export function SeccionOperacion({
  ajustes,
  webhookConfigurado,
  alGuardar,
  alGuardarWebhook,
  alProbarWebhook,
}: {
  ajustes: Ajustes;
  webhookConfigurado: boolean;
  // Devuelven el motivo si no se pudo (null si salió bien).
  alGuardar: (ajustes: Ajustes) => Promise<string | null>;
  alGuardarWebhook: (url: string | null) => Promise<string | null>;
  alProbarWebhook: () => Promise<string | null>;
}) {
  const [direccion, setDireccion] = useState("");
  const [mensaje, setMensaje] = useState<{ tipo: "nota" | "error"; texto: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cambiar = async (nuevos: Ajustes) => setError(await alGuardar(nuevos));
  const avisar = (parcial: Partial<Ajustes["avisar"]>) =>
    void cambiar({ ...ajustes, avisar: { ...ajustes.avisar, ...parcial } });
  const operacion = (parcial: Partial<Ajustes["operacion"]>) =>
    void cambiar({ ...ajustes, operacion: { ...ajustes.operacion, ...parcial } });

  const resolver = async (accion: () => Promise<string | null>, exito: string) => {
    const motivo = await accion();
    setMensaje(motivo === null ? { tipo: "nota", texto: exito } : { tipo: "error", texto: motivo });
  };

  return (
    <Seccion
      titulo="Salas sin nadie al lado"
      texto="Cada sala arranca con la agenda, se repara sola y, si algo no se puede arreglar, te avisa por Discord. Nadie tiene que estar al lado de la computadora ni entrar por escritorio remoto."
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
            Avisos por Discord
          </h3>
          <span
            className={`px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest uppercase ${webhookConfigurado ? "bg-verde/30" : "bg-ink/10 text-ink/60"}`}
          >
            {webhookConfigurado ? "Conectado" : "Sin conectar"}
          </span>
        </div>
        <p className="max-w-[760px] text-sm text-ink/70">
          Pegá el link de un webhook del canal de producción. Lo usa solo tu instancia y no se
          vuelve a mostrar. También sirve un webhook de Slack o de Google Chat.
        </p>
        <form
          className="flex max-w-[760px] flex-col gap-3"
          onSubmit={(evento) => {
            evento.preventDefault();
            void resolver(async () => {
              const motivo = await alGuardarWebhook(direccion.trim());
              if (motivo === null) setDireccion("");
              return motivo;
            }, "Webhook guardado. Tocá «Probar» para ver si llega un mensaje.");
          }}
        >
          <Campo
            etiqueta="Dirección del webhook"
            tipo="password"
            valor={direccion}
            alCambiar={setDireccion}
            placeholder={
              webhookConfigurado
                ? "Guardado (pegá otro para reemplazarlo)"
                : "https://discord.com/api/webhooks/…"
            }
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-3">
            <Boton type="submit" disabled={direccion.trim() === ""}>
              Guardar
            </Boton>
            <Boton
              variante="secundario"
              disabled={!webhookConfigurado}
              onClick={() =>
                void resolver(
                  alProbarWebhook,
                  "Llegó el mensaje de prueba: el canal quedó bien conectado.",
                )
              }
            >
              Probar
            </Boton>
            <Boton
              variante="secundario"
              disabled={!webhookConfigurado}
              onClick={() => void resolver(() => alGuardarWebhook(null), "Webhook borrado.")}
            >
              Borrar
            </Boton>
          </div>
        </form>
        {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
        <details className="max-w-[760px] border-[1.5px] border-ink/20 p-4 text-sm">
          <summary className="cursor-pointer font-mono text-[11px] font-bold tracking-widest uppercase">
            ¿Cómo creo el webhook? (1 minuto)
          </summary>
          <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-ink/80">
            <li>En Discord, abrí tu servidor → Ajustes del servidor → Integraciones → Webhooks.</li>
            <li>
              Nuevo webhook: elegí el canal del equipo de producción (por ejemplo, #produccion) y
              llamalo «Nativox».
            </li>
            <li>Copiar URL del webhook y pegala acá arriba.</li>
            <li>Tocá Probar: tiene que llegar un mensaje a ese canal.</li>
          </ol>
          <p className="mt-3 font-mono text-[11px] text-ink/60">
            Necesitás el permiso «Gestionar webhooks» en ese servidor. No hace falta crear un bot.
          </p>
        </details>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
          Así llegan a tu canal
        </h3>
        <ul className="flex max-w-[860px] flex-col gap-1.5 font-mono text-xs text-ink/75">
          {AVISOS_DE_EJEMPLO.map((aviso) => (
            <li key={aviso}>{aviso}</li>
          ))}
        </ul>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
          Qué avisar
        </legend>
        <Interruptor
          etiqueta="🔴 Una sala que no se pudo reparar sola (siempre)"
          valor
          deshabilitado
          alCambiar={() => undefined}
        />
        <Interruptor
          etiqueta="🟡 Un problema que se reparó solo"
          valor={ajustes.avisar.reparadoSolo}
          alCambiar={(valor) => avisar({ reparadoSolo: valor })}
        />
        <Interruptor
          etiqueta="🟢 Empieza y termina cada charla"
          valor={ajustes.avisar.charlas}
          alCambiar={(valor) => avisar({ charlas: valor })}
        />
        <Interruptor
          etiqueta="📊 Resumen al final del día"
          valor={ajustes.avisar.resumenDelDia}
          alCambiar={(valor) => avisar({ resumenDelDia: valor })}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
          Cómo se cuida la sala
        </legend>
        <Interruptor
          etiqueta="Reparación automática."
          ayuda="Si se corta el audio, la conexión o el modelo, la sala lo intenta sola en tres pasos: reconecta, reinicia el modelo desde el disco y, si hace falta, recarga la página y retoma. Solo avisa en rojo si no lo logra."
          valor={ajustes.operacion.autorreparacion}
          alCambiar={(valor) => operacion({ autorreparacion: valor })}
        />
        <Interruptor
          etiqueta="Arrancar y parar cada sala con la agenda."
          ayuda="A la hora de cada charla la sala empieza sola, con el idioma y el glosario de esa charla. Si se estira, corta en el primer silencio (hasta 15 min después) y guarda la transcripción."
          valor={ajustes.operacion.arranqueConAgenda}
          alCambiar={(valor) => operacion({ arranqueConAgenda: valor })}
        />
        <Interruptor
          etiqueta="Equipo de reserva."
          ayuda="Si una sala no da señal y no vuelve, un equipo marcado como reserva (por ejemplo, una laptop con el panel abierto) la toma y transcribe en la nube mientras se arregla."
          valor={ajustes.operacion.equipoDeReserva}
          alCambiar={(valor) => operacion({ equipoDeReserva: valor })}
        />
        {error !== null && <Aviso tipo="error">{error}</Aviso>}
        <p className="font-mono text-[11px] text-ink/60">
          La reparación automática ya se aplica en la sesión en vivo (si la entrada de audio se
          corta, se vuelve a abrir hasta 3 veces). Al empezar y terminar la sesión, la sala marca la
          charla en curso y guarda su transcripción. El arranque automático con la agenda y el
          equipo de reserva se guardan como preferencia pero todavía no se aplican.
        </p>
      </fieldset>

      <details className="max-w-[760px] border-[1.5px] border-ink/20 p-4 text-sm">
        <summary className="cursor-pointer font-mono text-[11px] font-bold tracking-widest uppercase">
          Dejá cada computadora lista para volver sola (checklist)
        </summary>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-ink/80">
          {LISTA_DE_CONTROL.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ul>
      </details>
    </Seccion>
  );
}
