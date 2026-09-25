import { DurableObject } from "cloudflare:workers";
import {
  esquemaMensajeSala,
  esquemaSenal,
  validar,
  type AvisoAgenda,
  type EstadoSala,
  type Linea,
  type MensajeSala,
  type RolDeSala,
  type Senal,
} from "@compartido/contratos";
import { leerGlosario } from "@compartido/glosario";
import { mezclarLinea } from "@compartido/lineas";
import {
  avisoDeCharla,
  avisoRecuperada,
  avisoSinSenal,
  debeAvisar,
  estaSilenciado,
  evaluarSenal,
  MINUTOS_DE_SILENCIO,
  MINUTOS_DE_VIGENCIA_DE_LOS_LINKS,
  type TipoDeAviso,
} from "@servidor/modulos/avisos";
import { generarToken, hashearToken } from "@servidor/modulos/cripto-acceso";
import { crearAlmacenAgendaD1 } from "@servidor/plataforma/almacen-agenda-d1";
import { crearAlmacenAjustesD1 } from "@servidor/plataforma/almacen-ajustes-d1";
import { crearAlmacenOperacionD1 } from "@servidor/plataforma/almacen-operacion-d1";
import type { AccionDeAviso } from "@servidor/plataforma/almacen-operacion";
import { crearAvisosPorWebhook } from "@servidor/plataforma/avisos-por-webhook";
import { CLAVE_DEL_WEBHOOK, leerAjustesGuardados } from "@servidor/plataforma/leer-ajustes";
import { ENCABEZADO_DE_ROL, ENCABEZADO_DE_SALA } from "@servidor/plataforma/tiempo-real";
import { estaEnVivo } from "./historial";

const CLAVE_DE_LINEAS = "lineas";
const CLAVE_DE_SENAL = "senal";
const CLAVE_DE_SALA = "sala";
const CLAVE_DE_ORIGEN = "origen";
const CLAVE_DE_CHARLA = "charla";
const CLAVE_DE_SILENCIO = "silencio";
const CLAVE_DE_ALERTA = "alerta";
const CLAVE_DE_HUBO_SENAL = "hubo";

// Cada cuánto mira la alarma si la sala sigue dando señal.
const CADA_CUANTO_SE_VIGILA_MS = 15_000;
const MS_POR_MINUTO = 60_000;

const ROLES: readonly string[] = ["publicador", "espectador", "monitor"];
const esRol = (valor: string | null): valor is RolDeSala => valor !== null && ROLES.includes(valor);

interface UltimaSenal {
  senal: Senal;
  en: number;
}

interface CharlaEnCurso {
  id: string;
  titulo: string;
}

// Un Durable Object por sala. La computadora de la sala (publicador) manda cada línea UNA vez, con
// el original y todas las traducciones; la sala la reparte a la audiencia, a vMix/OBS y al
// monitoreo. Nadie genera nada extra por espectador: cambiar de idioma es elegir qué campo mostrar.
//
// Además vigila la sala: una alarma mira cada 15 s si sigue dando señal y, si se calló, avisa al
// canal del administrador (con links de un solo uso para reiniciarla o silenciar los avisos). Y va
// guardando en D1 cada frase confirmada, asociada a la charla en curso, para la transcripción.
//
// Usa WebSocket Hibernation: entre mensajes el objeto puede dormirse sin cortar las conexiones, así
// que todo lo que importa se guarda en el almacenamiento y no en variables.
export class Sala extends DurableObject<Env> {
  override async fetch(pedido: Request): Promise<Response> {
    if (pedido.headers.get("Upgrade") !== "websocket") {
      return new Response("Se esperaba una conexión WebSocket.", { status: 426 });
    }
    const rol = pedido.headers.get(ENCABEZADO_DE_ROL);
    if (!esRol(rol)) return new Response("Rol inválido.", { status: 400 });

    // Para los avisos hace falta saber qué sala es y desde qué dirección la abren la gente (los
    // links de acción se arman con ella). Se guardan porque la alarma corre sin ningún pedido.
    const salaId = pedido.headers.get(ENCABEZADO_DE_SALA);
    if (salaId) await this.ctx.storage.put(CLAVE_DE_SALA, salaId);
    await this.ctx.storage.put(CLAVE_DE_ORIGEN, new URL(pedido.url).origin);

    const { 0: cliente, 1: servidor } = new WebSocketPair();
    // Un solo dueño por sala: si otra computadora toma la sala, la anterior se desconecta.
    if (rol === "publicador") {
      for (const anterior of this.ctx.getWebSockets("publicador")) {
        anterior.close(4000, "Otra computadora tomó la sala.");
      }
    }
    this.ctx.acceptWebSocket(servidor, [rol]);

    if (rol !== "publicador") {
      for (const linea of await this.leerLineas()) servidor.send(JSON.stringify(linea));
    }
    await this.avisarEstado();
    return new Response(null, { status: 101, webSocket: cliente });
  }

