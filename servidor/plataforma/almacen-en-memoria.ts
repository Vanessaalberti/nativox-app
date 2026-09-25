import type {
  Administrador,
  AlmacenAcceso,
  EventoGuardado,
  SesionGuardada,
} from "./almacen-acceso";

// El mismo almacén, en memoria: lo usan las pruebas de la API (sin D1 ni Workers).
export function crearAlmacenEnMemoria(): AlmacenAcceso {
  let administrador: Administrador | null = null;
  let evento: EventoGuardado | null = null;
  const sesiones = new Map<string, SesionGuardada & { venceEn: number }>();
  const intentos: { clave: string; momento: number }[] = [];

  return {
    leerAdministrador: () => Promise.resolve(administrador),
    crearAdministrador: (nuevo) => {
      if (administrador) return Promise.resolve(false);
      administrador = { ...nuevo };
      return Promise.resolve(true);
    },
    cambiarCredenciales: (credenciales) => {
      if (administrador) administrador = { ...administrador, ...credenciales };
      return Promise.resolve();
    },
    leerEvento: () => Promise.resolve(evento),
    crearEvento: (datos) => {
      if (evento) return Promise.resolve(false);
      evento = {
        ...datos,
        logo: datos.logo ?? null,
        fechaInicio: datos.fechaInicio ?? null,
        fechaFin: datos.fechaFin ?? null,
      };
      return Promise.resolve(true);
    },
    guardarSesion: (tokenHash, sesion, _creadaEn, venceEn) => {
      sesiones.set(tokenHash, { ...sesion, venceEn });
      return Promise.resolve();
    },
    leerSesion: (tokenHash, ahora) => {
      const sesion = sesiones.get(tokenHash);
      if (!sesion || sesion.venceEn <= ahora) return Promise.resolve(null);
      return Promise.resolve({ rol: sesion.rol, cuentaId: sesion.cuentaId });
    },
    borrarSesion: (tokenHash) => {
      sesiones.delete(tokenHash);
      return Promise.resolve();
    },
    borrarSesionesDe: (rol, cuentaId) => {
      for (const [hash, sesion] of sesiones) {
        if (sesion.rol === rol && sesion.cuentaId === cuentaId) sesiones.delete(hash);
      }
      return Promise.resolve();
    },
    contarIntentos: (clave, desde) =>
      Promise.resolve(
        intentos.filter((intento) => intento.clave === clave && intento.momento > desde).length,
      ),
    registrarIntento: (clave, ahora) => {
      intentos.push({ clave, momento: ahora });
      return Promise.resolve();
    },
    borrarIntentos: (clave) => {
      for (let i = intentos.length - 1; i >= 0; i -= 1) {
        if (intentos[i]?.clave === clave) intentos.splice(i, 1);
      }
      return Promise.resolve();
    },
  };
}
