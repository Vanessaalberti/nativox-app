import type { Audiencia } from "@compartido/contratos";
import type { ContextoApi } from "./sesion";

// Lo que ve cualquiera que abre la instancia: el evento, sus salas (si están en vivo) y sus
// charlas. Es público a propósito (la audiencia no tiene cuenta) y no incluye glosarios ni equipo.
export async function responderAudiencia(
  _pedido: Request,
  contexto: ContextoApi,
): Promise<Response> {
  const [evento, salas] = await Promise.all([
    contexto.almacen.leerEvento(),
    contexto.agenda.listarSalas(),
  ]);

  const publicas = await Promise.all(
    salas.map(async (sala) => {
      const [charlas, vivo] = await Promise.all([
        contexto.agenda.listarCharlas(sala.id),
        contexto.tiempoReal.resumen(sala.id),
      ]);
      return {
        id: sala.id,
        nombre: sala.nombre,
        idiomaOriginal: sala.idiomaOriginal,
        idiomasDestino: sala.idiomasDestino,
        enVivo: vivo.enVivo,
        // Solo lo que es público: sin el glosario ni el id de la sala.
        charlas: charlas.map((charla) => ({
          id: charla.id,
          titulo: charla.titulo,
          resumen: charla.resumen,
          oradores: charla.oradores,
          fecha: charla.fecha,
          inicioMin: charla.inicioMin,
          finMin: charla.finMin,
          idioma: charla.idioma,
        })),
      };
    }),
  );

  const cuerpo: Audiencia = {
    ok: true,
    evento: evento ? { nombre: evento.nombre, logo: evento.logo } : null,
    salas: publicas,
  };
  return Response.json(cuerpo);
}
