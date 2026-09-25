import type {
  AccionDeAviso,
  AlmacenOperacion,
  EntradaDelRegistro,
  SegmentoGuardado,
} from "./almacen-operacion";

interface Accion {
  salaId: string;
  accion: AccionDeAviso;
  venceEn: number;
  usada: boolean;
}

// El mismo almacén, en memoria: lo usan las pruebas de la API (sin D1 ni Workers).
export function crearAlmacenOperacionEnMemoria(): AlmacenOperacion {
  const segmentos = new Map<string, { charlaId: string | null; segmento: SegmentoGuardado }>();
  const acciones = new Map<string, Accion>();
  const registro: EntradaDelRegistro[] = [];

  return {
    guardarSegmento: (salaId, charlaId, linea) => {
      segmentos.set(`${salaId}/${linea.id}`, {
        charlaId,
        segmento: {
          id: linea.id,
          original: linea.original,
          traducciones: linea.traducciones,
          inicio: linea.inicio,
          fin: linea.fin,
        },
      });
      return Promise.resolve();
    },
    listarSegmentos: (charlaId) =>
      Promise.resolve(
        [...segmentos.values()]
          .filter((guardado) => guardado.charlaId === charlaId)
          .map((guardado) => guardado.segmento),
      ),
    crearAccion: (tokenHash, salaId, accion, venceEn) => {
      acciones.set(tokenHash, { salaId, accion, venceEn, usada: false });
      return Promise.resolve();
    },
    leerAccion: (tokenHash, ahora) => {
      const accion = acciones.get(tokenHash);
      const vigente = accion && !accion.usada && accion.venceEn > ahora;
      return Promise.resolve(vigente ? { salaId: accion.salaId, accion: accion.accion } : null);
    },
    consumirAccion: (tokenHash, ahora) => {
      const accion = acciones.get(tokenHash);
      if (!accion || accion.usada || accion.venceEn <= ahora) return Promise.resolve(null);
      accion.usada = true;
      return Promise.resolve({ salaId: accion.salaId, accion: accion.accion });
    },
    registrarAire: (entrada) => {
      registro.push(entrada);
      return Promise.resolve();
    },
    listarAire: (limite) => Promise.resolve([...registro].reverse().slice(0, limite)),
    borrarTodo: () => {
      segmentos.clear();
      acciones.clear();
      registro.length = 0;
      return Promise.resolve();
    },
  };
}
