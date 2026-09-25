import type { Linea } from "@compartido/contratos";

export type AccionDeAviso = "reiniciar" | "pasar-a-la-nube" | "silenciar-avisos";

export interface SegmentoGuardado {
  id: string;
  original: string;
  traducciones: Linea["traducciones"];
  inicio: number;
  fin: number;
}

export interface EntradaDelRegistro {
  salida: number;
  salaId: string | null;
  desde: number;
}

// Lo que la operación de las salas necesita guardar. Las implementaciones son D1 (la real) y la de
// memoria (pruebas).
export interface AlmacenOperacion {
  // Guarda (o actualiza, por id) una frase confirmada de la sala, asociada a la charla en curso.
  guardarSegmento: (
    salaId: string,
    charlaId: string | null,
    linea: Linea,
    ahora: number,
  ) => Promise<void>;
  listarSegmentos: (charlaId: string) => Promise<SegmentoGuardado[]>;

  // Los links de los avisos: solo se guarda el hash del token.
  crearAccion: (
    tokenHash: string,
    salaId: string,
    accion: AccionDeAviso,
    venceEn: number,
  ) => Promise<void>;
  // Sin gastarlo: para mostrar qué va a pasar antes de que la persona confirme.
  leerAccion: (
    tokenHash: string,
    ahora: number,
  ) => Promise<{ salaId: string; accion: AccionDeAviso } | null>;
  // Lo gasta: devuelve la acción una sola vez y solo si no venció.
  consumirAccion: (
    tokenHash: string,
    ahora: number,
  ) => Promise<{ salaId: string; accion: AccionDeAviso } | null>;

  registrarAire: (entrada: EntradaDelRegistro) => Promise<void>;
  listarAire: (limite: number) => Promise<EntradaDelRegistro[]>;
  borrarTodo: () => Promise<void>;
}