  override async webSocketMessage(ws: WebSocket, mensaje: string | ArrayBuffer): Promise<void> {
    if (typeof mensaje !== "string") return;
    let dato: unknown;
    try {
      dato = JSON.parse(mensaje);
    } catch {
      return;
    }
    const valido = validar(esquemaMensajeSala, dato);
    if (!valido.ok) return;

    const [rol] = this.ctx.getTags(ws);
    if (rol === "publicador") await this.alRecibirDelPublicador(valido.valor);
    else if (rol === "monitor" && valido.valor.tipo === "comando") {
      await this.ejecutarComando(valido.valor.accion, valido.valor.id);
    }
  }

  override async webSocketClose(ws: WebSocket, codigo: number, motivo: string): Promise<void> {
    // 1005 y 1006 no se pueden mandar de vuelta al cerrar.
    ws.close(codigo === 1005 || codigo === 1006 ? 1000 : codigo, motivo);
    await this.avisarEstado();
  }

  override async webSocketError(): Promise<void> {
    await this.avisarEstado();
  }

  // Lo que la API le pregunta a la sala sin abrir un WebSocket.
  async resumen(): Promise<{ enVivo: boolean; espectadores: number }> {
    const ultima = await this.leerSenal();
    return {
      enVivo: estaEnVivo(
        this.ctx.getWebSockets("publicador").length,
        ultima?.en ?? null,
        Date.now(),
      ),
      espectadores: this.ctx.getWebSockets("espectador").length,
    };
  }

  // Una acción pedida desde un link de aviso o desde el monitoreo.
  async mandarComando(accion: AccionDeAviso): Promise<{ publicando: number }> {
    await this.ejecutarComando(accion, `a-${String(Date.now())}`);
    return { publicando: this.ctx.getWebSockets("publicador").length };
  }

  // La alarma: mira si la sala se calló (o si volvió) y avisa una sola vez por corte.
  override async alarm(): Promise<void> {
    const ahora = Date.now();
    const ultima = await this.leerSenal();
    const enAlerta = (await this.ctx.storage.get<boolean>(CLAVE_DE_ALERTA)) ?? false;
    const evaluacion = evaluarSenal({
      senalEn: ultima?.en ?? null,
      ahora,
      enAlerta,
      hubo: (await this.ctx.storage.get<boolean>(CLAVE_DE_HUBO_SENAL)) ?? false,
    });
    const segundos = ultima ? (ahora - ultima.en) / 1000 : 0;

    if (evaluacion === "avisar-caida") {
      await this.ctx.storage.put(CLAVE_DE_ALERTA, true);
      await this.avisarQueSeCayo(segundos);
    } else if (evaluacion === "avisar-recuperacion") {
      await this.ctx.storage.put(CLAVE_DE_ALERTA, false);
      await this.avisar("recuperada", (sala) => avisoRecuperada({ sala, segundos }));
    }

    // Mientras haya una computadora conectada se sigue vigilando; si no hay ninguna, la próxima
    // señal que llegue vuelve a armar la alarma.
    if (this.ctx.getWebSockets("publicador").length > 0) {
      await this.ctx.storage.setAlarm(ahora + CADA_CUANTO_SE_VIGILA_MS);
    }
  }

  private async alRecibirDelPublicador(mensaje: MensajeSala): Promise<void> {
    if (mensaje.tipo === "linea") {
      await this.ctx.storage.put(CLAVE_DE_LINEAS, mezclarLinea(await this.leerLineas(), mensaje));
      this.repartir("espectador", mensaje);
      this.repartir("monitor", mensaje);
      await this.guardarSegmento(mensaje);
    } else if (mensaje.tipo === "senal") {
      const ultima: UltimaSenal = { senal: mensaje, en: Date.now() };
      await this.ctx.storage.put(CLAVE_DE_SENAL, ultima);
      await this.ctx.storage.put(CLAVE_DE_HUBO_SENAL, true);
      if ((await this.ctx.storage.getAlarm()) === null) {
        await this.ctx.storage.setAlarm(Date.now() + CADA_CUANTO_SE_VIGILA_MS);
      }
      await this.avisarEstado();
    } else if (mensaje.tipo === "agenda") {
      this.repartir("espectador", mensaje);
      this.repartir("monitor", mensaje);
      await this.alCambiarLaCharla(mensaje);
    }
  }

  // Cada frase confirmada queda guardada, asociada a la charla en curso (si hay una): con eso se
  // arma la transcripción de la charla. Las provisorias se ven en vivo pero no se guardan.
  private async guardarSegmento(linea: Linea): Promise<void> {
    if (linea.provisoria || linea.original.trim() === "") return;
    const salaId = await this.ctx.storage.get<string>(CLAVE_DE_SALA);
    if (!salaId) return;
    const charla = await this.ctx.storage.get<CharlaEnCurso>(CLAVE_DE_CHARLA);
    await crearAlmacenOperacionD1(this.env.DB).guardarSegmento(
      salaId,
      charla?.id ?? null,
      linea,
      Date.now(),
    );
  }

