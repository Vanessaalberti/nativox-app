import { AJUSTES_POR_DEFECTO, esquemaAjustes, validar, type Ajustes } from "@compartido/contratos";
import type { AlmacenAjustes } from "./almacen-ajustes";

export const CLAVE_DE_AJUSTES = "general";
export const CLAVE_DEL_WEBHOOK = "webhook";

// Los ajustes guardados; si no hay ninguno o no se pueden leer, los de por defecto.
export async function leerAjustesGuardados(almacen: AlmacenAjustes): Promise<Ajustes> {
  const guardado = await almacen.leer(CLAVE_DE_AJUSTES);
  if (guardado === null) return AJUSTES_POR_DEFECTO;
  let leido: unknown = null;
  try {
    leido = JSON.parse(guardado);
  } catch {
    // Un ajuste guardado que no se puede leer se ignora: se vuelve a los valores por defecto.
  }
  const validos = validar(esquemaAjustes, leido);
  return validos.ok ? validos.valor : AJUSTES_POR_DEFECTO;
}
