import * as v from "valibot";

export type Resultado<T> = { ok: true; valor: T } | { ok: false; motivo: string };

type EsquemaCualquiera = v.GenericSchema<unknown, unknown>;

// Todo lo que entra de afuera pasa por acá: un dato inválido es un resultado esperable
// (un cliente viejo, un mensaje roto), no una excepción.
export function validar<E extends EsquemaCualquiera>(
  esquema: E,
  dato: unknown,
): Resultado<v.InferOutput<E>> {
  const resultado = v.safeParse(esquema, dato);
  if (resultado.success) {
    return { ok: true, valor: resultado.output };
  }
  return { ok: false, motivo: describirProblemas(resultado.issues) };
}

function describirProblemas(problemas: readonly v.BaseIssue<unknown>[]): string {
  return problemas
    .map((problema) => {
      const ruta = v.getDotPath(problema);
      return ruta ? `${ruta}: ${problema.message}` : problema.message;
    })
    .join("; ");
}