  // La computadora avisa cuándo empieza y termina cada charla: desde ahí, lo que se transcribe es de
  // esa charla, y se avisa al canal si el administrador eligió ese aviso.
  private async alCambiarLaCharla(aviso: AvisoAgenda): Promise<void> {
    if (aviso.momento === "empieza") {
      await this.ctx.storage.put<CharlaEnCurso>(CLAVE_DE_CHARLA, {
        id: aviso.charlaId,
        titulo: aviso.titulo,
      });
    } else {
      await this.ctx.storage.delete(CLAVE_DE_CHARLA);
    }
    const terminos =
      aviso.momento === "empieza"
        ? leerGlosario(
            (await crearAlmacenAgendaD1(this.env.DB).leerCharla(aviso.charlaId))?.glosario ?? "",
          ).length
        : 0;
    await this.avisar("charla", (sala) =>
      avisoDeCharla({
        sala,
        titulo: aviso.titulo,
        momento: aviso.momento,
        terminosDelGlosario: terminos,
      }),
    );
  }

  private async ejecutarComando(accion: AccionDeAviso, id: string): Promise<void> {
    if (accion === "silenciar-avisos") {
      await this.ctx.storage.put(
        CLAVE_DE_SILENCIO,
        Date.now() + MINUTOS_DE_SILENCIO * MS_POR_MINUTO,
      );
      return;
    }
    this.repartir("publicador", { tipo: "comando", id, accion });
  }

  // Manda un aviso al canal del administrador, si hay uno guardado, el tipo de aviso está prendido
  // y no se silenciaron los avisos. Un canal que no responde no rompe nada.
  private async avisar(tipo: TipoDeAviso, armar: (sala: string) => string): Promise<void> {
    const almacen = crearAlmacenAjustesD1(this.env.DB);
    const direccion = await almacen.leer(CLAVE_DEL_WEBHOOK);
    if (direccion === null) return;
    if (estaSilenciado((await this.ctx.storage.get<number>(CLAVE_DE_SILENCIO)) ?? null, Date.now()))
      return;
    if (!debeAvisar(tipo, (await leerAjustesGuardados(almacen)).avisar)) return;

    await crearAvisosPorWebhook().enviar(direccion, armar(await this.nombreDeLaSala()));
  }

  private async avisarQueSeCayo(segundos: number): Promise<void> {
    const salaId = await this.ctx.storage.get<string>(CLAVE_DE_SALA);
    const origen = await this.ctx.storage.get<string>(CLAVE_DE_ORIGEN);
    if (!salaId || !origen) return;

    const operacion = crearAlmacenOperacionD1(this.env.DB);
    const venceEn = Date.now() + MINUTOS_DE_VIGENCIA_DE_LOS_LINKS * MS_POR_MINUTO;
    const enlaceDe = async (accion: AccionDeAviso) => {
      const token = generarToken();
      await operacion.crearAccion(await hashearToken(token), salaId, accion, venceEn);
      return `${origen}/accion/${token}`;
    };
    const reiniciar = await enlaceDe("reiniciar");
    const silenciar = await enlaceDe("silenciar-avisos");
    await this.avisar("sin-senal", (sala) =>
      avisoSinSenal({ sala, segundos, reiniciar, silenciar }),
    );
  }

  private async nombreDeLaSala(): Promise<string> {
    const salaId = await this.ctx.storage.get<string>(CLAVE_DE_SALA);
    const sala = salaId ? await crearAlmacenAgendaD1(this.env.DB).leerSala(salaId) : null;
    return sala?.nombre ?? "Sala";
  }

  private repartir(rol: RolDeSala, mensaje: MensajeSala): void {
    const texto = JSON.stringify(mensaje);
    for (const ws of this.ctx.getWebSockets(rol)) {
      try {
        ws.send(texto);
      } catch {
        // Una conexión que ya se cayó no debe frenar el reparto a las demás.
      }
    }
  }

  private async avisarEstado(): Promise<void> {
    const ultima = await this.leerSenal();
    const estado: EstadoSala = {
      tipo: "estado",
      publicando: this.ctx.getWebSockets("publicador").length,
      espectadores: this.ctx.getWebSockets("espectador").length,
      senal: ultima?.senal ?? null,
      senalEn: ultima?.en ?? null,
    };
    this.repartir("monitor", estado);
  }

  private async leerLineas(): Promise<Linea[]> {
    return (await this.ctx.storage.get<Linea[]>(CLAVE_DE_LINEAS)) ?? [];
  }

  private async leerSenal(): Promise<UltimaSenal | null> {
    const guardada = await this.ctx.storage.get<UltimaSenal>(CLAVE_DE_SENAL);
    if (!guardada) return null;
    const senal = validar(esquemaSenal, guardada.senal);
    return senal.ok ? { senal: senal.valor, en: guardada.en } : null;
  }
}
