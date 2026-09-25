// Lo que comparten las pantallas que cambian algo y después vuelven a pedir la lista: corre la
// acción y, si salió bien, recarga. Devuelve el motivo si falló (null si salió bien).
export function useConRecarga(recargar: () => Promise<void>) {
  return async (accion: () => Promise<{ ok: true } | { ok: false; motivo: string }>) => {
    const respuesta = await accion();
    if (!respuesta.ok) return respuesta.motivo;
    await recargar();
    return null;
  };
}
