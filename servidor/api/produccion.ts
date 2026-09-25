import * as v from "valibot";
import {
  ESTILO_POR_DEFECTO,
  esquemaDatosDeSalida,
  esquemaEstiloSalida,
  type Transmision,
} from "@compartido/contratos";
import { responderError } from "@servidor/plataforma/errores";
import { conCuerpo } from "@servidor/plataforma/pedido";
import { conSala, salaInexistente } from "./con-sala";
import { comoAdministrador, type ContextoApi } from "./sesion";

const salidaInexistente = () => responderError(404, "salida_inexistente", "Esa salida no existe.");

const esquemaNuevaSalida = v.object({
  nombre: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(40)),
});

// Las salidas de producción son del administrador: cada una es un link fijo para vMix/OBS y él
// decide qué sala está al aire.
export function listarSalidas(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () =>
    Response.json({ ok: true, salidas: await contexto.produccion.listarSalidas() }),
  );
}

export function crearSalida(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaNuevaSalida, async ({ nombre }) => {
      const salida = await contexto.produccion.crearSalida(
        nombre,
        ESTILO_POR_DEFECTO,
        contexto.ahora(),
      );
      return Response.json({ ok: true, salida }, { status: 201 });
    }),
  );
}

export function actualizarSalida(
  pedido: Request,
  contexto: ContextoApi,
  numero = "",
): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaDatosDeSalida, async (datos) => {
      if (datos.salaAlAire !== null && !(await contexto.agenda.leerSala(datos.salaAlAire))) {
        return salaInexistente();
      }
      const anterior = await contexto.produccion.leerSalida(Number(numero));
      if (!anterior || !(await contexto.produccion.actualizarSalida(Number(numero), datos))) {
        return salidaInexistente();
      }
      // Cada cambio de sala al aire queda registrado (también el pasar a "sin subtítulos").
      if (anterior.salaAlAire !== datos.salaAlAire) {
        await contexto.operacion.registrarAire({
          salida: Number(numero),
          salaId: datos.salaAlAire,
          desde: contexto.ahora(),
        });
      }
      return Response.json({
        ok: true,
        salida: await contexto.produccion.leerSalida(Number(numero)),
      });
    }),
  );
}

export function borrarSalida(
  pedido: Request,
  contexto: ContextoApi,
  numero = "",
): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () =>
    (await contexto.produccion.borrarSalida(Number(numero)))
      ? Response.json({ ok: true })
      : salidaInexistente(),
  );
}

// El estilo del link de una sala (idioma, líneas, posición, letra): lo cambia el administrador o
// el operador de esa sala.
export function guardarEstiloDeSala(
  pedido: Request,
  contexto: ContextoApi,
  salaId = "",
): Promise<Response> {
  return conSala(pedido, contexto, salaId, () =>
    conCuerpo(pedido, esquemaEstiloSalida, async (estilo) => {
      await contexto.produccion.guardarEstiloDeSala(salaId, estilo);
      return Response.json({ ok: true });
    }),
  );
}

// --- Público: lo que cargan las páginas de vMix/OBS, que no tienen sesión ---

async function transmisionDe(
  contexto: ContextoApi,
  salaId: string | null,
  estilo: Transmision["estilo"],
) {
  const sala = salaId === null ? null : await contexto.agenda.leerSala(salaId);
  const cuerpo: Transmision = {
    ok: true,
    sala: sala
      ? {
          id: sala.id,
          nombre: sala.nombre,
          idiomaOriginal: sala.idiomaOriginal,
          idiomasDestino: sala.idiomasDestino,
        }
      : null,
    estilo,
  };
  return Response.json(cuerpo);
}

// /produccion/salida-:n: cuál es la sala al aire y con qué estilo.
export async function responderSalidaPublica(
  _pedido: Request,
  contexto: ContextoApi,
  numero = "",
): Promise<Response> {
  const salida = await contexto.produccion.leerSalida(Number(numero));
  return salida ? transmisionDe(contexto, salida.salaAlAire, salida.estilo) : salidaInexistente();
}

// /sala/:id/transmision: la sala y su estilo propio (o el de por defecto).
export async function responderTransmisionDeSala(
  _pedido: Request,
  contexto: ContextoApi,
  salaId = "",
): Promise<Response> {
  if (!(await contexto.agenda.leerSala(salaId))) return salaInexistente();
  const estilo = (await contexto.produccion.leerEstiloDeSala(salaId)) ?? ESTILO_POR_DEFECTO;
  return transmisionDe(contexto, salaId, estilo);
}
