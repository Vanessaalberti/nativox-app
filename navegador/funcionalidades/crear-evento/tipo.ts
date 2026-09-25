import { esquemaTipoDeEvento, validar, type TipoDeEvento } from "@compartido/contratos";

// El tipo elegido en el paso 1 viaja en la dirección (?tipo=...); si falta o está mal, todo en uno.
export function leerTipo(valor: string | null): TipoDeEvento {
  const tipo = validar(esquemaTipoDeEvento, valor);
  return tipo.ok ? tipo.valor : "todo-en-uno";
}
